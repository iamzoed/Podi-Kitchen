import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

// Two lightweight RPCs (aggregates, not raw order data) instead of a
// realtime subscription — a customer doesn't need sub-second freshness on
// "are we sold out," and opening a realtime channel for every site visitor
// is real infrastructure load a 60s poll avoids entirely.
export function useOrderingStatus() {
  const [orderingOpen, setOrderingOpen] = useState(true)
  const [closedReason, setClosedReason] = useState(null)
  const [itemStatus, setItemStatus] = useState({})
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    async function load() {
      const [{ data: statusRows }, { data: itemRows }] = await Promise.all([
        supabase.rpc('get_ordering_status'),
        supabase.rpc('get_item_availability'),
      ])
      if (cancelled) return

      const status = Array.isArray(statusRows) ? statusRows[0] : statusRows
      if (status) {
        setOrderingOpen(status.ordering_open)
        setClosedReason(status.closed_reason)
      }
      if (Array.isArray(itemRows)) {
        setItemStatus(Object.fromEntries(itemRows.map((r) => [r.menu_item_id, r.status])))
      }
      setLoading(false)
    }

    load()
    const interval = setInterval(load, 60000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return { orderingOpen, closedReason, itemStatus, loading }
}
