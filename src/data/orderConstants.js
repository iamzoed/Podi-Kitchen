// Mirrors the CHECK constraints on orders.status / orders.payment_status in
// supabase/migrations/002_orders_and_roles.sql — keep these two in sync.

export const ORDER_STATUS = {
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  PACKED: 'PACKED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
}

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  NOT_REQUIRED: 'NOT_REQUIRED',
}

export const ADMIN_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  KITCHEN: 'KITCHEN',
  DELIVERY: 'DELIVERY',
}

// Which admin tabs each role can reach. RLS is the real enforcement (see
// 004_kitchen_delivery_roles.sql / 005_kitchen_capacity.sql); this only
// decides navigation/routing. Capacity settings themselves are further
// restricted to SUPER_ADMIN-write within the Capacity tab (ADMIN gets a
// read-only view) — see CapacityDashboard.jsx.
export const ROLE_TABS = {
  SUPER_ADMIN: ['orders', 'kitchen', 'delivery', 'capacity', 'menu'],
  ADMIN: ['orders', 'kitchen', 'delivery', 'capacity', 'menu'],
  KITCHEN: ['kitchen'],
  DELIVERY: ['delivery'],
}

export const ORDER_STATUS_LABEL = {
  PENDING_CONFIRMATION: 'Pending Confirmation',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  PACKED: 'Packed',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
}

// UI-only mirror of the transition graph enforced for real by the
// `orders_validate_status_transition` trigger in
// supabase/migrations/003_order_status_history_and_delivery.sql — this only
// decides which buttons to show; the database is what actually stops an
// invalid transition, including for SUPER_ADMIN.
export const ORDER_STATUS_TRANSITIONS = {
  PENDING_CONFIRMATION: ['CONFIRMED', 'REJECTED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['PACKED', 'CANCELLED'],
  PACKED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
}

export const TERMINAL_ORDER_STATUSES = ['DELIVERED', 'CANCELLED', 'REJECTED']

// Written out as full class strings (not template-built) so Tailwind's
// content scanner picks them up at build time.
export const ORDER_STATUS_COLOR = {
  PENDING_CONFIRMATION: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  CONFIRMED: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  PREPARING: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  PACKED: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  OUT_FOR_DELIVERY: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
}
