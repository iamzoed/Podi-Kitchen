import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { ADMIN_ROLE } from '../data/orderConstants'

// True only if this user's id has been added to the admins table by hand in
// the Supabase dashboard — signing up alone never grants admin access.
// `role` distinguishes SUPER_ADMIN (full access, including managing other
// admins) from ADMIN (operational access only) — enforced for real by RLS,
// this hook is for UI convenience, not the source of truth.
export function useIsAdmin(userId) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [role, setRole] = useState(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      setIsAdmin(false)
      setRole(null)
      setChecked(true)
      return
    }
    let cancelled = false

    async function check() {
      let { data, error } = await supabase.from('admins').select('user_id, role').eq('user_id', userId).maybeSingle()

      if (error) {
        // Falls back to the pre-migration shape (no `role` column yet) so
        // admin login still works during the window between running the
        // 002_orders_and_roles.sql migration and it actually being applied.
        ;({ data } = await supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle())
      }

      if (!cancelled) {
        setIsAdmin(Boolean(data))
        setRole(data?.role ?? null)
        setChecked(true)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [userId])

  return { isAdmin, role, isSuperAdmin: role === ADMIN_ROLE.SUPER_ADMIN, checked }
}
