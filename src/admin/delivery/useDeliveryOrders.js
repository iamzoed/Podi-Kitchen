import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

// Active deliveries (no date bound — they stay relevant until delivered)
// plus only *today's* delivered orders, not full history. RLS scopes a
// DELIVERY-role caller to their own assigned orders automatically; the
// query itself is identical for admins and delivery staff.
export function useDeliveryOrders() {
  const [orders, setOrders] = useState([])
  const [itemsByOrder, setItemsByOrder] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [{ data: active, error: activeError }, { data: deliveredToday, error: deliveredError }] = await Promise.all([
      supabase.from('orders').select('*').in('status', ['PACKED', 'OUT_FOR_DELIVERY']).order('created_at', { ascending: true }),
      supabase
        .from('orders')
        .select('*')
        .eq('status', 'DELIVERED')
        .gte('delivered_at', startOfToday.toISOString())
        .order('delivered_at', { ascending: false }),
    ])

    if (activeError || deliveredError) {
      setError((activeError || deliveredError).message)
      setLoading(false)
      return
    }

    const allOrders = [...(active || []), ...(deliveredToday || [])]
    const ids = allOrders.map((o) => o.id)
    let items = []
    if (ids.length > 0) {
      const { data: itemsData } = await supabase.from('order_items').select('*').in('order_id', ids)
      items = itemsData || []
    }

    const grouped = {}
    for (const it of items) {
      ;(grouped[it.order_id] ||= []).push(it)
    }

    setOrders(allOrders)
    setItemsByOrder(grouped)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('delivery-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return { orders, itemsByOrder, loading, error, reload: load }
}
