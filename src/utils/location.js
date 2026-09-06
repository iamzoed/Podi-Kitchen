// Delivery-radius config — all optional. Unset (any of the three missing)
// means the eligibility check is simply skipped everywhere: GPS + address
// capture still work, checkout is never blocked on an unconfigured business
// rule. Fill these in .env (see .env.example) with your real kitchen
// location once you know it — do not guess/hardcode a coordinate here.
const RAW_LAT = import.meta.env.VITE_DELIVERY_CENTER_LAT
const RAW_LNG = import.meta.env.VITE_DELIVERY_CENTER_LNG
const RAW_RADIUS = import.meta.env.VITE_DELIVERY_RADIUS_KM

export const deliveryAreaConfigured = Boolean(RAW_LAT && RAW_LNG && RAW_RADIUS)
const DELIVERY_CENTER_LAT = Number(RAW_LAT)
const DELIVERY_CENTER_LNG = Number(RAW_LNG)
const DELIVERY_RADIUS_KM = Number(RAW_RADIUS)

// Default false: outside-radius is a warning, not a hard block — a home
// kitchen may still want to accept a slightly-outside order via WhatsApp.
// Set VITE_DELIVERY_RADIUS_BLOCK=true to refuse checkout instead.
export const deliveryRadiusBlocks = import.meta.env.VITE_DELIVERY_RADIUS_BLOCK === 'true'

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// { checked: false } when unconfigured — caller should skip showing any
// eligibility badge at all in that case, rather than showing a wrong one.
export function checkDeliveryEligibility(lat, lng) {
  if (!deliveryAreaConfigured) return { checked: false, withinRadius: true, distanceKm: null }
  const distanceKm = haversineDistanceKm(lat, lng, DELIVERY_CENTER_LAT, DELIVERY_CENTER_LNG)
  return { checked: true, withinRadius: distanceKm <= DELIVERY_RADIUS_KM, distanceKm }
}

export function googleMapsLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

// Reverse geocoding via OpenStreetMap's Nominatim — free, no API key,
// browser-callable (CORS-enabled). Only called once per explicit "Use my
// current location" tap, which for a single home kitchen's order volume is
// comfortably within Nominatim's usage policy (nominatim.org/release-docs,
// max ~1 req/sec, non-bulk use). If this business ever needs a more robust/
// production-grade geocoder, swap this for a keyed provider behind a small
// server-side proxy — never put a paid API key in frontend source.
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=0`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.display_name || null
  } catch {
    return null
  }
}
