import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Relies on the "customers can view their own orders" RLS policy from
// 002_orders_and_roles.sql (auth.uid() = orders.user_id) — this has been in
// place since Phase 1, just never had a UI built on top of it until now.
export function useMyOrders(userId) {
  const [orders, setOrders] = useState([])
  const [itemsByOrder, setItemsByOrder] = useState({})
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!userId) {
      setOrders([])
      setItemsByOrder({})
      return
    }
    setLoading(true)

    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    const ids = (ordersData || []).map((o) => o.id)
    let items = []
    if (ids.length > 0) {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('id, order_id, menu_item_id, item_name_snapshot, size_label, quantity, spice_level, addons')
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
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  return { orders, itemsByOrder, loading, reload: load }
}
