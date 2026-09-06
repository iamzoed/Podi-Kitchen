import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

// One RPC round trip (order_status_counts, defined in
// 003_order_status_history_and_delivery.sql) instead of seven separate
// count queries.
export function useOrderCounters() {
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('order_status_counts')
    if (!error && data) {
      setCounts(Object.fromEntries(data.map((row) => [row.bucket, Number(row.count)])))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('admin-order-counters')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return { counts, loading, reload: load }
}
