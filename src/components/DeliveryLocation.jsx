import { useEffect, useState } from 'react'
import { MapPin, LocateFixed, Loader2, Pencil, CircleAlert } from 'lucide-react'
import { useGeolocation } from '../hooks/useGeolocation'
import { reverseGeocode, checkDeliveryEligibility, deliveryAreaConfigured } from '../utils/location'

const ERROR_MESSAGE = {
  denied: "Location permission was denied. You can enter your address manually.",
  unavailable: "Couldn't detect your location. Please enter your address manually.",
  timeout: "Couldn't detect your location. Please enter your address manually.",
  unsupported: "Your browser doesn't support location detection. Please enter your address manually.",
}

// GPS readings above this are common indoors/on weak signal — still usable,
// but worth a nudge to double-check rather than silently trusting it.
const POOR_ACCURACY_M = 100

// `location` is null or { lat, lng, accuracy, resolvedAddress }. This
// component owns the GPS-capture flow only; the parent owns the resulting
// value (so it can auto-fill/compare against the address field) via
// onChange. Never requests permission on mount — only on the button tap.
export default function DeliveryLocation({ location, onChange }) {
  const geo = useGeolocation()
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    if (geo.status !== 'success' || !geo.coords) return
    let cancelled = false
    setResolving(true)
    reverseGeocode(geo.coords.lat, geo.coords.lng).then((resolvedAddress) => {
      if (cancelled) return
      setResolving(false)
      onChange({ lat: geo.coords.lat, lng: geo.coords.lng, accuracy: geo.accuracy, resolvedAddress })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.status])

  function handleUseLocation() {
    onChange(null)
    geo.request()
  }

  function handleEdit() {
    onChange(null)
    geo.reset()
  }

  if (location) {
    const eligibility = checkDeliveryEligibility(location.lat, location.lng)
    const poorAccuracy = location.accuracy != null && location.accuracy > POOR_ACCURACY_M
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-sm space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="flex items-start gap-1.5 text-emerald-800 font-medium min-w-0">
            <MapPin size={15} className="shrink-0 mt-0.5" />
            <span className="truncate">
              Location detected
              <span className="block text-xs font-normal text-emerald-700 truncate">
                {location.resolvedAddress || 'Please confirm your delivery address below.'}
              </span>
            </span>
          </span>
          <button
            onClick={handleEdit}
            className="shrink-0 flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            <Pencil size={12} /> Edit
          </button>
        </div>

        {poorAccuracy && (
          <p className="flex items-start gap-1 text-xs text-amber-700">
            <CircleAlert size={12} className="shrink-0 mt-0.5" />
            This reading may not be precise — please confirm your address below is correct.
          </p>
        )}

        {deliveryAreaConfigured &&
          (eligibility.withinRadius ? (
            <p className="text-xs text-emerald-700">🟢 Delivery available here</p>
          ) : (
            <p className="text-xs text-amber-700">🔴 This looks outside our current delivery area — we may not be able to deliver here.</p>
          ))}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleUseLocation}
        disabled={geo.status === 'locating' || resolving}
        className="w-full flex items-center justify-center gap-2 border border-brick-200 bg-brick-50 hover:bg-brick-100 disabled:opacity-70 text-brick-700 font-semibold text-sm py-2.5 rounded-full transition-colors duration-150"
      >
        {geo.status === 'locating' || resolving ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Detecting your location…
          </>
        ) : (
          <>
            <LocateFixed size={16} /> Use my current location
          </>
        )}
      </button>
      {geo.status === 'error' && (
        <p className="flex items-start gap-1 text-xs text-gray-500">
          <CircleAlert size={12} className="shrink-0 mt-0.5" />
          {ERROR_MESSAGE[geo.errorReason] || ERROR_MESSAGE.unavailable}
        </p>
      )}
    </div>
  )
}
