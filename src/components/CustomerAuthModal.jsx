import { useState } from 'react'
import { X, User, Mail, Lock, LogIn } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useEscapeToClose } from '../hooks/useEscapeToClose'

export default function CustomerAuthModal({ onClose }) {
  useEscapeToClose(onClose)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)

    try {
      const signIn = await supabase.auth.signInWithPassword({ email, password })
      if (!signIn.error) {
        onClose()
        return
      }

      // Sign-in failed — Supabase deliberately won't say whether that's
      // because the email doesn't exist yet or the password is wrong (to
      // stop outsiders fishing for registered emails). So: try creating the
      // account. If that also fails, the email must already be registered
      // with a different password.
      const signUp = await supabase.auth.signUp({ email, password })
      if (!signUp.error) {
        onClose()
        return
      }

      if (/already registered|already exists/i.test(signUp.error.message)) {
        setError('Incorrect password for this email. Please try again.')
      } else {
        setError(signUp.error.message)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-[popIn_0.25s_ease-out]">
        <div className="bg-gradient-to-br from-brick-600 to-brick-700 px-6 pt-6 pb-8 text-white text-center relative">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="w-14 h-14 rounded-full bg-white/15 ring-1 ring-white/30 flex items-center justify-center mx-auto mb-3">
            <User size={26} />
          </div>
          <h2 className="font-heading text-lg font-semibold">Sign in</h2>
          <p className="text-brick-100 text-xs mt-1 max-w-[85%] mx-auto">
            Save your details for faster checkout next time. New here? Just enter an email and password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-5 space-y-3">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              placeholder="Password"
              className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brick-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brick-500 to-brick-600 hover:from-brick-600 hover:to-brick-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-150"
          >
            {busy ? (
              'Please wait…'
            ) : (
              <>
                <LogIn size={16} /> Continue
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-gray-400 pt-1">You can also just checkout as a guest — no account needed.</p>
        </form>
      </div>
    </div>
  )
}
