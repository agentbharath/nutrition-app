'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        data: name.trim() ? { display_name: name.trim() } : undefined,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.trim().length < 6) return
    setVerifying(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    })

    if (error) {
      setError(error.message)
      setVerifying(false)
    }
    // On success, the auth listener in AuthProvider picks up the session automatically
  }

  return (
    <main className="max-w-md mx-auto min-h-screen t-bg flex flex-col items-center justify-center px-6">
      <div className="w-full">
        <div className="text-center mb-8">
          <img src="/icon-192.png" alt="logo" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold t-text">Nutrition Tracker</h1>
          <p className="text-sm t-muted mt-1">Sign in to track your meals</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs t-muted uppercase tracking-wider">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bharath"
                className="mt-1 w-full t-input rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs t-muted uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full t-input rounded-xl px-4 py-3 text-sm"
              />
            </div>
            {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full btn-confirm font-bold rounded-xl py-3.5 text-sm disabled:opacity-50"
            >
              {loading ? 'Sending...' : '✉️ Send Sign-in Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-3">
            <div className="text-center mb-4">
              <p className="text-4xl mb-2">📬</p>
              <p className="text-sm t-text font-medium">Check your email</p>
              <p className="text-xs t-muted mt-1">We sent a 6-digit code to {email}. Enter it below — don&apos;t tap any link in the email, just type the code here.</p>
            </div>
            <div>
              <label className="text-xs t-muted uppercase tracking-wider">6-digit code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="mt-1 w-full t-input rounded-xl px-4 py-3 text-center text-2xl tracking-[0.3em] font-bold"
              />
            </div>
            {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}
            <button
              type="submit"
              disabled={verifying || code.length < 6}
              className="w-full btn-confirm font-bold rounded-xl py-3.5 text-sm disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : '✓ Verify & Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setSent(false); setCode(''); setError('') }}
              className="w-full text-xs t-muted underline"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
