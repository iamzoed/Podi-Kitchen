import { useState } from 'react'
import { ChefHat } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function AdminLogin() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        // Best-effort — the profiles row is auto-created by a DB trigger on
        // signup; this just fills in the name so an admin assigning
        // deliveries later has something readable to pick from. Not fatal
        // if it fails (e.g. email confirmation still pending somewhere).
        if (data.user && name.trim()) {
          await supabase.from('profiles').update({ name: name.trim() }).eq('id', data.user.id)
        }
        setNotice(
          "Account created. Ask the site owner to add your user id to the admins table in Supabase, then sign in here."
        )
      }
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-brick-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <ChefHat size={20} className="text-brick-600" />
          <h1 className="font-heading font-semibold text-lg text-brick-700">States&amp;Swaad Admin</h1>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          {mode === 'signin' ? 'Sign in to manage the menu.' : 'Create an admin account.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              required
              placeholder="Your name"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            required
            placeholder="Email"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-xs text-red-600">{error}</p>}
          {notice && <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brick-600 hover:bg-brick-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-full transition-colors duration-150"
          >
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError('')
            setNotice('')
          }}
          className="w-full text-center text-xs text-gray-500 hover:text-brick-600 mt-3"
        >
          {mode === 'signin' ? 'First time? Create an admin account' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
