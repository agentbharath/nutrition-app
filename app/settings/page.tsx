'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { HealthDailyMetrics } from '@/lib/supabase'
import { useTheme, THEMES, ThemeName } from '@/lib/theme'
import BottomNav from '@/components/BottomNav'
import { BellIcon, TrashIcon, WatchIcon } from '@/components/Icons'
import Link from 'next/link'

interface HealthStatus {
  configured: boolean
  connected: boolean
  provider?: 'google_health' | 'fitbit' | null
  last_sync_at?: string | null
  connected_at?: string | null
  latest?: HealthDailyMetrics[]
  message?: string
  error?: string
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [notifStatus, setNotifStatus] = useState<'unknown'|'granted'|'denied'|'unsupported'>('unknown')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testStatus, setTestStatus] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [healthSyncing, setHealthSyncing] = useState(false)

  useEffect(() => {
    void Promise.resolve().then(async () => {
      if (!('Notification' in window)) { setNotifStatus('unsupported'); return }
      setNotifStatus(Notification.permission as 'granted'|'denied')
      if ('serviceWorker' in navigator) {
        const r = await navigator.serviceWorker.ready
        const s = await r.pushManager.getSubscription()
        setSubscribed(!!s)
      }
    })
  }, [])

  useEffect(() => {
    loadHealthStatus()
  }, [])

  async function loadHealthStatus() {
    setHealthLoading(true)
    try {
      const res = await fetch('/api/health/status')
      const data = await res.json()
      setHealthStatus(data)
    } catch (error) {
      console.error(error)
      setHealthStatus({ configured: false, connected: false, error: 'Could not load health status.' })
    } finally {
      setHealthLoading(false)
    }
  }

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
      await supabase.from('push_subscriptions').upsert({ endpoint: j.endpoint, auth: j.keys?.auth, p256dh: j.keys?.p256dh }, { onConflict: 'endpoint' })
      setSubscribed(true)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  async function disableNotifications() {
    const r = await navigator.serviceWorker.ready
    const s = await r.pushManager.getSubscription()
    if (s) { await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint); await s.unsubscribe(); setSubscribed(false) }
  }

  async function sendTestNotification() {
    setTestLoading(true)
    setTestStatus('')
    try {
      const r = await navigator.serviceWorker.ready
      const s = await r.pushManager.getSubscription()
      if (!s) {
        setSubscribed(false)
        setTestStatus('No active subscription. Enable notifications again.')
        return
      }

      const res = await fetch('/api/notify/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: s.endpoint }),
      })
      const data = await res.json()
      setTestStatus(res.ok ? 'Test sent. Check this device.' : data.error || 'Could not send test.')
    } catch (e) {
      console.error(e)
      setTestStatus('Could not send test.')
    } finally {
      setTestLoading(false)
    }
  }

  async function resetToday() {
    setResetLoading(true)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    await supabase.from('daily_logs').delete().eq('date', today)
    await supabase.from('quick_adds').delete().eq('date', today)
    setResetDone(true)
    setTimeout(() => { window.location.href = '/' }, 600)
  }

  async function syncHealthNow() {
    setHealthSyncing(true)
    try {
      await fetch('/api/health/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 7 }),
      })
      await loadHealthStatus()
    } catch (error) {
      console.error(error)
    } finally {
      setHealthSyncing(false)
    }
  }

  async function disconnectHealth() {
    setHealthSyncing(true)
    try {
      await fetch('/api/health/disconnect', { method: 'POST' })
      await loadHealthStatus()
    } catch (error) {
      console.error(error)
    } finally {
      setHealthSyncing(false)
    }
  }

  const latestHealth = healthStatus?.latest?.[0]
  const healthWeek = healthStatus?.latest?.slice(0, 7) || []
  const healthWeekSummary = summarizeHealthWeek(healthWeek)
  const healthNeedsReconnect = hasHealthScopeError(latestHealth)
  const hasAnyHealthValue = Boolean(latestHealth && [
    latestHealth.steps,
    latestHealth.calories_out,
    latestHealth.activity_calories,
    latestHealth.active_minutes,
    latestHealth.active_zone_minutes,
    latestHealth.resting_heart_rate,
    latestHealth.sleep_minutes,
    latestHealth.weight_kg,
  ].some((value) => value !== null && value !== undefined))

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
        <details className="t-card rounded-2xl p-4 group">
          <summary className="list-none cursor-pointer flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm t-text mb-0.5">Theme</p>
              <p className="text-xs t-muted">{theme.emoji} {theme.label} active</p>
            </div>
            <span className="text-xs t-muted group-open:rotate-180 transition-transform">⌄</span>
          </summary>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            {THEMES.map((t) => {
              const active = theme.name === t.name
              return (
                <button key={t.name} onClick={() => setTheme(t.name as ThemeName)}
                  className="rounded-xl overflow-hidden transition-all text-left"
                  style={{
                    border: active ? `2px solid ${t.preview.accent}` : `2px solid transparent`,
                    boxShadow: active ? `0 0 0 1px ${t.preview.accent}40, 0 6px 20px ${t.preview.accent}25` : 'none',
                    outline: active ? 'none' : undefined,
                  }}>
                  <div className="p-3 h-20 flex flex-col gap-1.5" style={{ background: t.preview.bg }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: t.preview.accent }} />
                      <div className="h-1.5 rounded-full flex-1" style={{ background: t.preview.card, opacity: 0.8 }} />
                    </div>
                    <div className="rounded-lg p-1.5 flex-1 flex flex-col gap-1" style={{ background: t.preview.card }}>
                      <div className="h-1.5 w-3/4 rounded-full" style={{ background: t.preview.accent, opacity: 0.7 }} />
                      <div className="flex gap-1 mt-auto">
                        {[1,0.6,0.4].map((op,i) => (
                          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: t.preview.accent, opacity: op }} />
                        ))}
                      </div>
                    </div>
                  </div>
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
        </details>

        {/* MEALS */}
        <Link href="/meals" className="t-card rounded-2xl p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-opacity">
          <div>
            <p className="font-semibold text-sm t-text mb-0.5">Meal Library</p>
            <p className="text-xs t-muted">View available day plans, meals, ingredients, and swaps</p>
          </div>
          <span className="text-lg t-accent">→</span>
        </Link>

        {/* HEALTH */}
        <div className="t-card rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-sm t-text mb-0.5">Google Health Sync</p>
              <p className="text-xs t-muted">Fitbit Charge 6 activity, heart, body, and sleep context for Claude analysis</p>
            </div>
            <WatchIcon size={22} className="t-muted" />
          </div>

          {healthLoading ? (
            <p className="text-xs t-muted mt-3">Checking connection...</p>
          ) : !healthStatus?.configured ? (
            <div className="rounded-xl p-3 mt-3" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--amber)' }}>Setup needed</p>
              <p className="text-xs t-muted mt-1">{healthStatus?.message || 'Add Google Health env vars and run the health SQL migration.'}</p>
            </div>
          ) : healthStatus.connected ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="t-muted">Connected to Google Health</span>
                <span className="t-accent font-semibold">✓ Active</span>
              </div>
              {healthNeedsReconnect && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--amber)' }}>Reconnect required</p>
                  <p className="text-xs t-muted mt-1">Google denied the current token because it was granted before the new Health scopes. Disconnect, connect again, then sync.</p>
                </div>
              )}
              {healthWeek.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    ['Steps', healthWeekSummary.avgSteps ? healthWeekSummary.avgSteps.toLocaleString() : '-'],
                    ['Burn/day', healthWeekSummary.avgBurn ? `${healthWeekSummary.avgBurn}` : '-'],
                    ['Move/day', healthWeekSummary.avgMove ? `${healthWeekSummary.avgMove}` : '-'],
                    ['Active/day', healthWeekSummary.avgActive ? `${healthWeekSummary.avgActive}m` : '-'],
                  ].map(([label, value]) => (
                    <div key={label} className="macro-pill rounded-xl p-2 text-center">
                      <p className="text-xs font-bold t-text">{value}</p>
                      <p className="text-[10px] t-muted">{label}</p>
                    </div>
                  ))}
                </div>
              )}
              {latestHealth && hasAnyHealthValue && (
                <p className="text-[11px] t-muted">
                  {[
                    `${healthWeekSummary.days} synced days`,
                    healthWeekSummary.totalMove ? `${healthWeekSummary.totalMove} active cal total` : null,
                    healthWeekSummary.avgSleep ? `${healthWeekSummary.avgSleep}h avg sleep` : null,
                  ].filter(Boolean).join(' • ')}
                </p>
              )}
              {latestHealth && !healthNeedsReconnect && !hasAnyHealthValue && (
                <p className="text-[11px] t-muted">Connected, but Google Health did not return activity/body values for the latest synced days.</p>
              )}
              <p className="text-[11px] t-muted">
                {healthStatus.last_sync_at
                  ? `Last sync ${new Date(healthStatus.last_sync_at).toLocaleString()}`
                  : 'No sync completed yet.'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={syncHealthNow}
                  disabled={healthSyncing}
                  className="btn-secondary rounded-xl py-2.5 text-xs font-semibold disabled:opacity-50"
                >
                  {healthSyncing ? 'Syncing...' : 'Sync now'}
                </button>
                <button
                  onClick={disconnectHealth}
                  disabled={healthSyncing}
                  className="rounded-xl py-2.5 text-xs font-semibold disabled:opacity-50"
                  style={{ border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)' }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <a
              href="/api/health/connect"
              className="mt-3 block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}
            >
              Connect Google Health
            </a>
          )}
        </div>

                {/* NOTIFICATIONS */}
        <div className="t-card rounded-2xl p-4">
          <p className="font-semibold text-sm t-text mb-0.5">Push Notifications</p>
          <p className="text-xs t-muted mb-3">12 PM lunch • 6 PM dinner • 12 AM daily recap • weekly report</p>
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
              <span className="inline-flex items-center justify-center gap-2">
                <BellIcon size={16} />
                {loading ? 'Setting up...' : subscribed ? 'Disable Notifications' : 'Enable Notifications'}
              </span>
            </button>
          )}
          {subscribed && (
            <div className="mt-3 space-y-1.5">
              {['12:00 PM PT — Lunch reminder', '6:00 PM PT — Dinner reminder', '12:00 AM PST — Daily nutrition recap', 'Monday 12:00 AM PST — Weekly nutrition report'].map(t => (
                <div key={t} className="flex justify-between text-xs">
                  <span className="t-muted">{t}</span>
                  <span className="t-accent">✓ Active</span>
                </div>
              ))}
              <button
                onClick={sendTestNotification}
                disabled={testLoading}
                className="mt-2 w-full btn-secondary disabled:opacity-50 rounded-xl py-2.5 text-xs font-semibold"
              >
                {testLoading ? 'Sending test...' : 'Send test notification'}
              </button>
              {testStatus && <p className="text-xs t-muted">{testStatus}</p>}
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
          <p className="text-xs t-muted mb-3">Clears today&apos;s log and quick adds. Cannot undo.</p>
          <button onClick={resetToday} disabled={resetLoading || resetDone}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
            style={{ border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)' }}>
            <span className="inline-flex items-center justify-center gap-2">
              {!resetDone && !resetLoading && <TrashIcon size={15} />}
              {resetDone ? '✓ Cleared — redirecting...' : resetLoading ? 'Clearing...' : 'Reset Today'}
            </span>
          </button>
        </div>

      </div>

      <BottomNav active="settings" />
    </main>
  )
}

function hasHealthScopeError(metrics?: HealthDailyMetrics) {
  const raw = metrics?.raw
  if (!raw || typeof raw !== 'object') return false
  return Object.values(raw as Record<string, unknown>).some((value) => {
    if (!value || typeof value !== 'object') return false
    const error = (value as { error?: unknown }).error
    return typeof error === 'string' && error.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')
  })
}

function summarizeHealthWeek(items: HealthDailyMetrics[]) {
  const avg = (values: Array<number | null | undefined>) => {
    const valid = values.filter((value): value is number => typeof value === 'number')
    if (valid.length === 0) return null
    return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length)
  }
  const sum = (values: Array<number | null | undefined>) => values.reduce<number>((total, value) => total + (typeof value === 'number' ? value : 0), 0)
  const avgSleepMinutes = avg(items.map((item) => item.sleep_minutes))
  return {
    days: items.length,
    avgSteps: avg(items.map((item) => item.steps)),
    avgBurn: avg(items.map((item) => item.calories_out)),
    avgMove: avg(items.map((item) => item.activity_calories)),
    avgActive: avg(items.map((item) => item.active_minutes)),
    avgSleep: avgSleepMinutes ? Math.round((avgSleepMinutes / 60) * 10) / 10 : null,
    totalMove: Math.round(sum(items.map((item) => item.activity_calories))),
  }
}

function urlBase64ToUint8Array(b: string) {
  const p = '='.repeat((4 - b.length % 4) % 4)
  const d = (b + p).replace(/-/g, '+').replace(/_/g, '/')
  return new Uint8Array([...window.atob(d)].map(c => c.charCodeAt(0)))
}
