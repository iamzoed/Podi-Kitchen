import { ShieldAlert, LogOut } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useIsAdmin } from '../hooks/useIsAdmin'
import AdminLogin from './AdminLogin'
import AdminShell from './AdminShell'

export default function AdminApp() {
  // Hooks run unconditionally, even when Supabase isn't configured — both
  // hooks no-op safely in that case (see useAuth/useIsAdmin), so it's the
  // branches below that decide what actually renders.
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, role, checked } = useIsAdmin(user?.id)

  if (!isSupabaseConfigured) {
    return (
      <Message
        title="Admin panel not set up yet"
        text="Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then run the supabase/schema.sql script in your Supabase project."
      />
    )
  }

  if (authLoading || (user && !checked)) {
    return <Message title="Loading…" text="" />
  }

  if (!user) {
    return <AdminLogin />
  }

  if (!isAdmin) {
    return (
      <Message
        title="Not authorized"
        text="This account isn't an admin yet. Ask the site owner to add your user id to the admins table in Supabase."
        icon={ShieldAlert}
        action={
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-4 flex items-center gap-1.5 mx-auto text-sm text-brick-600 hover:text-brick-700"
          >
            <LogOut size={14} /> Sign out
          </button>
        }
      />
    )
  }

  return <AdminShell role={role} />
}

function Message({ title, text, icon: Icon = ShieldAlert, action }) {
  return (
    <div className="min-h-screen bg-brick-800 flex items-center justify-center p-4">
      <div className="max-w-sm text-center bg-white rounded-2xl shadow-xl p-6">
        <Icon size={28} className="mx-auto text-brick-500 mb-3" />
        <h1 className="font-heading font-semibold text-brick-700 mb-1">{title}</h1>
        {text && <p className="text-sm text-gray-500">{text}</p>}
        {action}
      </div>
    </div>
  )
}
