-- Podi Kitchen — Phase 3: KITCHEN/DELIVERY roles, role-scoped RLS, delivery
-- user assignment, kitchen/delivery dashboards.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Additive/redefining only: does not drop orders/order_items/admins data.

-- ============================================================================
-- 1. EXTEND ROLES
-- ============================================================================
alter table admins drop constraint if exists admins_role_check;
alter table admins add constraint admins_role_check
  check (role in ('SUPER_ADMIN', 'ADMIN', 'KITCHEN', 'DELIVERY'));

-- SUPER_ADMIN/ADMIN share full operational access; KITCHEN/DELIVERY get
-- narrow, scoped access. Two helper functions instead of overloading
-- is_admin() (Phase 1/2), which stays "is this person staff at all" — used
-- where that broader meaning is still correct (e.g. order_status_history).
create or replace function public.is_operational_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from admins where user_id = auth.uid() and role in ('SUPER_ADMIN', 'ADMIN')
  );
$$;

create or replace function public.has_role(check_role text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid() and role = check_role);
$$;

grant execute on function public.is_operational_admin() to anon, authenticated;
grant execute on function public.has_role(text) to anon, authenticated;

-- ============================================================================
-- 2. DELIVERY USER ASSIGNMENT (authenticated identity, not free text)
-- ============================================================================
-- delivery_person_name (Phase 2) stays for historical orders. New
-- assignments set both columns together (see assignDeliveryUser in the app)
-- so every existing display spot that already reads delivery_person_name
-- keeps working without changes.
alter table orders add column if not exists delivery_person_id uuid references auth.users(id) on delete set null;
create index if not exists orders_delivery_person_id_idx on orders(delivery_person_id);

-- An assigning admin needs to see *who* the delivery-role users are without
-- the app ever touching auth.users directly. Two narrow additive SELECT
-- policies (Postgres OR's multiple policies for the same command together,
-- so these add to, not replace, the existing self-read / super-admin-read
-- policies from Phase 1).
drop policy if exists "admins can view delivery-role users for assignment" on admins;
create policy "admins can view delivery-role users for assignment"
  on admins for select
  using (public.is_operational_admin() and role = 'DELIVERY');

drop policy if exists "admins can view delivery user profiles for assignment" on profiles;
create policy "admins can view delivery user profiles for assignment"
  on profiles for select
  using (
    public.is_operational_admin()
    and exists (select 1 from admins a where a.user_id = profiles.id and a.role = 'DELIVERY')
  );

-- ============================================================================
-- 3. TIGHTEN menu_items — Phase 1 gated writes on is_admin() (any staff row),
-- which now would also cover KITCHEN/DELIVERY. They must not edit the menu.
-- ============================================================================
drop policy if exists "admins can insert menu_items" on menu_items;
create policy "operational admins can insert menu_items"
  on menu_items for insert
  with check (public.is_operational_admin());

drop policy if exists "admins can update menu_items" on menu_items;
create policy "operational admins can update menu_items"
  on menu_items for update
  using (public.is_operational_admin());

drop policy if exists "admins can delete menu_items" on menu_items;
create policy "operational admins can delete menu_items"
  on menu_items for delete
  using (public.is_operational_admin());

-- ============================================================================
-- 4. ROLE-SCOPED orders SELECT
-- ============================================================================
drop policy if exists "admins can view all orders" on orders;

create policy "operational admins can view all orders"
  on orders for select
  using (public.is_operational_admin());

create policy "kitchen can view kitchen-relevant orders"
  on orders for select
  using (public.has_role('KITCHEN') and status in ('CONFIRMED', 'PREPARING', 'PACKED'));

create policy "delivery can view their assigned orders"
  on orders for select
  using (public.has_role('DELIVERY') and delivery_person_id = auth.uid());

-- customers-can-view-their-own-orders policy from Phase 1 is untouched.

-- ============================================================================
-- 5. ROLE-SCOPED orders UPDATE
-- ============================================================================
drop policy if exists "admins can update orders" on orders;

create policy "operational admins can update orders"
  on orders for update
  using (public.is_operational_admin())
  with check (public.is_operational_admin());

create policy "kitchen can update orders they are allowed to progress"
  on orders for update
  using (public.has_role('KITCHEN') and status in ('CONFIRMED', 'PREPARING'))
  with check (public.has_role('KITCHEN'));

create policy "delivery can update their assigned orders in delivery statuses"
  on orders for update
  using (public.has_role('DELIVERY') and delivery_person_id = auth.uid() and status in ('PACKED', 'OUT_FOR_DELIVERY'))
  with check (public.has_role('DELIVERY') and delivery_person_id = auth.uid());

-- RLS policies can't compare OLD vs NEW columns directly (WITH CHECK only
-- sees the new row), so a trigger closes that gap: KITCHEN/DELIVERY may
-- change `status` only — nothing else — and only along their specific
-- allowed transitions. This runs alongside (before, by trigger name
-- ordering) Phase 2's orders_validate_status_transition trigger, which
-- still enforces the universal transition graph for every role including
-- SUPER_ADMIN.
create or replace function public.enforce_role_scoped_order_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_role text;
begin
  select role into acting_role from admins where user_id = auth.uid();

  if acting_role in ('KITCHEN', 'DELIVERY') then
    if new.customer_name is distinct from old.customer_name
      or new.customer_phone is distinct from old.customer_phone
      or new.delivery_address is distinct from old.delivery_address
      or new.landmark is distinct from old.landmark
      or new.order_notes is distinct from old.order_notes
      or new.subtotal is distinct from old.subtotal
      or new.delivery_charge is distinct from old.delivery_charge
      or new.discount is distinct from old.discount
      or new.total is distinct from old.total
      or new.payment_method is distinct from old.payment_method
      or new.payment_status is distinct from old.payment_status
      or new.delivery_person_id is distinct from old.delivery_person_id
      or new.delivery_person_name is distinct from old.delivery_person_name
      or new.rejection_reason is distinct from old.rejection_reason
      or new.cancellation_reason is distinct from old.cancellation_reason
    then
      raise exception 'This role can only change order status.' using errcode = '42501';
    end if;
  end if;

  if acting_role = 'KITCHEN' and new.status is distinct from old.status then
    if not (
      (old.status = 'CONFIRMED' and new.status = 'PREPARING')
      or (old.status = 'PREPARING' and new.status = 'PACKED')
    ) then
      raise exception 'Kitchen can only move Confirmed to Preparing, or Preparing to Packed.' using errcode = '42501';
    end if;
  end if;

  if acting_role = 'DELIVERY' then
    if old.delivery_person_id is distinct from auth.uid() then
      raise exception 'You can only update orders assigned to you.' using errcode = '42501';
    end if;
    if new.status is distinct from old.status and not (
      (old.status = 'PACKED' and new.status = 'OUT_FOR_DELIVERY')
      or (old.status = 'OUT_FOR_DELIVERY' and new.status = 'DELIVERED')
    ) then
      raise exception 'Delivery can only move Packed to Out for Delivery, or Out for Delivery to Delivered.' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_enforce_role_scoped_updates on orders;
create trigger orders_enforce_role_scoped_updates
  before update on orders
  for each row execute procedure public.enforce_role_scoped_order_updates();

-- ============================================================================
-- 6. order_items — cascade the same access as the parent order
-- ============================================================================
drop policy if exists "admins can view all order items" on order_items;
create policy "staff can view items for orders they can access"
  on order_items for select
  using (exists (select 1 from orders o where o.id = order_items.order_id));

drop policy if exists "admins can update order items" on order_items;
create policy "operational admins can update order items"
  on order_items for update
  using (public.is_operational_admin());

-- ============================================================================
-- 7. AUDIT — also log delivery (re)assignment, not just status changes
-- ============================================================================
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
      new.id, old.status, new.status, auth.uid(), auth.jwt() ->> 'email',
      case
        when new.status = 'REJECTED' then new.rejection_reason
        when new.status = 'CANCELLED' then new.cancellation_reason
        else null
      end
    );
  end if;

  if new.delivery_person_id is distinct from old.delivery_person_id then
    insert into order_status_history (order_id, previous_status, new_status, changed_by, changed_by_email, note)
    values (
      new.id, new.status, new.status, auth.uid(), auth.jwt() ->> 'email',
      case when new.delivery_person_id is null then 'Delivery assignment removed' else 'Delivery assigned' end
    );
  end if;

  return new;
end;
$$;
-- Trigger itself (orders_log_status_change) already exists from Phase 2 and
-- points at this function — no need to recreate it.
