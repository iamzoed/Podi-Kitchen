import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

// Backs the "save details for faster checkout" feature — one row per
// signed-in customer, auto-created on signup by the schema.sql trigger.
export function useProfile(userId) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      setProfile(null)
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setProfile(data)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  async function saveProfile(fields) {
    if (!isSupabaseConfigured || !userId) return
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    if (!error) setProfile(data)
    return { data, error }
  }

  return { profile, saveProfile }
}
