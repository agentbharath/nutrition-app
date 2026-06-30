'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
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
              {loading ? 'Sending...' : '✉️ Send Magic Link'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-4xl mb-3">📬</p>
            <p className="text-sm t-text font-medium">Check your email</p>
            <p className="text-xs t-muted mt-2">We sent a sign-in link to {email}. Click it to open the app.</p>
            <button
              onClick={() => setSent(false)}
              className="text-xs t-accent mt-4 underline"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
