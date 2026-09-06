import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

// Loads only what the kitchen needs: today's orders in the three
// kitchen-relevant statuses, plus their items in a single follow-up query
// (not one query per order) — RLS scopes this further for a KITCHEN-role
// caller regardless of what's asked for here.
export function useKitchenOrders() {
  const [orders, setOrders] = useState([])
  const [itemsByOrder, setItemsByOrder] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    // Explicit column list, not select('*') — kitchen must never receive
    // customer_name/phone/delivery_address/pricing/payment fields over the
    // wire at all, not just have the UI decline to render them.
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, status, created_at, order_notes')
      .in('status', ['CONFIRMED', 'PREPARING', 'PACKED'])
      .gte('created_at', startOfToday.toISOString())
      .order('created_at', { ascending: true })

    if (ordersError) {
      setError(ordersError.message)
      setLoading(false)
      return
    }

    const ids = (ordersData || []).map((o) => o.id)
    let items = []
    if (ids.length > 0) {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('id, order_id, item_name_snapshot, size_label, quantity, spice_level, addons')
        .in('order_id', ids)
      items = itemsData || []
    }

    const grouped = {}
    for (const it of items) {
      ;(grouped[it.order_id] ||= []).push(it)
    }

    setOrders(ordersData || [])
    setItemsByOrder(grouped)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return { orders, itemsByOrder, loading, error, reload: load }
}
