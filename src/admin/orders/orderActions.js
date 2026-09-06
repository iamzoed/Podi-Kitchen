import { supabase } from '../../lib/supabaseClient'

// Every write here goes through the same `orders` row the admin dashboard
// already fetched with RLS-scoped SELECT, so no separate permission check is
// needed client-side — the database (Phase 1's admin RLS policy + Phase 2's
// transition trigger) is the real authority. `.eq('status', expectedStatus)`
// is an optimistic-concurrency guard: if another admin already changed the
// status, this WHERE clause won't match and we get zero rows back instead of
// silently clobbering their change.
// `columns` lets a caller that doesn't need the full row back (Kitchen only
// reloads its own already-redacted list after this) avoid pulling
// customer_name/phone/price into a PATCH response it's going to discard —
// same reasoning as the explicit select() in useKitchenOrders.js.
export async function updateOrderStatus({ orderId, expectedStatus, newStatus, reason, columns = '*' }) {
  const payload = { status: newStatus }
  if (newStatus === 'REJECTED') payload.rejection_reason = reason
  if (newStatus === 'CANCELLED') payload.cancellation_reason = reason

  const { data, error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', orderId)
    .eq('status', expectedStatus)
    .select(columns)
    .maybeSingle()

  if (error) return { error }
  if (!data) return { conflict: true }
  return { order: data }
}

// Phase 3: assignments now target an authenticated DELIVERY-role user, not
// free text. delivery_person_name is still set alongside delivery_person_id
// so every existing display spot (order cards, delivery dashboard) that
// already reads delivery_person_name keeps working unchanged. Passing
// deliveryUserId: null clears the assignment.
export async function assignDeliveryUser({ orderId, deliveryUserId, deliveryName }) {
  const { data, error } = await supabase
    .from('orders')
    .update({ delivery_person_id: deliveryUserId, delivery_person_name: deliveryName || null })
    .eq('id', orderId)
    .select()
    .maybeSingle()

  if (error) return { error }
  return { order: data }
}

// Lists DELIVERY-role users for the assignment dropdown, resolving a
// display name from profiles — never touches auth.users directly (RLS on
// admins/profiles from 004_kitchen_delivery_roles.sql scopes this to
// exactly the DELIVERY-role rows an operational admin is allowed to see).
export async function fetchDeliveryUsers() {
  const { data: deliveryAdmins, error } = await supabase.from('admins').select('user_id').eq('role', 'DELIVERY')
  if (error) return { users: [], error }
  if (!deliveryAdmins?.length) return { users: [] }

  const ids = deliveryAdmins.map((r) => r.user_id)
  const { data: profiles } = await supabase.from('profiles').select('id, name, phone').in('id', ids)

  const users = deliveryAdmins.map((r) => {
    const p = profiles?.find((pr) => pr.id === r.user_id)
    return { id: r.user_id, name: p?.name || 'Unnamed delivery user', phone: p?.phone || '' }
  })
  return { users }
}

export async function fetchOrderItems(orderId) {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  return { items: data || [], error }
}

export async function fetchOrderHistory(orderId) {
  const { data, error } = await supabase
    .from('order_status_history')
    .select('*')
    .eq('order_id', orderId)
    .order('changed_at', { ascending: true })
  return { history: data || [], error }
}

export async function fetchOrder(orderId) {
  const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle()
  return { order: data, error }
}
