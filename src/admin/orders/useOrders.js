import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const PAGE_SIZE = 20

// Database-side filtering + pagination throughout (never fetches the whole
// table), plus one realtime channel for the whole list — new orders trigger
// a fresh first page, updates to an order already on screen are patched in
// place without a refetch.
export function useOrders(filters) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(0)
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const load = useCallback(async (reset) => {
    if (reset) {
      setLoading(true)
      pageRef.current = 0
    } else {
      setLoadingMore(true)
    }
    setError('')

    const from = pageRef.current * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const f = filtersRef.current

    let query = supabase.from('orders').select('*')
    if (f.status) query = query.eq('status', f.status)
    if (f.dateFrom) query = query.gte('created_at', f.dateFrom)
    if (f.dateTo) query = query.lt('created_at', f.dateTo)
    const search = f.search?.trim().replace(/[,%]/g, '')
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`)
    }
    query = query.order('created_at', { ascending: Boolean(f.sortAsc) }).range(from, to)

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setOrders((prev) => (reset ? data || [] : [...prev, ...(data || [])]))
      setHasMore((data?.length || 0) === PAGE_SIZE)
      pageRef.current += 1
    }
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => {
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.dateFrom, filters.dateTo, filters.search, filters.sortAsc])

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => load(true))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? payload.new : o)))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    orders,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore: () => load(false),
    reload: () => load(true),
  }
}
