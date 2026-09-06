import { useCallback, useState } from 'react'

// Wraps the browser's native Geolocation API — no dependency, no key. Never
// called automatically; `request()` only runs when the customer explicitly
// taps "Use my current location" (see DeliveryLocation.jsx), per the
// minimum-data principle: no permission prompt on page load, no background
// tracking, nothing stored until the customer actually places the order.
export function useGeolocation() {
  const [status, setStatus] = useState('idle') // idle | locating | success | error
  const [coords, setCoords] = useState(null) // { lat, lng }
  const [accuracy, setAccuracy] = useState(null) // meters
  const [errorReason, setErrorReason] = useState(null) // 'denied' | 'unavailable' | 'timeout' | 'unsupported'

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      setErrorReason('unsupported')
      return
    }

    setStatus('locating')
    setErrorReason(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        setAccuracy(position.coords.accuracy ?? null)
        setStatus('success')
      },
      (err) => {
        setCoords(null)
        setAccuracy(null)
        setStatus('error')
        setErrorReason(err.code === err.PERMISSION_DENIED ? 'denied' : err.code === err.TIMEOUT ? 'timeout' : 'unavailable')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setCoords(null)
    setAccuracy(null)
    setErrorReason(null)
  }, [])

  return { status, coords, accuracy, errorReason, request, reset }
}
