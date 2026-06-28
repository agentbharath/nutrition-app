'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useTheme, THEMES, ThemeName } from '@/lib/theme'
import Link from 'next/link'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [notifStatus, setNotifStatus] = useState<'unknown'|'granted'|'denied'|'unsupported'>('unknown')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) { setNotifStatus('unsupported'); return }
    setNotifStatus(Notification.permission as 'granted'|'denied')
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
      })
    }
  }, [])

  async function enableNotifications() {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setNotifStatus(permission as 'granted'|'denied')
      if (permission !== 'granted') { setLoading(false); return }
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      const subJSON = sub.toJSON()
      await supabase.from('push_subscriptions').upsert({
        endpoint: subJSON.endpoint,
        auth: (subJSON.keys as Record<string,string>)?.auth,
        p256dh: (subJSON.keys as Record<string,string>)?.p256dh,
      }, { onConflict: 'endpoint' })
      setSubscribed(true)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function disableNotifications() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      await sub.unsubscribe()
      setSubscribed(false)
    }
  }

  async function resetToday() {
    setResetLoading(true)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    await supabase.from('daily_logs').delete().eq('date', today)
    await supabase.from('quick_adds').delete().eq('date', today)
    setResetLoading(false)
    setResetDone(true)
    setTimeout(() => { window.location.href = '/' }, 800)
  }

  const accent = theme.accentText

  return (
    <main className="max-w-md mx-auto min-h-screen pb-24" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>

      {/* Header */}
      <div className="app-header px-4 pt-10 pb-5 flex items-center gap-3">
        <Link href="/" className="text-xl hover:opacity-70 transition-opacity" style={{ color: 'var(--muted)' }}>←</Link>
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Preferences & tools</p>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* THEME PICKER */}
        <div className="rounded-2xl p-4 t-card">
          <p className="font-semibold text-sm mb-1">Theme</p>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Choose your look</p>
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.name}
                onClick={() => setTheme(t.name as ThemeName)}
                className="flex flex-col items-center gap-1.5 group"
              >
                {/* Preview swatch */}
                <div
                  className="w-full aspect-square rounded-xl border-2 transition-all overflow-hidden relative"
                  style={{
                    backgroundColor: t.preview[0],
                    borderColor: theme.name === t.name ? t.accent : 'transparent',
                    boxShadow: theme.name === t.name ? `0 0 0 1px ${t.accent}40, 0 4px 12px ${t.accent}20` : 'none',
                  }}
                >
                  {/* Card stripe */}
                  <div className="absolute inset-x-2 top-2 h-2 rounded-sm" style={{ backgroundColor: t.preview[1] }} />
                  {/* Accent dot */}
                  <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.preview[2] }} />
                  {/* Check */}
                  {theme.name === t.name && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold" style={{ color: t.accent }}>✓</span>
                    </div>
                  )}
                </div>
                <span className="text-xs" style={{ color: theme.name === t.name ? accent : 'var(--muted)' }}>{t.emoji}</span>
                <span className="text-xs font-medium leading-tight text-center" style={{ color: theme.name === t.name ? accent : 'var(--muted)' }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div className="rounded-2xl p-4 t-card">
          <p className="font-semibold text-sm mb-1">Push Notifications</p>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>12 PM (lunch) and 6 PM (dinner) PST daily</p>

          {notifStatus === 'unsupported' && (
            <div className="rounded-xl p-3" style={{ backgroundColor: '#F59E0B15', border: '1px solid #F59E0B30' }}>
              <p className="text-xs" style={{ color: '#F59E0B' }}>⚠️ Install app to home screen first, then enable notifications</p>
            </div>
          )}
          {notifStatus === 'denied' && (
            <div className="rounded-xl p-3" style={{ backgroundColor: '#EF444415', border: '1px solid #EF444430' }}>
              <p className="text-xs" style={{ color: '#EF4444' }}>🚫 Blocked in browser settings → Site Settings → Notifications → Allow</p>
            </div>
          )}
          {(notifStatus === 'unknown' || notifStatus === 'granted') && (
            <button
              onClick={subscribed ? disableNotifications : enableNotifications}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={subscribed
                ? { background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430' }
                : { background: `color-mix(in srgb, var(--accent) 15%, transparent)`, color: 'var(--accent-text)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }
              }
            >
              {loading ? 'Setting up...' : subscribed ? '🔕 Disable Notifications' : '🔔 Enable Notifications'}
            </button>
          )}
          {subscribed && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--muted)' }}>12:00 PM PST — Lunch reminder</span>
                <span style={{ color: 'var(--accent-text)' }}>✓ Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--muted)' }}>6:00 PM PST — Dinner reminder</span>
                <span style={{ color: 'var(--accent-text)' }}>✓ Active</span>
              </div>
            </div>
          )}
        </div>

        {/* DAILY TARGETS */}
        <div className="rounded-2xl p-4 t-card">
          <p className="font-semibold text-sm mb-3">Daily Targets</p>
          <div className="space-y-0">
            {[
              { label: 'Calories', value: '1800 kcal', note: 'Gym days 1850-1900 is fine' },
              { label: 'Protein', value: '140g+', note: 'Always over — expected' },
              { label: 'Sodium', value: '<1500mg', note: 'Hard ceiling — gym days <1700mg' },
              { label: 'Fiber', value: '25g+', note: 'Aim for 35-40g' },
              { label: 'Carbs', value: '150-250g', note: 'Gym days aim 180-220g' },
            ].map(({ label, value, note }, i, arr) => (
              <div key={label} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < arr.length - 1 ? `1px solid var(--border)` : 'none' }}>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{note}</p>
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--accent-text)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SUPPLEMENTS */}
        <div className="rounded-2xl p-4 t-card">
          <p className="font-semibold text-sm mb-3">Daily Supplement Stack</p>
          <div className="space-y-0">
            {[
              { time: 'Morning', item: 'Sports Research D3+K2', dose: '1 softgel', note: 'With breakfast — fat aids absorption' },
              { time: 'Night', item: "Doctor's Best Mag Glycinate", dose: '2 tablets (200mg)', note: 'With ashwagandha' },
              { time: 'Night', item: 'Ashwagandha', dose: '2 pills', note: 'Cortisol reduction + sleep quality' },
            ].map(({ time, item, dose, note }, i, arr) => (
              <div key={item} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < arr.length - 1 ? `1px solid var(--border)` : 'none' }}>
                <div className="flex-1 mr-3">
                  <p className="text-sm font-medium">{item}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{note}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--accent-text)' }}>{dose}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DANGER ZONE */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid #EF444420' }}>
          <p className="font-semibold text-sm mb-1" style={{ color: '#EF4444' }}>Reset Today</p>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Clears today's log + quick adds. Can't undo.</p>
          <button
            onClick={resetToday}
            disabled={resetLoading || resetDone}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ border: '1px solid #EF444430', color: '#EF4444' }}
          >
            {resetDone ? '✓ Cleared — redirecting...' : resetLoading ? 'Clearing...' : '🗑 Reset Today'}
          </button>
        </div>

      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bottom-nav flex">
        <Link href="/" className="flex-1 py-4 flex flex-col items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: 'var(--muted)' }}>
          <span className="text-lg">📋</span><span className="text-xs">Today</span>
        </Link>
        <Link href="/history" className="flex-1 py-4 flex flex-col items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: 'var(--muted)' }}>
          <span className="text-lg">📅</span><span className="text-xs">History</span>
        </Link>
        <button className="flex-1 py-4 flex flex-col items-center gap-1" style={{ color: 'var(--accent-text)' }}>
          <span className="text-lg">⚙️</span><span className="text-xs font-semibold">Settings</span>
        </button>
      </nav>
    </main>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)))
}
