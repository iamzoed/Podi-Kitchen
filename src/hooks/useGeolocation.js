import { useCallback, useState } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'

// Native-only bridge (android/app/.../LocationPromptPlugin.java) to
// Android's system "turn on Location" dialog — the standard web
// Geolocation API has no way to trigger that itself. No-op/unused when
// running as a plain website, where this simply isn't possible at all.
const LocationPrompt = registerPlugin('LocationPrompt')

// Wraps the browser's native Geolocation API — no dependency, no key. Never
// called automatically; `request()` only runs when the customer explicitly
// taps "Use my current location" (see DeliveryLocation.jsx), per the
// minimum-data principle: no permission prompt on page load, no background
// tracking, nothing stored until the customer actually places the order.
export function useGeolocation() {
  const [status, setStatus] = useState('idle') // idle | locating | success | error
  const [coords, setCoords] = useState(null) // { lat, lng }
  const [accuracy, setAccuracy] = useState(null) // meters
  const [errorReason, setErrorReason] = useState(null) // 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'device-location-off'

  const request = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      setErrorReason('unsupported')
      return
    }

    setStatus('locating')
    setErrorReason(null)

    // In the Android app, check whether the device's location service is
    // even on before bothering with the web call — if it's off, send the
    // customer straight to the system Location settings screen instead of
    // just failing with a generic error. They come back and tap the button
    // again once it's on (a real geolocation prompt would need to fire from
    // the return-to-app moment, which this simpler, more reliable native
    // API can't do — see LocationPromptPlugin.java for why).
    if (Capacitor.isNativePlatform()) {
      try {
        const { enabled } = await LocationPrompt.ensureEnabled()
        if (!enabled) {
          setStatus('error')
          setErrorReason('device-location-off')
          return
        }
      } catch {
        // plugin unavailable for some reason — fall through to the normal
        // web call/error path, same as on the website
      }
    }

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
