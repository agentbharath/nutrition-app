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
    if ('serviceWorker' in navigator)
      navigator.serviceWorker.ready.then(r => r.pushManager.getSubscription().then(s => setSubscribed(!!s)))
  }, [])

  async function enableNotifications() {
    setLoading(true)
    try {
      const p = await Notification.requestPermission()
      setNotifStatus(p as 'granted'|'denied')
      if (p !== 'granted') { setLoading(false); return }
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const ex = await reg.pushManager.getSubscription()
      if (ex) await ex.unsubscribe()
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) })
      const j = sub.toJSON()
      await supabase.from('push_subscriptions').upsert({ endpoint: j.endpoint, auth: (j.keys as any)?.auth, p256dh: (j.keys as any)?.p256dh }, { onConflict: 'endpoint' })
      setSubscribed(true)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  async function disableNotifications() {
    const r = await navigator.serviceWorker.ready
    const s = await r.pushManager.getSubscription()
    if (s) { await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint); await s.unsubscribe(); setSubscribed(false) }
  }

  async function resetToday() {
    setResetLoading(true)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    await supabase.from('daily_logs').delete().eq('date', today)
    await supabase.from('quick_adds').delete().eq('date', today)
    setResetDone(true)
    setTimeout(() => { window.location.href = '/' }, 600)
  }

  return (
    <main className="max-w-md mx-auto min-h-screen pb-24 t-bg">
      <div className="app-header px-4 pt-10 pb-5 flex items-center gap-3">
        <Link href="/" className="text-xl btn-secondary w-8 h-8 flex items-center justify-center rounded-full">←</Link>
        <div>
          <h1 className="text-xl font-bold t-text">Settings</h1>
          <p className="text-xs t-muted">Preferences & tools</p>
        </div>
      </div>

      <div className="px-4 space-y-3">

        {/* THEME */}
        <div className="t-card rounded-2xl p-4">
          <p className="font-semibold text-sm t-text mb-0.5">Theme</p>
          <p className="text-xs t-muted mb-4">Choose your vibe</p>
          <div className="grid grid-cols-2 gap-2.5">
            {THEMES.map((t) => {
              const active = theme.name === t.name
              const isLight = ['light','matcha','coastal','salt'].includes(t.name)
              return (
                <button key={t.name} onClick={() => setTheme(t.name as ThemeName)}
                  className="rounded-xl overflow-hidden transition-all text-left"
                  style={{
                    border: active ? `2px solid ${t.preview.accent}` : `2px solid transparent`,
                    boxShadow: active ? `0 0 0 1px ${t.preview.accent}40, 0 6px 20px ${t.preview.accent}25` : 'none',
                    outline: active ? 'none' : undefined,
                  }}>
                  {/* App mockup preview */}
                  <div className="p-3 h-20 flex flex-col gap-1.5" style={{ background: t.preview.bg }}>
                    {/* Header bar */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: t.preview.accent }} />
                      <div className="h-1.5 rounded-full flex-1" style={{ background: t.preview.card, opacity: 0.8 }} />
                    </div>
                    {/* Card mockup */}
                    <div className="rounded-lg p-1.5 flex-1 flex flex-col gap-1" style={{ background: t.preview.card }}>
                      <div className="h-1.5 w-3/4 rounded-full" style={{ background: t.preview.accent, opacity: 0.7 }} />
                      <div className="flex gap-1 mt-auto">
                        {[1,0.6,0.4].map((op,i) => (
                          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: t.preview.accent, opacity: op }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Label */}
                  <div className="px-3 py-2 flex items-center justify-between" style={{ background: t.preview.card }}>
                    <div>
                      <p className="text-xs font-semibold leading-tight" style={{ color: active ? t.preview.accent : t.preview.text, opacity: active ? 1 : 0.85 }}>
                        {t.emoji} {t.label}
                      </p>
                    </div>
                    {active && <span className="text-xs font-bold" style={{ color: t.preview.accent }}>✓</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>


                {/* NOTIFICATIONS */}
        <div className="t-card rounded-2xl p-4">
          <p className="font-semibold text-sm t-text mb-0.5">Push Notifications</p>
          <p className="text-xs t-muted mb-3">12 PM lunch • 6 PM dinner • PST daily</p>
          {notifStatus === 'unsupported' && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <p className="text-xs" style={{ color: 'var(--amber)' }}>⚠️ Install app to home screen first, then enable notifications here</p>
            </div>
          )}
          {notifStatus === 'denied' && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <p className="text-xs" style={{ color: 'var(--red)' }}>🚫 Blocked — go to browser Settings → Notifications → Allow for this site</p>
            </div>
          )}
          {(notifStatus === 'unknown' || notifStatus === 'granted') && (
            <button onClick={subscribed ? disableNotifications : enableNotifications} disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={subscribed ? { background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)' }
                : { background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
              {loading ? 'Setting up...' : subscribed ? '🔕 Disable Notifications' : '🔔 Enable Notifications'}
            </button>
          )}
          {subscribed && (
            <div className="mt-3 space-y-1.5">
              {['12:00 PM PST — Lunch reminder', '6:00 PM PST — Dinner reminder'].map(t => (
                <div key={t} className="flex justify-between text-xs">
                  <span className="t-muted">{t}</span>
                  <span className="t-accent">✓ Active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TARGETS */}
        <div className="t-card rounded-2xl p-4">
          <p className="font-semibold text-sm t-text mb-3">Daily Targets</p>
          {[
            ['Calories', '1800 kcal', 'Gym days 1850-1900 is fine'],
            ['Protein', '140g+', 'Always over — expected'],
            ['Sodium', '<1500mg', 'Hard ceiling. Gym days <1700mg'],
            ['Fiber', '25g+', 'Aim for 35-40g'],
            ['Carbs', '150-250g', 'Gym days aim 180-220g'],
          ].map(([label, value, note], i, arr) => (
            <div key={label} className="flex items-center justify-between py-2.5"
              style={{ borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <p className="text-sm font-medium t-text">{label}</p>
                <p className="text-xs t-muted">{note}</p>
              </div>
              <p className="text-sm font-bold t-accent">{value}</p>
            </div>
          ))}
        </div>

        {/* SUPPLEMENTS */}
        <div className="t-card rounded-2xl p-4">
          <p className="font-semibold text-sm t-text mb-3">Supplement Stack</p>
          {[
            ['Morning', 'Sports Research D3+K2', '1 softgel', 'With breakfast'],
            ["Night", "Doctor's Best Mag Glycinate", '2 tablets (200mg)', 'With ashwagandha'],
            ['Night', 'Ashwagandha', '2 pills', 'Cortisol + sleep'],
          ].map(([time, item, dose, note], i, arr) => (
            <div key={item} className="flex items-center justify-between py-2.5"
              style={{ borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
              <div className="flex-1 mr-3">
                <p className="text-sm font-medium t-text">{item}</p>
                <p className="text-xs t-muted">{note}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold t-accent">{dose}</p>
                <p className="text-xs t-muted">{time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* RESET */}
        <div className="rounded-2xl p-4 t-card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <p className="font-semibold text-sm mb-0.5" style={{ color: 'var(--red)' }}>Reset Today</p>
          <p className="text-xs t-muted mb-3">Clears today's log and quick adds. Cannot undo.</p>
          <button onClick={resetToday} disabled={resetLoading || resetDone}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
            style={{ border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)' }}>
            {resetDone ? '✓ Cleared — redirecting...' : resetLoading ? 'Clearing...' : '🗑 Reset Today'}
          </button>
        </div>

      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bottom-nav flex">
        <Link href="/" className="flex-1 py-4 flex flex-col items-center gap-1 t-muted hover:opacity-80 transition-opacity">
          <span className="text-lg">📋</span><span className="text-xs">Today</span>
        </Link>
        <Link href="/history" className="flex-1 py-4 flex flex-col items-center gap-1 t-muted hover:opacity-80 transition-opacity">
          <span className="text-lg">📅</span><span className="text-xs">History</span>
        </Link>
        <button className="flex-1 py-4 flex flex-col items-center gap-1 t-accent">
          <span className="text-lg">⚙️</span><span className="text-xs font-semibold">Settings</span>
        </button>
      </nav>
    </main>
  )
}

function urlBase64ToUint8Array(b: string) {
  const p = '='.repeat((4 - b.length % 4) % 4)
  const d = (b + p).replace(/-/g, '+').replace(/_/g, '/')
  return new Uint8Array([...window.atob(d)].map(c => c.charCodeAt(0)))
}
