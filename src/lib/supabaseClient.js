import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Both admin login and customer login need somewhere to store users — this is
// that backend. Until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set (see
// .env.example), the site falls back to the static menu in data/menu.js and
// login features are simply unavailable — the public menu keeps working
// either way.
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
