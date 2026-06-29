'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase, DailyLog } from '@/lib/supabase'
import { TARGETS } from '@/lib/meals'

type MetricKey = 'cal' | 'protein' | 'sodium' | 'fiber' | 'carbs'

interface MonitorDay {
  date: string
  cal: number
  protein: number
  sodium: number
  fiber: number
  carbs: number
  complete: boolean
}

const METRICS: Array<{ key: MetricKey; label: string; unit: string; target: number; invert?: boolean; color: string }> = [
  { key: 'cal', label: 'Calories', unit: 'cal', target: TARGETS.cal, color: 'var(--macro-cal)' },
  { key: 'protein', label: 'Protein', unit: 'g', target: TARGETS.protein, color: 'var(--macro-protein)' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', target: TARGETS.sodium, invert: true, color: 'var(--macro-sodium)' },
  { key: 'fiber', label: 'Fiber', unit: 'g', target: TARGETS.fiber, color: 'var(--macro-fiber)' },
  { key: 'carbs', label: 'Carbs', unit: 'g', target: TARGETS.carbs, color: 'var(--macro-carbs)' },
]

function valueFor(log: DailyLog, key: MetricKey) {
  const consumed = log[`${key}_consumed` as keyof DailyLog]
  const planned = log[`${key}_total` as keyof DailyLog]
  return Number(consumed || planned || 0)
}

function toDay(log: DailyLog): MonitorDay {
  return {
    date: log.date,
    cal: valueFor(log, 'cal'),
    protein: valueFor(log, 'protein'),
    sodium: valueFor(log, 'sodium'),
    fiber: valueFor(log, 'fiber'),
    carbs: valueFor(log, 'carbs'),
    complete: Boolean(log.breakfast_confirmed || log.lunch_confirmed || log.dinner_confirmed || log.shake_confirmed || log.snack_confirmed),
  }
}

function average(days: MonitorDay[], key: MetricKey) {
  if (days.length === 0) return 0
  return days.reduce((sum, day) => sum + day[key], 0) / days.length
}

function hitRate(days: MonitorDay[], key: MetricKey, invert?: boolean) {
  if (days.length === 0) return 0
  const hits = days.filter((day) => invert ? day[key] <= TARGETS[key] : day[key] >= TARGETS[key]).length
  return Math.round((hits / days.length) * 100)
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function trend(now: number, previous: number) {
  if (!previous) return { label: 'new', tone: 't-muted' }
  const delta = ((now - previous) / previous) * 100
  const sign = delta > 0 ? '+' : ''
  return {
    label: `${sign}${Math.round(delta)}%`,
    tone: Math.abs(delta) < 5 ? 't-muted' : delta > 0 ? 't-accent' : 'text-amber-500',
  }
}

export default function MonitorPage() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('daily_logs').select('*').order('date', { ascending: false }).limit(90)
      .then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [])

  const days = useMemo(() => logs.map(toDay), [logs])
  const last7 = days.slice(0, 7)
  const previous7 = days.slice(7, 14)
  const chartDays = [...last7].reverse()
  const riskDays = last7.filter((day) => day.sodium > TARGETS.sodium || day.protein < TARGETS.protein || day.fiber < TARGETS.fiber)

  const weeklyScore = last7.length
    ? Math.round(METRICS.reduce((score, metric) => score + hitRate(last7, metric.key, metric.invert), 0) / METRICS.length)
    : 0

  return (
    <main className="max-w-md mx-auto min-h-screen pb-24 t-bg">
      <div className="app-header px-4 pt-10 pb-5 flex items-center gap-3">
        <Link href="/" className="text-xl btn-secondary w-8 h-8 flex items-center justify-center rounded-full">←</Link>
        <div>
          <h1 className="text-xl font-bold t-text">Nutrition Monitor</h1>
          <p className="text-xs t-muted">Daily and weekly nutrition signals</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : days.length === 0 ? (
        <div className="text-center py-20 px-4">
          <p className="text-4xl mb-3">📈</p>
          <p className="t-muted text-sm">No logs yet. Track a few days and this page will light up.</p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          <section className="t-card rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs t-muted uppercase tracking-wider">Weekly score</p>
                <p className="text-3xl font-bold t-text mt-1">{weeklyScore}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs t-muted">Last {last7.length} logged days</p>
                <p className="text-sm font-semibold t-accent">{riskDays.length === 0 ? 'On track' : `${riskDays.length} watch days`}</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-2">
            {METRICS.map((metric) => {
              const avg = average(last7, metric.key)
              const previousAvg = average(previous7, metric.key)
              const t = trend(avg, previousAvg)
              const pct = metric.invert ? Math.min(100, (metric.target / Math.max(avg, 1)) * 100) : Math.min(100, (avg / metric.target) * 100)
              return (
                <div key={metric.key} className="t-card rounded-2xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs t-muted uppercase tracking-wider">{metric.label}</p>
                      <p className="text-xl font-bold t-text mt-1">{Math.round(avg)}<span className="text-xs t-muted ml-1">{metric.unit}</span></p>
                    </div>
                    <span className={`text-xs font-semibold ${t.tone}`}>{t.label}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full overflow-hidden macro-pill">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: metric.color }} />
                  </div>
                  <div className="flex justify-between mt-1 text-[11px] t-muted">
                    <span>{hitRate(last7, metric.key, metric.invert)}% hit</span>
                    <span>{metric.invert ? '<=' : '>='}{metric.target}{metric.unit}</span>
                  </div>
                </div>
              )
            })}
          </section>

          <section className="t-card rounded-2xl p-4">
            <p className="text-xs t-muted uppercase tracking-wider mb-3">7-day trend</p>
            <div className="space-y-3">
              {chartDays.map((day) => (
                <div key={day.date}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium t-text">{formatDate(day.date)}</p>
                    <p className="text-xs t-muted">{Math.round(day.cal)} cal • {Math.round(day.protein)}g P • {Math.round(day.sodium)}mg Na</p>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {METRICS.map((metric) => {
                      const rawPct = (day[metric.key] / metric.target) * 100
                      const pct = Math.max(3, Math.min(100, rawPct))
                      const bad = metric.invert ? day[metric.key] > metric.target : day[metric.key] < metric.target
                      return (
                        <div key={metric.key} className="h-2 rounded-full overflow-hidden macro-pill">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: bad ? 'var(--amber)' : metric.color }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="t-card rounded-2xl p-4">
            <p className="text-xs t-muted uppercase tracking-wider mb-3">Watch list</p>
            {riskDays.length === 0 ? (
              <p className="text-sm t-accent font-semibold">No major issues in the last week.</p>
            ) : (
              <div className="space-y-2">
                {riskDays.map((day) => {
                  const issues = [
                    day.sodium > TARGETS.sodium ? 'Na over' : '',
                    day.protein < TARGETS.protein ? 'Protein low' : '',
                    day.fiber < TARGETS.fiber ? 'Fiber low' : '',
                  ].filter(Boolean)
                  return (
                    <div key={day.date} className="flex items-center justify-between gap-3 border-b t-border pb-2 last:border-b-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold t-text">{formatDate(day.date)}</p>
                        <p className="text-xs t-muted">{issues.join(' • ')}</p>
                      </div>
                      <Link href="/history" className="text-xs btn-secondary rounded-lg px-2 py-1">Review</Link>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bottom-nav flex">
        <Link href="/" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">📋</span><span className="text-[11px]">Today</span>
        </Link>
        <Link href="/history" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">📅</span><span className="text-[11px]">History</span>
        </Link>
        <button className="flex-1 py-4 t-accent flex flex-col items-center gap-1">
          <span className="text-lg">📈</span><span className="text-[11px] font-semibold">Monitor</span>
        </button>
        <Link href="/settings" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">⚙️</span><span className="text-[11px]">Settings</span>
        </Link>
      </nav>
    </main>
  )
}
