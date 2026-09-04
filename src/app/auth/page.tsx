'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase/browser'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020205] px-4">
      <div className="w-full max-w-[320px] space-y-8">
        {/* Wordmark */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2">
            <span className="bg-gradient-to-r from-rose-400 to-violet-400 bg-clip-text text-[0.8rem] font-black tracking-[0.06em] text-transparent">
              FORECAST
            </span>
          </div>
        </div>

        {sent ? (
          <div className="space-y-3 text-center">
            <div className="flex justify-center text-2xl">📬</div>
            <p className="font-semibold text-white">Check your email</p>
            <p className="text-[0.72rem] text-slate-400">
              We sent a magic link to{' '}
              <span className="text-slate-300">{email}</span>
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-[0.62rem] text-slate-600 underline-offset-2 hover:text-slate-400"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-center">
              <p className="text-[1rem] font-bold text-white">Sign in to Forecast</p>
              <p className="text-[0.68rem] text-slate-500">
                TV predictions for people who are always right
              </p>
            </div>

            <div className="space-y-2.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[0.82rem] text-white placeholder:text-slate-600 outline-none focus:border-violet-400/40 transition"
              />

              {error && (
                <p className="text-[0.62rem] text-rose-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl border border-white/[0.12] bg-white/[0.06] py-3 text-[0.72rem] font-semibold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? 'Sending…' : 'Send Magic Link'}
              </button>
            </div>

            <p className="text-center text-[0.58rem] text-slate-600">
              No password needed. We&apos;ll email you a sign-in link.
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
