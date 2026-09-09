import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'

const DISMISS_KEY = 'ss-install-dismissed-at'
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000 // 2 weeks — don't nag a returning visitor who already said no

// Also true inside the Capacitor Android app — someone already running the
// installed app obviously doesn't need to be told to install it.
function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    Capacitor.isNativePlatform()
  )
}

function isIOSSafari() {
  const ua = window.navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  // iOS Chrome/Firefox also use Apple's WebKit and can't trigger an install
  // programmatically either, but they don't support "Add to Home Screen"
  // the same way Safari's share sheet does — only genuine Safari gets the
  // instructional card; other iOS browsers get nothing rather than
  // instructions that don't apply to them.
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  return isIOS && isSafari
}

function recentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  return Date.now() - Number(raw) < DISMISS_COOLDOWN_MS
}

// Never auto-triggers anything — only ever surfaces "installable" state for
// the caller to decide when/whether to show a prompt (see InstallPrompt.jsx,
// which additionally waits for real interaction before showing it).
export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState(null)
  const [dismissed, setDismissed] = useState(recentlyDismissed)

  useEffect(() => {
    if (isStandalone()) return
    function onBeforeInstallPrompt(e) {
      e.preventDefault()
      setDeferredEvent(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  async function promptInstall() {
    if (!deferredEvent) return
    deferredEvent.prompt()
    await deferredEvent.userChoice
    setDeferredEvent(null)
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
  }

  const alreadyInstalled = isStandalone()
  const canInstallAndroid = Boolean(deferredEvent) && !alreadyInstalled && !dismissed
  const showIOSInstructions = isIOSSafari() && !alreadyInstalled && !dismissed

  return { canInstallAndroid, showIOSInstructions, promptInstall, dismiss }
}
