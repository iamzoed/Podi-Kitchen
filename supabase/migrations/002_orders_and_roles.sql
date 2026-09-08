-- States&Swaad — Phase 1: order storage + admin roles
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Additive only: does not touch menu_items, does not drop or rewrite
-- existing admins/profiles data. Safe to re-run (idempotent).

-- ============================================================================
-- 1. ADMIN ROLES
-- ============================================================================
-- Every existing admin row becomes 'ADMIN' by default — nobody is silently
-- promoted. See the bottom of this file for the one-time manual step to
-- make your own account SUPER_ADMIN.
alter table admins add column if not exists role text not null default 'ADMIN';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'admins_role_check'
  ) then
    alter table admins add constraint admins_role_check
      check (role in ('SUPER_ADMIN', 'ADMIN'));
      -- Adding KITCHEN/DELIVERY later is a one-line constraint update, not a
      -- redesign: `alter table admins drop constraint admins_role_check;
      -- alter table admins add constraint admins_role_check check (role in
      -- ('SUPER_ADMIN','ADMIN','KITCHEN','DELIVERY'));`
  end if;
end $$;

-- SECURITY DEFINER role-check functions. RLS policies must call these
-- instead of querying `admins` directly inside a policy defined ON
-- `admins` — doing that inline causes infinite recursion (Postgres
-- re-evaluates admins' RLS while already evaluating admins' RLS). A
-- SECURITY DEFINER function runs as its owner and bypasses RLS internally,
-- so it can safely read `admins` from within any policy, including
-- admins' own policies.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from admins where user_id = auth.uid() and role = 'SUPER_ADMIN'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;

-- Replace admins' RLS: self-check stays (used by useIsAdmin today), and
-- super admins additionally get full read/write so a future "manage
-- admins" screen has a secure foundation. A plain ADMIN can never write to
-- this table, so they can never promote themselves or anyone else.
drop policy if exists "a user can check their own admin membership" on admins;
create policy "admins can read their own row, super admins read all"
  on admins for select
  using (auth.uid() = user_id or public.is_super_admin());

drop policy if exists "super admins can insert admins" on admins;
create policy "super admins can insert admins"
  on admins for insert
  with check (public.is_super_admin());

drop policy if exists "super admins can update admin roles" on admins;
create policy "super admins can update admin roles"
  on admins for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "super admins can delete admins" on admins;
create policy "super admins can delete admins"
  on admins for delete
  using (public.is_super_admin());

-- ============================================================================
-- 2. ORDERS
-- ============================================================================
create sequence if not exists order_number_seq start 1;

create or replace function public.generate_order_number()
returns text
language sql
as $$
  select 'PK' || to_char(now(), 'YYMMDD') || '-' || lpad(nextval('order_number_seq')::text, 4, '0');
$$;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null default public.generate_order_number(),
  user_id uuid references auth.users(id) on delete set null, -- null for guest checkout
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  landmark text,
  order_notes text,
  subtotal numeric not null default 0 check (subtotal >= 0),
  delivery_charge numeric not null default 0 check (delivery_charge >= 0),
  discount numeric not null default 0 check (discount >= 0),
  total numeric not null default 0 check (total >= 0),
  payment_method text not null default 'COD',
  payment_status text not null default 'NOT_REQUIRED'
    check (payment_status in ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'NOT_REQUIRED')),
  status text not null default 'PENDING_CONFIRMATION'
    check (status in (
      'PENDING_CONFIRMATION', 'CONFIRMED', 'PREPARING', 'PACKED',
      'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'
    )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  rejection_reason text,
  cancellation_reason text
);

create unique index if not exists orders_order_number_key on orders(order_number);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_at_idx on orders(created_at desc);
create index if not exists orders_user_id_idx on orders(user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_touch_updated_at on orders;
create trigger orders_touch_updated_at
  before update on orders
  for each row execute procedure public.touch_updated_at();

-- ============================================================================
-- 3. ORDER ITEMS — full snapshot, no dependency on menu_items surviving
-- ============================================================================
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id text references menu_items(id) on delete set null, -- nullable on purpose
  item_name_snapshot text not null,
  unit_price_snapshot numeric not null check (unit_price_snapshot >= 0),
  quantity int not null check (quantity > 0),
  size_label text,
  size_price_delta numeric not null default 0,
  spice_level text,
  addons jsonb not null default '[]', -- [{"name": "...", "price": 15}, ...]
  item_total numeric not null default 0 check (item_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on order_items(order_id);
create index if not exists order_items_menu_item_id_idx on order_items(menu_item_id);

-- Server-computed item total — whatever the browser sends for item_total is
-- overwritten with unit_price + size delta + sum(addon prices), times qty.
create or replace function public.compute_order_item_total()
returns trigger
language plpgsql
as $$
declare
  addons_sum numeric;
begin
  select coalesce(sum((a->>'price')::numeric), 0)
  into addons_sum
  from jsonb_array_elements(coalesce(new.addons, '[]'::jsonb)) a;

  new.item_total := (new.unit_price_snapshot + coalesce(new.size_price_delta, 0) + addons_sum) * new.quantity;
  return new;
end;
$$;

drop trigger if exists order_items_compute_total on order_items;
create trigger order_items_compute_total
  before insert or update on order_items
  for each row execute procedure public.compute_order_item_total();

-- Server-computed order subtotal/total — recalculated from the authoritative
-- item_total values the moment items are attached, overwriting whatever
-- subtotal/total the browser sent when the order row was first created.
create or replace function public.recompute_order_totals()
returns trigger
language plpgsql
as $$
declare
  target_order_id uuid;
  computed_subtotal numeric;
begin
  target_order_id := coalesce(new.order_id, old.order_id);

  select coalesce(sum(item_total), 0) into computed_subtotal
  from order_items where order_id = target_order_id;

  update orders
  set subtotal = computed_subtotal,
      total = computed_subtotal + delivery_charge - discount
  where id = target_order_id;

  return null;
end;
$$;

drop trigger if exists order_items_recompute_order_totals on order_items;
create trigger order_items_recompute_order_totals
  after insert or update or delete on order_items
  for each row execute procedure public.recompute_order_totals();

-- ============================================================================
-- 4. RLS — orders / order_items
-- ============================================================================
alter table orders enable row level security;

-- Guest checkout requirement: anyone can create an order (no login needed).
drop policy if exists "anyone can create an order" on orders;
create policy "anyone can create an order"
  on orders for insert
  with check (true);

-- Signed-in customers can see their own past orders. Guests get nothing
-- back (no stable identity to check against) — the app already has the
-- order details in memory right after creating it, so this doesn't block
-- anything today.
drop policy if exists "customers can view their own orders" on orders;
create policy "customers can view their own orders"
  on orders for select
  using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "admins can view all orders" on orders;
create policy "admins can view all orders"
  on orders for select
  using (public.is_admin());

drop policy if exists "admins can update orders" on orders;
create policy "admins can update orders"
  on orders for update
  using (public.is_admin());

-- No delete policy for anyone — orders are never deleted, only cancelled/
-- rejected via status, so history is always intact.

alter table order_items enable row level security;

-- Items can only be attached to a freshly-created, still-pending order —
-- narrows (does not eliminate) the guest-checkout risk of someone
-- inserting items onto an order id that isn't theirs, since order ids are
-- unguessable UUIDs and the window closes automatically.
drop policy if exists "order items can be added shortly after order creation" on order_items;
create policy "order items can be added shortly after order creation"
  on order_items for insert
  with check (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and o.status = 'PENDING_CONFIRMATION'
        and o.created_at > now() - interval '10 minutes'
    )
  );

drop policy if exists "customers can view their own order items" on order_items;
create policy "customers can view their own order items"
  on order_items for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and auth.uid() is not null
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "admins can view all order items" on order_items;
create policy "admins can view all order items"
  on order_items for select
  using (public.is_admin());

drop policy if exists "admins can update order items" on order_items;
create policy "admins can update order items"
  on order_items for update
  using (public.is_admin());

-- ============================================================================
-- 5. ONE-TIME MANUAL STEP (do this yourself after running the migration)
-- ============================================================================
-- Nobody is auto-promoted. Find your own user id in the Supabase dashboard
-- (Authentication -> Users -> copy your UID), then run:
--
--   update admins set role = 'SUPER_ADMIN' where user_id = 'paste-your-uid-here';
--
-- Every other existing admin stays at the safe 'ADMIN' default until you
-- explicitly change them.
