import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { serviceDateIST } from './capacityStatus'

// "Reserved" here (daily_item_capacity_counters.portions_count) counts
// every accepted order regardless of kitchen stage — PENDING_CONFIRMATION
// through DELIVERED all still hold their reservation; only REJECTED/
// CANCELLED release it (enforced by a DB trigger, not here). This view
// answers "how much of today's capacity is spoken for," which is a
// different question from the Kitchen dashboard's "what's still waiting to
// be cooked" — the two intentionally don't show the same number.
export function useCapacityData() {
  const [settings, setSettings] = useState(null)
  const [dailyCounter, setDailyCounter] = useState({ orders_count: 0, portions_count: 0 })
  const [itemRows, setItemRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const serviceDate = serviceDateIST()

    const [{ data: settingsData, error: settingsError }, { data: counterData }, { data: itemCounterData }, { data: menuItemsData }] =
      await Promise.all([
        supabase.from('kitchen_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('daily_capacity_counters').select('*').eq('service_date', serviceDate).maybeSingle(),
        supabase.from('daily_item_capacity_counters').select('*').eq('service_date', serviceDate),
        supabase.from('menu_items').select('id, name, max_portions_per_day').order('name', { ascending: true }),
      ])

    if (settingsError) {
      setError(settingsError.message)
      setLoading(false)
      return
    }

    const soldByItem = Object.fromEntries((itemCounterData || []).map((c) => [c.menu_item_id, c.portions_count]))

    setSettings(settingsData)
    setDailyCounter(counterData || { orders_count: 0, portions_count: 0 })
    setItemRows(
      (menuItemsData || []).map((m) => ({
        id: m.id,
        name: m.name,
        max: m.max_portions_per_day,
        sold: soldByItem[m.id] || 0,
      }))
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('admin-capacity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_capacity_counters' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_item_capacity_counters' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_settings' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return { settings, dailyCounter, itemRows, loading, error, reload: load, serviceDate: serviceDateIST() }
}
