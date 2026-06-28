'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SettingsPage() {
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) { setNotifStatus('unsupported'); return }
    setNotifStatus(Notification.permission as 'granted' | 'denied')
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
      setNotifStatus(permission as 'granted' | 'denied')
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
        auth: (subJSON.keys as Record<string, string>)?.auth,
        p256dh: (subJSON.keys as Record<string, string>)?.p256dh,
      }, { onConflict: 'endpoint' })

      setSubscribed(true)
    } catch (e) {
      console.error(e)
    }
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
    window.location.href = '/'
  }

  return (
    <main className="max-w-md mx-auto min-h-screen pb-24">
      <div className="px-4 pt-10 pb-4 flex items-center gap-3">
        <Link href="/" className="text-gray-500 hover:text-white transition-colors text-xl">←</Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Notifications */}
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-4">
          <p className="font-semibold text-sm mb-1">Push Notifications</p>
          <p className="text-gray-500 text-xs mb-3">Get reminders at 12 PM (lunch) and 6 PM (dinner) PST every day</p>

          {notifStatus === 'unsupported' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <p className="text-amber-400 text-xs">⚠️ Push notifications not supported in this browser. Install the app to your home screen for best experience.</p>
            </div>
          )}

          {notifStatus === 'denied' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <p className="text-red-400 text-xs">🚫 Notifications blocked. Go to browser settings → Site Settings → Notifications to allow.</p>
            </div>
          )}

          {(notifStatus === 'unknown' || notifStatus === 'granted') && (
            <button
              onClick={subscribed ? disableNotifications : enableNotifications}
              disabled={loading}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                subscribed
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                  : 'bg-emerald-500 text-black hover:bg-emerald-400'
              } disabled:opacity-50`}
            >
              {loading ? 'Setting up...' : subscribed ? '🔕 Disable Notifications' : '🔔 Enable Notifications'}
            </button>
          )}

          {subscribed && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">12:00 PM PST — Lunch reminder</span>
                <span className="text-emerald-500">✓ Active</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">6:00 PM PST — Dinner reminder</span>
                <span className="text-emerald-500">✓ Active</span>
              </div>
            </div>
          )}
        </div>

        {/* Daily Targets */}
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-4">
          <p className="font-semibold text-sm mb-3">Daily Targets</p>
          <div className="space-y-2">
            {[
              { label: 'Calories', value: '1800 kcal', note: 'Gym days ~1850-1900 is fine' },
              { label: 'Protein', value: '140g+', note: 'Always over — expected' },
              { label: 'Sodium', value: '<1500mg', note: 'Hard ceiling every day' },
              { label: 'Fiber', value: '25g+', note: 'Aim for 35-40g' },
              { label: 'Carbs', value: '150-250g', note: 'Gym days aim 180-220g' },
            ].map(({ label, value, note }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#1E1E1E] last:border-0">
                <div>
                  <p className="text-sm">{label}</p>
                  <p className="text-xs text-gray-600">{note}</p>
                </div>
                <p className="text-sm font-semibold text-emerald-500">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Supplement Stack */}
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-4">
          <p className="font-semibold text-sm mb-3">Daily Supplement Stack</p>
          <div className="space-y-2">
            {[
              { time: 'Morning', item: 'Sports Research D3+K2', dose: '1 softgel', note: 'With breakfast' },
              { time: 'Night', item: "Doctor's Best Mag Glycinate", dose: '2 tablets', note: 'With ashwagandha' },
              { time: 'Night', item: 'Ashwagandha', dose: '2 pills', note: 'Cortisol + sleep' },
            ].map(({ time, item, dose, note }) => (
              <div key={item} className="flex items-center justify-between py-1.5 border-b border-[#1E1E1E] last:border-0">
                <div>
                  <p className="text-sm">{item}</p>
                  <p className="text-xs text-gray-600">{note}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-500">{dose}</p>
                  <p className="text-xs text-gray-600">{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-[#141414] border border-red-500/20 rounded-2xl p-4">
          <p className="font-semibold text-sm text-red-400 mb-1">Reset Today</p>
          <p className="text-gray-500 text-xs mb-3">Clears today's log so you can start fresh</p>
          <button
            onClick={resetToday}
            disabled={resetLoading}
            className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {resetLoading ? 'Resetting...' : '🗑 Reset Today'}
          </button>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0A0A0A] border-t border-[#222] flex">
        <Link href="/" className="flex-1 py-4 text-gray-500 flex flex-col items-center gap-1 hover:text-white transition-colors">
          <span className="text-lg">📋</span><span className="text-xs">Today</span>
        </Link>
        <Link href="/history" className="flex-1 py-4 text-gray-500 flex flex-col items-center gap-1 hover:text-white transition-colors">
          <span className="text-lg">📅</span><span className="text-xs">History</span>
        </Link>
        <button className="flex-1 py-4 text-emerald-500 flex flex-col items-center gap-1">
          <span className="text-lg">⚙️</span><span className="text-xs font-medium">Settings</span>
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
