-- Podi Kitchen — delivery location capture.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Additive only: nullable columns, existing orders (and guest checkout) stay
-- valid untouched. No new table, no location history, no tracking — just
-- the one location captured at the moment an order is placed, same as
-- customer_name/phone/address already are.

-- ============================================================================
-- 1. LOCATION COLUMNS ON THE EXISTING orders TABLE
-- ============================================================================
-- numeric(9,6) gives ~11cm precision at the equator — comfortably more than
-- consumer GPS accuracy, no reason for wider precision.
alter table orders add column if not exists delivery_latitude numeric(9,6)
  check (delivery_latitude between -90 and 90);
alter table orders add column if not exists delivery_longitude numeric(9,6)
  check (delivery_longitude between -180 and 180);
-- Accuracy in meters, as reported by the browser's Geolocation API — kept
-- only so a very inaccurate reading can be flagged in the UI; never shown
-- to the customer as a raw number, and not used for anything server-side.
alter table orders add column if not exists delivery_location_accuracy_m numeric
  check (delivery_location_accuracy_m >= 0);

-- No RLS changes needed: these are plain columns on the same orders row
-- already covered by the existing role-scoped SELECT/UPDATE policies from
-- 002/004 — a customer already can't read another customer's order, and
-- that now extends to these columns automatically. KITCHEN's explicit
-- column allowlist in useKitchenOrders.js deliberately does not request
-- these (kitchen has no need for delivery location, same reasoning as
-- customer_name/phone already being excluded there).

-- ============================================================================
-- 2. EXTEND create_order_with_capacity() TO OPTIONALLY STORE LOCATION
-- ============================================================================
-- New params appended at the end with DEFAULT NULL — existing callers that
-- don't pass them keep working unchanged. Everything else in this function
-- is identical to 005_kitchen_capacity.sql; only the final insert into
-- orders and the parameter list changed.
create or replace function public.create_order_with_capacity(
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address text,
  p_landmark text,
  p_order_notes text,
  p_user_id uuid,
  p_items jsonb,
  p_delivery_latitude numeric default null,
  p_delivery_longitude numeric default null,
  p_delivery_location_accuracy_m numeric default null
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

  insert into daily_capacity_counters (service_date) values (v_service_date)
  on conflict (service_date) do nothing;

  update daily_capacity_counters
  set orders_count = orders_count + 1,
      portions_count = portions_count + v_total_portions
  where service_date = v_service_date
    and (v_settings.max_orders_per_day is null or orders_count + 1 <= v_settings.max_orders_per_day)
    and (v_settings.max_portions_per_day is null or portions_count + v_total_portions <= v_settings.max_portions_per_day)
  returning service_date into v_service_date;

  if not found then
    raise exception 'Sorry, we''re currently at full kitchen capacity for tonight. Please try again later.' using errcode = 'P0011';
  end if;

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

  insert into orders (
    user_id, customer_name, customer_phone, delivery_address, landmark, order_notes,
    delivery_charge, discount, payment_method, payment_status, status,
    delivery_latitude, delivery_longitude, delivery_location_accuracy_m
  ) values (
    p_user_id, p_customer_name, p_customer_phone, p_delivery_address, p_landmark, p_order_notes,
    0, 0, 'COD', 'NOT_REQUIRED', 'PENDING_CONFIRMATION',
    p_delivery_latitude, p_delivery_longitude, p_delivery_location_accuracy_m
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

  select * into v_order from orders where id = v_order.id;
  return v_order;
end;
$$;

grant execute on function public.create_order_with_capacity(
  text, text, text, text, text, uuid, jsonb, numeric, numeric, numeric
) to anon, authenticated;

-- ============================================================================
-- MANUAL CONFIGURATION — delivery radius lives in the app's env vars, not
-- here. See .env.example: VITE_DELIVERY_CENTER_LAT / VITE_DELIVERY_CENTER_LNG
-- / VITE_DELIVERY_RADIUS_KM. Nothing to configure in the database for this
-- migration — it only adds storage for whatever the browser captured.
