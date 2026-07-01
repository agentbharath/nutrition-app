'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.error || 'Could not unlock the app.')
      setLoading(false)
      return
    }

    const next = new URLSearchParams(window.location.search).get('next')
    router.replace(next || '/')
    router.refresh()
  }

  return (
    <main className="min-h-screen t-bg flex items-center justify-center px-5">
      <form onSubmit={submit} className="t-card w-full max-w-sm rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] t-muted">Nutrition App</p>
          <h1 className="text-2xl font-bold t-text mt-1">Unlock</h1>
        </div>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] t-muted">Password</span>
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 t-text"
            style={{ background: 'var(--surface-soft)', borderColor: 'var(--border)' }}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading || !password} className="btn-primary w-full rounded-xl py-3 font-semibold disabled:opacity-60">
          {loading ? 'Unlocking...' : 'Enter'}
        </button>
      </form>
    </main>
  )
}
