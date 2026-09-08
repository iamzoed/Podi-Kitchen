-- States&Swaad — Phase 2: order status workflow, audit history, delivery
-- assignment foundation, and admin dashboard support.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Additive only: does not touch menu_items, does not alter Phase 1's orders/
-- order_items columns beyond two small nullable additions below.

-- ============================================================================
-- 1. SMALL ADDITIONS TO ORDERS (nullable, non-breaking)
-- ============================================================================
-- rejected_at: Phase 1 had confirmed_at/delivered_at/cancelled_at but missed
-- the REJECTED counterpart — adding it for symmetry, needed to show reject
-- time in the dashboard.
alter table orders add column if not exists rejected_at timestamptz;

-- Minimal delivery-assignment foundation for Phase 3, per the brief: no
-- delivery-user accounts exist yet, so a free-text name is the right amount
-- of structure right now — not a FK to a delivery_persons table that doesn't
-- exist yet.
alter table orders add column if not exists delivery_person_name text;

create index if not exists orders_delivered_at_idx on orders(delivered_at) where delivered_at is not null;

-- ============================================================================
-- 2. STATUS TRANSITION VALIDATION — enforced in the database, not just React
-- ============================================================================
-- Valid graph:
--   PENDING_CONFIRMATION -> CONFIRMED | REJECTED
--   CONFIRMED             -> PREPARING | CANCELLED
--   PREPARING             -> PACKED | CANCELLED
--   PACKED                -> OUT_FOR_DELIVERY | CANCELLED
--   OUT_FOR_DELIVERY      -> DELIVERED
--   DELIVERED / CANCELLED / REJECTED -> terminal, no further transitions
-- Applies to every caller including SUPER_ADMIN — "any valid status" per the
-- brief, not "any status." Non-status field updates (e.g. assigning a
-- delivery person) are unaffected and pass straight through.
create or replace function public.validate_order_status_transition()
returns trigger
language plpgsql
as $$
declare
  allowed boolean;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  allowed := case old.status
    when 'PENDING_CONFIRMATION' then new.status in ('CONFIRMED', 'REJECTED')
    when 'CONFIRMED' then new.status in ('PREPARING', 'CANCELLED')
    when 'PREPARING' then new.status in ('PACKED', 'CANCELLED')
    when 'PACKED' then new.status in ('OUT_FOR_DELIVERY', 'CANCELLED')
    when 'OUT_FOR_DELIVERY' then new.status in ('DELIVERED')
    else false
  end;

  if not allowed then
    raise exception 'Invalid order status transition: % -> %', old.status, new.status
      using errcode = '22023'; -- invalid_parameter_value, distinguishable client-side
  end if;

  if new.status = 'REJECTED' and coalesce(trim(new.rejection_reason), '') = '' then
    raise exception 'A rejection reason is required.' using errcode = '22023';
  end if;
  if new.status = 'CANCELLED' and coalesce(trim(new.cancellation_reason), '') = '' then
    raise exception 'A cancellation reason is required.' using errcode = '22023';
  end if;

  -- Timestamps are stamped server-side from the transition itself, never
  -- trusted from whatever the client sends.
  if new.status = 'CONFIRMED' then new.confirmed_at := now(); end if;
  if new.status = 'REJECTED' then new.rejected_at := now(); end if;
  if new.status = 'CANCELLED' then new.cancelled_at := now(); end if;
  if new.status = 'DELIVERED' then new.delivered_at := now(); end if;

  return new;
end;
$$;

drop trigger if exists orders_validate_status_transition on orders;
create trigger orders_validate_status_transition
  before update on orders
  for each row execute procedure public.validate_order_status_transition();

-- ============================================================================
-- 3. ORDER STATUS HISTORY — append-only audit trail
-- ============================================================================
create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  previous_status text,
  new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_by_email text,
  note text,
  changed_at timestamptz not null default now()
);

create index if not exists order_status_history_order_id_idx on order_status_history(order_id);
create index if not exists order_status_history_changed_at_idx on order_status_history(changed_at desc);

alter table order_status_history enable row level security;

drop policy if exists "admins can view order status history" on order_status_history;
create policy "admins can view order status history"
  on order_status_history for select
  using (public.is_admin());

-- Deliberately no insert/update/delete policy for any client role — this
-- table is only ever written by the trigger below (SECURITY DEFINER, so it
-- bypasses RLS), making history tamper-proof from the client side.

-- Logs every actual status change automatically, capturing who (from the
-- request's own JWT — auth.jwt(), not a client-supplied value) and why (the
-- rejection/cancellation reason, when present).
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into order_status_history (order_id, previous_status, new_status, changed_by, changed_by_email, note)
    values (
      new.id,
      old.status,
      new.status,
      auth.uid(),
      auth.jwt() ->> 'email',
      case
        when new.status = 'REJECTED' then new.rejection_reason
        when new.status = 'CANCELLED' then new.cancellation_reason
        else null
      end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists orders_log_status_change on orders;
create trigger orders_log_status_change
  after update on orders
  for each row execute procedure public.log_order_status_change();

-- ============================================================================
-- 4. EFFICIENT DASHBOARD COUNTERS — one round trip instead of 7
-- ============================================================================
-- Runs as the calling admin (no SECURITY DEFINER) so it's naturally bound by
-- the same orders RLS an admin already has — no privilege change needed.
create or replace function public.order_status_counts()
returns table(bucket text, count bigint)
language sql
stable
as $$
  select 'PENDING_CONFIRMATION', count(*) from orders where status = 'PENDING_CONFIRMATION'
  union all
  select 'CONFIRMED', count(*) from orders where status = 'CONFIRMED'
  union all
  select 'PREPARING', count(*) from orders where status = 'PREPARING'
  union all
  select 'PACKED', count(*) from orders where status = 'PACKED'
  union all
  select 'OUT_FOR_DELIVERY', count(*) from orders where status = 'OUT_FOR_DELIVERY'
  union all
  select 'DELIVERED_TODAY', count(*) from orders
    where status = 'DELIVERED' and delivered_at >= date_trunc('day', now())
  union all
  select 'CANCELLED_REJECTED_TODAY', count(*) from orders
    where status in ('CANCELLED', 'REJECTED')
      and coalesce(cancelled_at, rejected_at) >= date_trunc('day', now());
$$;

grant execute on function public.order_status_counts() to authenticated;

-- ============================================================================
-- 5. REALTIME — so the dashboard updates without a manual refresh
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;
end $$;
