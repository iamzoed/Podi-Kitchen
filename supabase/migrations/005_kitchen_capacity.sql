-- Podi Kitchen — Phase 4: kitchen capacity, item-level limits, and
-- transaction-safe order-capacity reservation.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Additive only. All capacity values below start unconfigured (null/off) —
-- see the bottom of this file for exactly what to set and where.

-- ============================================================================
-- 1. KITCHEN SETTINGS — singleton row, SUPER_ADMIN-writable only
-- ============================================================================
create table if not exists kitchen_settings (
  id int primary key default 1 check (id = 1),
  max_orders_per_day int,               -- null = no limit
  max_portions_per_day int,             -- null = no limit
  max_prep_workload int,                -- reserved for a future phase once "workload" is defined beyond portion count; not enforced yet
  opening_time time,                    -- null = no time-based restriction
  closing_time time,
  ordering_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into kitchen_settings (id) values (1) on conflict (id) do nothing;

alter table kitchen_settings enable row level security;

drop policy if exists "staff can view kitchen settings" on kitchen_settings;
create policy "staff can view kitchen settings"
  on kitchen_settings for select
  using (public.is_admin());

drop policy if exists "super admin can update kitchen settings" on kitchen_settings;
create policy "super admin can update kitchen settings"
  on kitchen_settings for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

create or replace function public.touch_kitchen_settings()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists kitchen_settings_touch on kitchen_settings;
create trigger kitchen_settings_touch
  before update on kitchen_settings
  for each row execute procedure public.touch_kitchen_settings();

-- ============================================================================
-- 2. ITEM-LEVEL CAPACITY — optional per-item daily portion limit
-- ============================================================================
alter table menu_items add column if not exists max_portions_per_day int; -- null = follows overall kitchen capacity only

-- menu_items writes are already SUPER_ADMIN/ADMIN via Phase 3's
-- is_operational_admin() policy. Item capacity limits specifically are
-- SUPER_ADMIN-only per the brief — RLS can't express "this one column is
-- more restricted than the rest of the row," so a trigger closes that gap
-- (same pattern as Phase 3's role-scoped order-update trigger).
create or replace function public.enforce_item_capacity_super_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.max_portions_per_day is distinct from old.max_portions_per_day and not public.is_super_admin() then
    raise exception 'Only a Super Admin can change item capacity limits.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists menu_items_enforce_capacity_super_admin on menu_items;
create trigger menu_items_enforce_capacity_super_admin
  before update on menu_items
  for each row execute procedure public.enforce_item_capacity_super_admin_only();

-- ============================================================================
-- 3. DAILY COUNTERS — the actual capacity ledger, service-day keyed
-- ============================================================================
-- service_date is always computed as (now() at time zone 'Asia/Kolkata')::date
-- server-side — never from the customer's browser — so a new day starts
-- fresh automatically with no manual reset.
create table if not exists daily_capacity_counters (
  service_date date primary key,
  orders_count int not null default 0,
  portions_count int not null default 0
);

create table if not exists daily_item_capacity_counters (
  service_date date not null,
  menu_item_id text not null references menu_items(id) on delete cascade,
  portions_count int not null default 0,
  primary key (service_date, menu_item_id)
);

alter table daily_capacity_counters enable row level security;
alter table daily_item_capacity_counters enable row level security;

drop policy if exists "staff can view daily capacity counters" on daily_capacity_counters;
create policy "staff can view daily capacity counters"
  on daily_capacity_counters for select
  using (public.is_admin());

drop policy if exists "staff can view daily item capacity counters" on daily_item_capacity_counters;
create policy "staff can view daily item capacity counters"
  on daily_item_capacity_counters for select
  using (public.is_admin());

-- Deliberately no insert/update/delete policy for any client role on either
-- counter table — only the SECURITY DEFINER functions below ever write to
-- them, so a customer can never inflate remaining capacity or forge sold
-- counts, regardless of what their browser sends.

-- ============================================================================
-- 4. ORDER CREATION — one transaction: check capacity, reserve it, create
-- the order. Replaces the two separate client-side inserts from Phase 1.
-- ============================================================================
create or replace function public.create_order_with_capacity(
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address text,
  p_landmark text,
  p_order_notes text,
  p_user_id uuid,
  p_items jsonb
)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service_date date := (now() at time zone 'Asia/Kolkata')::date;
  v_current_time time := (now() at time zone 'Asia/Kolkata')::time;
  v_settings kitchen_settings%rowtype;
  v_total_portions int := 0;
  v_item jsonb;
  v_item_id text;
  v_item_qty int;
  v_item_name text;
  v_item_max int;
  v_order orders;
begin
  select * into v_settings from kitchen_settings where id = 1;

  if v_settings.ordering_enabled is false then
    raise exception 'Sorry, we''re not taking orders right now. Please check back later.' using errcode = 'P0010';
  end if;

  if v_settings.opening_time is not null and v_settings.closing_time is not null
     and (v_current_time < v_settings.opening_time or v_current_time > v_settings.closing_time) then
    raise exception 'Sorry, we''re currently closed. Please check our hours and try again.' using errcode = 'P0013';
  end if;

  select coalesce(sum((elem->>'quantity')::int), 0) into v_total_portions
  from jsonb_array_elements(p_items) elem;

  if v_total_portions <= 0 then
    raise exception 'Your cart is empty.' using errcode = 'P0014';
  end if;

  -- ---- global daily capacity: atomic conditional increment ----
  -- This single UPDATE is the concurrency guard. Two simultaneous callers
  -- both reach this statement; Postgres locks the row for the first one,
  -- the second blocks until the first commits/rolls back, then re-checks
  -- its WHERE condition against the now-updated row. Only one can win when
  -- capacity has exactly one slot left.
  insert into daily_capacity_counters (service_date) values (v_service_date)
  on conflict (service_date) do nothing;

  update daily_capacity_counters
  set orders_count = orders_count + 1,
      portions_count = portions_count + v_total_portions
  where service_date = v_service_date
    and (v_settings.max_orders_per_day is null or orders_count + 1 <= v_settings.max_orders_per_day)
    and (v_settings.max_portions_per_day is null or portions_count + v_total_portions <= v_settings.max_portions_per_day)
  returning service_date into v_service_date; -- reuse the var just to test FOUND

  if not found then
    raise exception 'Sorry, we''re currently at full kitchen capacity for tonight. Please try again later.' using errcode = 'P0011';
  end if;

  -- ---- per-item capacity: same atomic pattern, once per line item ----
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_item_id := v_item->>'menu_item_id';
    v_item_qty := (v_item->>'quantity')::int;
    v_item_name := v_item->>'item_name_snapshot';

    if v_item_id is not null then
      select max_portions_per_day into v_item_max from menu_items where id = v_item_id;

      if v_item_max is not null then
        insert into daily_item_capacity_counters (service_date, menu_item_id) values (v_service_date, v_item_id)
        on conflict (service_date, menu_item_id) do nothing;

        update daily_item_capacity_counters
        set portions_count = portions_count + v_item_qty
        where service_date = v_service_date and menu_item_id = v_item_id
          and portions_count + v_item_qty <= v_item_max
        returning menu_item_id into v_item_id;

        if not found then
          raise exception 'Sorry, % is sold out for tonight.', v_item_name using errcode = 'P0012';
        end if;
      end if;
    end if;
  end loop;

  -- Capacity is now safely reserved for every item — create the order.
  insert into orders (
    user_id, customer_name, customer_phone, delivery_address, landmark, order_notes,
    delivery_charge, discount, payment_method, payment_status, status
  ) values (
    p_user_id, p_customer_name, p_customer_phone, p_delivery_address, p_landmark, p_order_notes,
    0, 0, 'COD', 'NOT_REQUIRED', 'PENDING_CONFIRMATION'
  ) returning * into v_order;

  insert into order_items (
    order_id, menu_item_id, item_name_snapshot, unit_price_snapshot, quantity,
    size_label, size_price_delta, spice_level, addons
  )
  select
    v_order.id,
    elem->>'menu_item_id',
    elem->>'item_name_snapshot',
    (elem->>'unit_price_snapshot')::numeric,
    (elem->>'quantity')::int,
    elem->>'size_label',
    coalesce((elem->>'size_price_delta')::numeric, 0),
    elem->>'spice_level',
    coalesce(elem->'addons', '[]'::jsonb)
  from jsonb_array_elements(p_items) elem;

  select * into v_order from orders where id = v_order.id; -- pick up server-computed totals from Phase 1's triggers
  return v_order;
end;
$$;

grant execute on function public.create_order_with_capacity(text, text, text, text, text, uuid, jsonb) to anon, authenticated;

-- ============================================================================
-- 5. RELEASE CAPACITY on rejection/cancellation
-- ============================================================================
-- Capacity is reserved the moment an order is successfully created
-- (PENDING_CONFIRMATION already reserves it — that's "accepted into the
-- system"). It is only released if the order is later REJECTED or
-- CANCELLED. Nothing else — not a closed browser tab, not any other status
-- change — frees capacity. Keyed off the order's own created_at (its
-- original service date), not "today," so cancelling an old order still
-- credits back the correct day even if that's in the past.
create or replace function public.release_capacity_on_cancellation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service_date date;
  v_total_portions int;
  v_item record;
begin
  if new.status in ('REJECTED', 'CANCELLED') and old.status not in ('REJECTED', 'CANCELLED') then
    v_service_date := (new.created_at at time zone 'Asia/Kolkata')::date;

    select coalesce(sum(quantity), 0) into v_total_portions from order_items where order_id = new.id;

    update daily_capacity_counters
    set orders_count = greatest(0, orders_count - 1),
        portions_count = greatest(0, portions_count - v_total_portions)
    where service_date = v_service_date;

    for v_item in
      select menu_item_id, sum(quantity) as qty
      from order_items
      where order_id = new.id and menu_item_id is not null
      group by menu_item_id
    loop
      update daily_item_capacity_counters
      set portions_count = greatest(0, portions_count - v_item.qty)
      where service_date = v_service_date and menu_item_id = v_item.menu_item_id;
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_release_capacity_on_cancellation on orders;
create trigger orders_release_capacity_on_cancellation
  after update on orders
  for each row execute procedure public.release_capacity_on_cancellation();

-- ============================================================================
-- 6. PUBLIC-SAFE STATUS FUNCTIONS — what the customer site is allowed to see
-- ============================================================================
-- Deliberately returns only a boolean + a reason code and AVAILABLE/LIMITED/
-- SOLD_OUT per item — never raw counts, settings, or internal workload.
create or replace function public.get_ordering_status()
returns table(ordering_open boolean, closed_reason text)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_settings kitchen_settings%rowtype;
  v_current_time time := (now() at time zone 'Asia/Kolkata')::time;
  v_service_date date := (now() at time zone 'Asia/Kolkata')::date;
  v_counter daily_capacity_counters%rowtype;
begin
  select * into v_settings from kitchen_settings where id = 1;

  if v_settings.ordering_enabled is false then
    return query select false, 'closed'::text;
    return;
  end if;

  if v_settings.opening_time is not null and v_settings.closing_time is not null
     and (v_current_time < v_settings.opening_time or v_current_time > v_settings.closing_time) then
    return query select false, 'outside_hours'::text;
    return;
  end if;

  select * into v_counter from daily_capacity_counters where service_date = v_service_date;
  if v_counter is not null then
    if (v_settings.max_orders_per_day is not null and v_counter.orders_count >= v_settings.max_orders_per_day)
       or (v_settings.max_portions_per_day is not null and v_counter.portions_count >= v_settings.max_portions_per_day) then
      return query select false, 'full'::text;
      return;
    end if;
  end if;

  return query select true, null::text;
end;
$$;

grant execute on function public.get_ordering_status() to anon, authenticated;

-- LIMITED threshold: remaining <= max(3, 20% of max). A simple, adjustable-
-- in-code heuristic, not a business figure — change here if you want a
-- different threshold later.
create or replace function public.get_item_availability()
returns table(menu_item_id text, status text)
language sql
security definer
stable
set search_path = public
as $$
  select
    mi.id,
    case
      when mi.max_portions_per_day is null then 'AVAILABLE'
      when coalesce(c.portions_count, 0) >= mi.max_portions_per_day then 'SOLD_OUT'
      when (mi.max_portions_per_day - coalesce(c.portions_count, 0))
             <= greatest(3, round(mi.max_portions_per_day * 0.2)) then 'LIMITED'
      else 'AVAILABLE'
    end
  from menu_items mi
  left join daily_item_capacity_counters c
    on c.menu_item_id = mi.id and c.service_date = (now() at time zone 'Asia/Kolkata')::date
  where mi.available = true;
$$;

grant execute on function public.get_item_availability() to anon, authenticated;

-- ============================================================================
-- MANUAL CONFIGURATION — everything above starts inert until you set it
-- ============================================================================
-- All of kitchen_settings' limits are NULL (no limit) and ordering_enabled
-- is true by default — nothing is capacity-restricted until you configure
-- it from the new Capacity tab in /admin as SUPER_ADMIN (or via SQL below).
-- No per-item limits are set either. Example, NOT executed — replace values
-- and run manually if/when you want limits:
--
--   update kitchen_settings set
--     max_orders_per_day = 40,
--     max_portions_per_day = 200,
--     opening_time = '08:00',
--     closing_time = '20:00'
--   where id = 1;
--
--   update menu_items set max_portions_per_day = 60 where id = 'podi-idli';
