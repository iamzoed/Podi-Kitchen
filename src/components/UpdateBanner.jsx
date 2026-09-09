import { RefreshCw } from 'lucide-react'

// Never reloads on its own — a new service worker sits ready in the
// background (registerType: 'prompt' in vite.config.js) until the
// customer taps this themselves, so nobody gets yanked out of a
// half-filled checkout form by a surprise reload.
export default function UpdateBanner({ onRefresh }) {
  return (
    <div className="fixed top-[max(1rem,env(safe-area-inset-top))] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-[60] animate-[popIn_0.25s_ease-out]">
      <div className="flex items-center gap-3 bg-brick-800 text-white text-sm rounded-full shadow-xl pl-4 pr-1.5 py-1.5">
        <span className="whitespace-nowrap">New version available</span>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-white font-semibold text-xs px-3 py-1.5 rounded-full transition-colors duration-150 shrink-0"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
    </div>
  )
}
