// Mirrors get_item_availability()'s threshold in
// 005_kitchen_capacity.sql — kept in sync manually since the admin table
// computes this client-side from raw sold/max numbers it already has,
// rather than calling the public RPC a second time.
export function capacityStatus(sold, max) {
  if (max == null) return 'AVAILABLE'
  const remaining = max - sold
  if (remaining <= 0) return 'SOLD_OUT'
  if (remaining <= Math.max(3, Math.round(max * 0.2))) return 'LIMITED'
  return 'AVAILABLE'
}

export function serviceDateIST() {
  // en-CA formats as YYYY-MM-DD, matching Postgres `date`'s text form —
  // lets this be used directly in a .eq('service_date', ...) filter.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}
