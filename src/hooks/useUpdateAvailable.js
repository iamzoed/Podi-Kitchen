import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'

// registerType: 'prompt' in vite.config.js means a new service worker
// installs in the background but sits waiting — nothing switches over
// until updateApp() is actually called. That's deliberate: reloading a
// customer out from under a checkout form they're mid-filling would lose
// their order. This hook just tracks "is an update ready" and exposes a
// way to apply it on the customer's own terms (see UpdateBanner.jsx).
export function useUpdateAvailable() {
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [updateSW, setUpdateSW] = useState(null)

  useEffect(() => {
    // Only present in a real PWA build (the plugin injects this virtual
    // module) — during plain `vite dev` it doesn't exist, so this hook is
    // a harmless no-op locally. Also skipped entirely inside the Capacitor
    // Android app, which loads this same dist/ build from a bundled
    // WebView — that app already has its own "installed app" mechanism,
    // and a service worker layered on top of it is redundant at best and
    // an unpredictable interaction with WebView networking at worst.
    if (!('serviceWorker' in navigator) || Capacitor.isNativePlatform()) return

    let cancelled = false
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        if (cancelled) return
        const update = registerSW({
          onNeedRefresh() {
            setNeedsRefresh(true)
          },
        })
        setUpdateSW(() => update)
      })
      .catch(() => {
        // Not a PWA build (dev mode, or the plugin isn't active) — ignore.
      })

    return () => {
      cancelled = true
    }
  }, [])

  function applyUpdate() {
    updateSW?.(true)
  }

  return { needsRefresh, applyUpdate }
}
