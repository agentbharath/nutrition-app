'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase, DailyLog, DayType } from '@/lib/supabase'
import { DAY_TYPE_OPTIONS } from '@/lib/meals'
import { QuickAddEntry, analyzeFoodDay, formatMonitorDate } from '@/lib/nutrition-monitor'

function toDateKey(date: Date) {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function dateFromKey(date: string) {
  return new Date(`${date}T12:00:00`)
}

function getMonthDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const leading = first.getDay()
  const cells: Array<string | null> = Array.from({ length: leading }, () => null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(month.getFullYear(), month.getMonth(), day)
    cells.push(toDateKey(d))
  }

  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function getDayLabel(dayType: DayType) {
  return DAY_TYPE_OPTIONS.find((day) => day.value === dayType)
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [quickAdds, setQuickAdds] = useState<QuickAddEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleMonth, setVisibleMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))

  useEffect(() => {
    async function load() {
      const { data: logData } = await supabase.from('daily_logs').select('*').order('date', { ascending: false }).limit(120)
      const dates = (logData || []).map((log) => log.date)
      const { data: quickAddData } = dates.length
        ? await supabase.from('quick_adds').select('*').in('date', dates)
        : { data: [] }
      setLogs(logData || [])
      setQuickAdds((quickAddData || []) as QuickAddEntry[])
      if (logData?.[0]) {
        setSelectedDate(logData[0].date)
        setVisibleMonth(dateFromKey(logData[0].date))
      }
      setLoading(false)
    }
    load()
  }, [])

  const logsByDate = useMemo(() => new Map(logs.map((log) => [log.date, log])), [logs])
  const selectedLog = logsByDate.get(selectedDate)
  const selectedQuickAdds = quickAdds.filter((item) => item.date === selectedDate)
  const selectedAnalysis = selectedLog ? analyzeFoodDay(selectedLog, selectedQuickAdds) : null
  const monthCells = getMonthDays(visibleMonth)
  const trackedInMonth = logs.filter((log) => log.date.startsWith(monthKey(visibleMonth))).length

  function shiftMonth(delta: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  return (
    <main className="max-w-md mx-auto min-h-screen pb-24 t-bg">
      <div className="app-header px-4 pt-10 pb-5 flex items-center gap-3">
        <Link href="/" className="text-xl btn-secondary w-8 h-8 flex items-center justify-center rounded-full">←</Link>
        <div>
          <h1 className="text-xl font-bold t-text">History</h1>
          <p className="text-xs t-muted">{logs.length} days tracked</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 px-4">
          <p className="text-4xl mb-3">📅</p>
          <p className="t-muted text-sm">No history yet. Start tracking today.</p>
          <Link href="/" className="t-accent text-sm mt-2 inline-block">Go to Today →</Link>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          <section className="t-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => shiftMonth(-1)} className="btn-secondary rounded-xl w-9 h-9 text-lg">‹</button>
              <div className="text-center">
                <p className="font-bold t-text">{monthLabel(visibleMonth)}</p>
                <p className="text-xs t-muted">{trackedInMonth} tracked days</p>
              </div>
              <button onClick={() => shiftMonth(1)} className="btn-secondary rounded-xl w-9 h-9 text-lg">›</button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <p key={day} className="text-[11px] t-muted font-semibold">{day}</p>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((date, index) => {
                const log = date ? logsByDate.get(date) : null
                const selected = date === selectedDate
                const dayInfo = log ? getDayLabel(log.day_type as DayType) : null
                return (
                  <button
                    key={date || `empty-${index}`}
                    disabled={!date}
                    onClick={() => date && setSelectedDate(date)}
                    className={`aspect-square rounded-xl text-xs font-semibold transition-all relative ${selected ? 'btn-primary' : log ? 'btn-secondary' : 't-muted'}`}
                    style={!date ? { opacity: 0, pointerEvents: 'none' } : undefined}
                  >
                    <span>{date ? dateFromKey(date).getDate() : ''}</span>
                    {log && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] leading-none">
                        {dayInfo?.emoji || '•'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="t-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs t-muted uppercase tracking-wider">Selected day</p>
                <h2 className="text-lg font-bold t-text mt-1">{formatMonitorDate(selectedDate)}</h2>
              </div>
              {selectedLog && (
                <div className="text-right">
                  <p className="text-sm font-semibold t-text">{getDayLabel(selectedLog.day_type as DayType)?.emoji} {getDayLabel(selectedLog.day_type as DayType)?.label}</p>
                  <p className="text-xs t-muted">{selectedLog.gym_day ? 'Gym day' : 'Rest day'}</p>
                </div>
              )}
            </div>

            {!selectedAnalysis ? (
              <p className="text-sm t-muted mt-4">No tracking for this date.</p>
            ) : (
              <>
                <p className="text-sm t-muted mt-3">{selectedAnalysis.headline}</p>
                <div className="grid grid-cols-5 gap-1.5 mt-4">
                  {[
                    ['Cal', Math.round(selectedAnalysis.totals.cal)],
                    ['P', `${Math.round(selectedAnalysis.totals.protein)}g`],
                    ['Na', `${Math.round(selectedAnalysis.totals.sodium)}mg`],
                    ['F', `${Math.round(selectedAnalysis.totals.fiber)}g`],
                    ['C', `${Math.round(selectedAnalysis.totals.carbs)}g`],
                  ].map(([label, value]) => (
                    <div key={label} className="macro-pill rounded-xl p-2 text-center">
                      <p className="text-xs font-bold t-text">{value}</p>
                      <p className="text-[10px] t-muted">{label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {selectedAnalysis && (
            <>
              <section className="t-card rounded-2xl p-4">
                <p className="text-xs t-muted uppercase tracking-wider mb-3">What you ate</p>
                {selectedAnalysis.eaten.length === 0 ? (
                  <p className="text-sm t-muted">No eaten meals were confirmed.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedAnalysis.eaten.map((entry, index) => (
                      <div key={`${entry.slot}-${entry.name}-${index}`} className="macro-pill rounded-xl p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider t-muted">{entry.slot}</p>
                            <p className="text-sm font-semibold t-text">{entry.name}</p>
                          </div>
                          <p className="text-xs font-semibold t-accent shrink-0">{Math.round(entry.cal)} cal</p>
                        </div>
                        <p className="text-[11px] t-muted mt-2">
                          {Math.round(entry.protein * 10) / 10}g P • {Math.round(entry.sodium)}mg Na • {Math.round(entry.fiber * 10) / 10}g fiber • {Math.round(entry.carbs * 10) / 10}g carbs
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="grid grid-cols-1 gap-3">
                <div className="t-card rounded-2xl p-4">
                  <p className="text-xs t-muted uppercase tracking-wider mb-3">Good signals</p>
                  {selectedAnalysis.positives.length === 0 ? (
                    <p className="text-sm t-muted">No strong positives yet.</p>
                  ) : selectedAnalysis.positives.map((item) => (
                    <p key={item} className="text-sm t-text mb-2 last:mb-0">✓ {item}</p>
                  ))}
                </div>

                <div className="t-card rounded-2xl p-4">
                  <p className="text-xs t-muted uppercase tracking-wider mb-3">Watch</p>
                  {selectedAnalysis.watch.length === 0 ? (
                    <p className="text-sm t-accent font-semibold">No major issues from what was eaten.</p>
                  ) : selectedAnalysis.watch.map((item) => (
                    <p key={item} className="text-sm t-text mb-2 last:mb-0">• {item}</p>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bottom-nav flex">
        <Link href="/" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">📋</span><span className="text-[11px]">Today</span>
        </Link>
        <button className="flex-1 py-4 t-accent flex flex-col items-center gap-1">
          <span className="text-lg">📅</span><span className="text-[11px] font-semibold">History</span>
        </button>
        <Link href="/monitor" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">📈</span><span className="text-[11px]">Analysis</span>
        </Link>
        <Link href="/settings" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">⚙️</span><span className="text-[11px]">Settings</span>
        </Link>
      </nav>
    </main>
  )
}
