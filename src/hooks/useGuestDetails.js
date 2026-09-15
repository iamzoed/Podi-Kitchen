import { useState } from 'react'

const KEY = 'ss-guest-details'

// Most customers here won't create an account — signing up is exactly the
// kind of extra friction the brief is trying to remove. This remembers
// name/phone/address on this device after a successful order, so a repeat
// customer's checkout form is already filled in instead of empty every time.
export function useGuestDetails() {
  const [guestDetails] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  function saveGuestDetails(fields) {
    try {
      localStorage.setItem(KEY, JSON.stringify(fields))
    } catch {
      // Private browsing / storage disabled — checkout still works, the
      // customer just retypes next time.
    }
  }

  return { guestDetails, saveGuestDetails }
}
