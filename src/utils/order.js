import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { googleMapsLink } from './location'

// Postgres error codes raised by create_order_with_capacity() in
// 005_kitchen_capacity.sql — their message text is already customer-safe
// (I wrote it), so these are shown as-is. Anything else is an unexpected/
// technical failure and gets a generic message instead of leaking raw
// Postgres/PostgREST text to a customer.
const CAPACITY_ERROR_CODES = new Set(['P0010', 'P0011', 'P0012', 'P0013', 'P0014'])

export function computeLinePrice(menuItem, variant, addonIds) {
  const addonTotal = menuItem.addons
    .filter((a) => addonIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0)
  return menuItem.basePrice + (variant?.priceDelta || 0) + addonTotal
}

export function cartTotal(lines) {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0)
}

// Rebuilds a cart line from a past order_items row for the "Reorder" feature.
// Deliberately re-prices against the *current* live menu (not the order's
// old price snapshot) — if a price changed since, reordering should reflect
// today's price, same as adding it fresh. Returns null if the item has since
// been removed from the menu (menu_item_id is nullable/ON DELETE SET NULL),
// so the caller can skip it and tell the customer it's no longer available.
export function reorderLineFromSnapshot(orderItem, currentMenu) {
  const menuItem = currentMenu.find((m) => m.id === orderItem.menu_item_id)
  if (!menuItem) return null

  const variant = menuItem.variants.find((v) => v.name === orderItem.size_label) || menuItem.variants[0] || null
  const addonNames = new Set((orderItem.addons || []).map((a) => a.name))
  const addons = menuItem.addons.filter((a) => addonNames.has(a.name))

  return {
    menuItem,
    variant,
    qty: orderItem.quantity,
    spiceLevel: orderItem.spice_level || null,
    addons,
    unitPrice: computeLinePrice(menuItem, variant, addons.map((a) => a.id)),
  }
}

export function buildWhatsAppMessage({ lines, customer, shopInfo, orderNumber, location }) {
  const rows = lines.map((line, i) => {
    const parts = [`${i + 1}. ${line.menuItem.name} (${line.variant.name}) x${line.qty}`]
    if (line.spiceLevel) parts.push(`   Spice: ${line.spiceLevel}`)
    if (line.addons.length) parts.push(`   Add-ons: ${line.addons.map((a) => a.name).join(', ')}`)
    parts.push(`   ₹${line.unitPrice * line.qty}`)
    return parts.join('\n')
  })

  const total = cartTotal(lines)

  const message = [
    `New order — ${shopInfo.name}`,
    orderNumber ? `Order #${orderNumber}` : null,
    '',
    ...rows,
    '',
    `Total: ₹${total}`,
    '',
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Address: ${customer.address}`,
    customer.landmark ? `Landmark: ${customer.landmark}` : null,
    customer.notes ? `Notes: ${customer.notes}` : null,
    location ? 'Delivery Location:' : null,
    location ? googleMapsLink(location.lat, location.lng) : null,
    '',
    'Note: this order is pending confirmation — we\'ll confirm shortly on WhatsApp.',
  ]
    .filter(Boolean)
    .join('\n')

  return message
}

export function whatsAppOrderLink({ lines, customer, shopInfo, orderNumber, location }) {
  const message = buildWhatsAppMessage({ lines, customer, shopInfo, orderNumber, location })
  return `https://wa.me/${shopInfo.whatsappNumber}?text=${encodeURIComponent(message)}`
}

// No phone number in the wa.me URL — that's what makes it a *share* link
// (opens WhatsApp's own contact/status picker) rather than a message to us.
export function whatsAppShareLink(message) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

// Persists the order (and a full snapshot of each line item) in one
// database transaction via create_order_with_capacity() — capacity is
// checked and atomically reserved, then the order and its items are
// created, all inside a single function call. If capacity is exceeded
// partway through, the whole call rolls back: no order, no partial
// reservation, nothing left half-done. See 005_kitchen_capacity.sql for the
// full logic and why this has to be one DB call rather than two client-side
// inserts (that pattern can race between two simultaneous customers).
export async function createOrder({ lines, customer, userId, location }) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Ordering is temporarily unavailable. Please try again in a moment.') }
  }
  if (!lines?.length) {
    return { error: new Error('Your cart is empty.') }
  }
  if (!customer?.name || !customer?.phone || !customer?.address) {
    return { error: new Error('Please fill in your name, phone, and delivery address.') }
  }

  const items = lines.map((line) => ({
    menu_item_id: line.menuItem.id,
    item_name_snapshot: line.menuItem.name,
    unit_price_snapshot: line.menuItem.basePrice,
    quantity: line.qty,
    size_label: line.variant?.name || null,
    size_price_delta: line.variant?.priceDelta || 0,
    spice_level: line.spiceLevel || null,
    addons: line.addons.map((a) => ({ name: a.name, price: a.price })),
  }))

  // Location params are only included when present, not sent as explicit
  // nulls — so this keeps working against the pre-006-migration function
  // signature too (manual-address checkout is never blocked on the
  // migration having been run yet; only a GPS-tagged order would fail, and
  // only until the migration is applied).
  const rpcArgs = {
    p_customer_name: customer.name,
    p_customer_phone: customer.phone,
    p_delivery_address: customer.address,
    p_landmark: customer.landmark || null,
    p_order_notes: customer.notes || null,
    p_user_id: userId || null,
    p_items: items,
  }
  if (location) {
    rpcArgs.p_delivery_latitude = location.lat
    rpcArgs.p_delivery_longitude = location.lng
    rpcArgs.p_delivery_location_accuracy_m = location.accuracy ?? null
  }

  const { data, error } = await supabase.rpc('create_order_with_capacity', rpcArgs)

  if (error) {
    const friendly = error.code && CAPACITY_ERROR_CODES.has(error.code)
    return { error: new Error(friendly ? error.message : 'Something went wrong saving your order. Please try again.') }
  }

  return { order: data }
}
