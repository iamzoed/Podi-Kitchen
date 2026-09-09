import { useEffect, useState } from 'react'
import { X, Share, SquarePlus } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

// Shown only once the customer has done something that signals real
// intent (added an item), not the moment the page loads — an install nag
// on first paint is exactly the "annoying browser popup" feel the brief
// explicitly wants to avoid.
export default function InstallPrompt({ hasEngaged }) {
  const { canInstallAndroid, showIOSInstructions, promptInstall, dismiss } = useInstallPrompt()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!hasEngaged || (!canInstallAndroid && !showIOSInstructions)) return
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [hasEngaged, canInstallAndroid, showIOSInstructions])

  if (!visible) return null

  function handleDismiss() {
    setVisible(false)
    dismiss()
  }

  async function handleInstall() {
    await promptInstall()
    setVisible(false)
  }

  return (
    <div className="fixed bottom-24 inset-x-4 sm:inset-x-auto sm:right-4 sm:max-w-sm z-40 animate-[popIn_0.3s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl border border-brick-100 p-4">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-sm">
            <img src="/pwa-192x192.png" alt="" className="w-full h-full object-cover" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-gray-800 text-sm">Get the States &amp; Swaad app</p>
            <p className="text-xs text-gray-500 mt-0.5">Order your favourites faster from your home screen.</p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {canInstallAndroid && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-brick-600 to-brick-700 hover:from-brick-700 hover:to-brick-800 text-white text-sm font-semibold py-2.5 rounded-full transition-all duration-150"
            >
              Install App
            </button>
            <button onClick={handleDismiss} className="px-4 text-sm text-gray-500 hover:text-gray-700">
              Maybe Later
            </button>
          </div>
        )}

        {showIOSInstructions && (
          <div className="mt-3 space-y-1.5 text-xs text-gray-600 bg-brick-50 rounded-xl p-3">
            <p className="flex items-center gap-1.5">
              1. Tap <Share size={14} className="text-brick-600" /> in Safari's toolbar
            </p>
            <p className="flex items-center gap-1.5">
              2. Choose <SquarePlus size={14} className="text-brick-600" /> "Add to Home Screen"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
