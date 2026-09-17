'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../../../lib/supabase/browser'
import { safeNext } from '../../../lib/safeNext'
import ForecastWordmark from '../components/ForecastWordmark'

export default function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const callbackError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    callbackError === 'missing_code' || callbackError === 'auth_failed'
      ? "That link didn't work. It may have been opened in a different browser than the one you requested it from, or it's expired. Request a new one below."
      : null
  )

  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)

  // Shared by the initial send and by "Resend code" — same request either
  // way, just triggered from two different places.
  const sendMagicLink = async () => {
    const supabase = createClient()
    const redirectUrl = new URL('/auth/callback', window.location.origin)
    redirectUrl.searchParams.set('next', next)

    return supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl.toString(),
        // Only ever consumed by handle_new_user() on first sign-in, to
        // snapshot the user's local timezone once into profiles.timezone.
        // Harmless to send on every request — returning users' stored
        // value is never touched again. Note: nothing in the app actually
        // reads profiles.timezone anymore — the streak now uses a fixed
        // broadcast-schedule timezone (see lib/streak.ts), not this
        // per-user one. Left capturing it regardless of the fact that
        // it's currently unused, same dormant-but-harmless status as
        // profiles.streak_count.
        data: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await sendMagicLink()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  const handleResend = async () => {
    setLoading(true)
    setCodeError(null)
    setResent(false)

    const { error } = await sendMagicLink()

    setLoading(false)
    if (error) {
      setCodeError(error.message)
      return
    }
    setCode('')
    setResent(true)
  }

  // Same email delivers both a clickable link and a numeric code — this
  // form is a second way to finish the same sign-in, not a separate flow.
  // The typed code is what survives the cross-browser PKCE mismatch:
  // verifyOtp needs no code verifier from the original browser, while the
  // link's /auth/callback route does, so the link is the path that fails
  // when the link is opened in a different browser than it was requested
  // from.
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setCodeError(null)

    if (!/^\d{6,10}$/.test(code)) {
      setCodeError('Enter the 6 to 10 digit code from your email.')
      return
    }

    setVerifying(true)
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (error) {
      setCodeError("That code didn't work. It may be wrong or expired, so request a new one below.")
      setVerifying(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020205] px-4">
      <div className="w-full max-w-[320px] space-y-8">
        {/* Wordmark — shared component, same as every other page */}
        <div className="flex justify-center">
          <ForecastWordmark />
        </div>

        {sent ? (
          <div className="space-y-5 text-center">
            <div className="space-y-3">
              <div className="flex justify-center text-2xl">📬</div>
              <p className="font-semibold text-white">Check your email</p>
              <p className="text-label text-slate-400">
                We sent a link and a code to{' '}
                <span className="text-slate-300">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-2.5 text-left">
              <label className="block text-center text-caption text-slate-500">
                Enter the code from your email
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                placeholder="123456"
                maxLength={10}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-center text-body tracking-[0.2em] text-white placeholder:tracking-normal placeholder:text-slate-600 outline-none focus:border-violet-400/40 transition"
              />

              {codeError && (
                <p className="text-center text-caption text-rose-400">{codeError}</p>
              )}
              {resent && !codeError && (
                <p className="text-center text-caption text-emerald-400">
                  Sent again. Check your email.
                </p>
              )}

              <button
                type="submit"
                disabled={verifying || !code}
                className="w-full rounded-xl border border-white/[0.12] bg-white/[0.06] py-3 text-label font-semibold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {verifying ? 'Verifying…' : 'Verify code'}
              </button>
            </form>

            <div className="flex items-center justify-center gap-3 text-caption text-slate-600">
              <button
                onClick={handleResend}
                disabled={loading}
                className="underline-offset-2 hover:text-slate-400 disabled:opacity-40"
              >
                Resend code
              </button>
              <span className="text-slate-800">·</span>
              <button
                onClick={() => { setSent(false); setEmail(''); setCode(''); setCodeError(null); setResent(false) }}
                className="underline-offset-2 hover:text-slate-400"
              >
                Use a different email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-center">
              <p className="text-[1rem] font-bold text-white">Sign in to Forecast</p>
              <p className="text-caption text-slate-500">
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
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-body text-white placeholder:text-slate-600 outline-none focus:border-violet-400/40 transition"
              />

              {error && (
                <p className="text-caption text-rose-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl border border-white/[0.12] bg-white/[0.06] py-3 text-label font-semibold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? 'Sending…' : 'Send Magic Link'}
              </button>
            </div>

            <p className="text-center text-caption text-slate-600">
              No password needed. We&apos;ll email you a sign-in link and code.
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
