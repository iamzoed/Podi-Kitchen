import { useEffect } from 'react'

export function useEscapeToClose(onClose, active = true) {
  useEffect(() => {
    if (!active) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [active, onClose])
}
