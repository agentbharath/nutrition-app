'use client'
import { useEffect, useState } from 'react'
import { supabase, DailyLog, DayType } from '@/lib/supabase'
import { DAY_TYPE_OPTIONS, TARGETS } from '@/lib/meals'
import Link from 'next/link'

export default function HistoryPage() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('daily_logs').select('*').order('date', { ascending: false }).limit(30)
      .then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [])

  function getStatus(log: DailyLog) {
    const issues = []
    const na = log.sodium_consumed || log.sodium_total
    const pro = log.protein_consumed || log.protein_total
    const cal = log.cal_consumed || log.cal_total
    if (na > TARGETS.sodium) issues.push('Na over')
    if (pro < TARGETS.protein) issues.push('P low')
    if (cal > 2100) issues.push('Cal high')
    return issues
  }

  function getDayLabel(dayType: DayType) {
    return DAY_TYPE_OPTIONS.find(d => d.value === dayType)
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00')
    const todayPST = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    const yesterdayPST = new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    if (dateStr === todayPST) return 'Today'
    if (dateStr === yesterdayPST) return 'Yesterday'
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <main className="max-w-md mx-auto min-h-screen pb-24 t-bg">
      <div className="px-4 pt-10 pb-4 flex items-center gap-3">
        <Link href="/" className="t-muted hover:t-text transition-colors text-xl">←</Link>
        <div>
          <h1 className="text-xl font-bold">History</h1>
          <p className="t-muted text-xs">{logs.length} days tracked</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📋</p>
          <p className="t-muted text-sm">No history yet. Start tracking today!</p>
          <Link href="/" className="text-emerald-500 text-sm mt-2 inline-block">Go to Today →</Link>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {logs.map((log) => {
            const dayInfo = getDayLabel(log.day_type as DayType)
            const issues = getStatus(log)
            const isExpanded = expanded === log.id
            return (
              <div key={log.id} className="t-card2 border t-border rounded-2xl overflow-hidden">
                <button
                  className="w-full p-4 text-left flex items-center gap-3"
                  onClick={() => setExpanded(isExpanded ? null : (log.id || null))}
                >
                  <span className="text-2xl">{dayInfo?.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{formatDate(log.date)}</p>
                      <div className="flex items-center gap-1">
                        {issues.length === 0
                          ? <span className="text-xs text-emerald-500 bg-emerald-500/10 rounded-lg px-2 py-0.5">✓ On track</span>
                          : issues.map(i => <span key={i} className="text-xs text-amber-500 bg-amber-500/10 rounded-lg px-2 py-0.5">{i}</span>)
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs t-muted">{dayInfo?.label}</span>
                      {log.gym_day && <span className="text-xs text-emerald-600">• 🏋️</span>}
                    </div>
                  </div>
                  <span className="t-muted text-xs">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="border-t t-border p-4">
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {[
                        { label: 'Cal', value: log.cal_consumed || log.cal_total, target: TARGETS.cal, unit: '' },
                        { label: 'Protein', value: log.protein_consumed || log.protein_total, target: TARGETS.protein, unit: 'g' },
                        { label: 'Sodium', value: log.sodium_consumed || log.sodium_total, target: TARGETS.sodium, unit: 'mg' },
                        { label: 'Fiber', value: log.fiber_consumed || log.fiber_total, target: TARGETS.fiber, unit: 'g' },
                        { label: 'Carbs', value: log.carbs_consumed || log.carbs_total, target: TARGETS.carbs, unit: 'g' },
                      ].map(({ label, value, target, unit }) => {
                        const pct = (Number(value) / target) * 100
                        const color = label === 'Sodium'
                          ? pct > 100 ? 'text-red-400' : pct > 85 ? 'text-amber-400' : 'text-emerald-400'
                          : pct >= 70 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 't-muted'
                        return (
                          <div key={label}>
                            <p className={`font-bold text-sm ${color}`}>{Math.round(Number(value))}{unit}</p>
                            <p className="t-muted text-xs">{label}</p>
                            <p className="text-gray-700 text-xs">/{target}{unit}</p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-3 flex gap-3 text-xs t-muted">
                      <span>{log.breakfast_confirmed ? '✓ Breakfast' : '○ Breakfast'}</span>
                      <span>{log.lunch_confirmed ? '✓ Lunch' : '○ Lunch'}</span>
                      <span>{log.dinner_confirmed ? '✓ Dinner' : '○ Dinner'}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto t-bg border-t t-border flex">
        <Link href="/" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">📋</span><span className="text-xs">Today</span>
        </Link>
        <button className="flex-1 py-4 text-emerald-500 flex flex-col items-center gap-1">
          <span className="text-lg">📅</span><span className="text-xs font-medium">History</span>
        </button>
        <Link href="/settings" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">⚙️</span><span className="text-xs">Settings</span>
        </Link>
      </nav>
    </main>
  )
}
