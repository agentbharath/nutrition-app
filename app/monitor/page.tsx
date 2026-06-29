'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase, DailyLog } from '@/lib/supabase'
import type { HealthDailyMetrics } from '@/lib/supabase'
import type { ClaudeNutritionReport } from '@/lib/claude-nutrition'
import { analyzeFoodDay, formatMonitorDate, QuickAddEntry, toMonitorDay, weeklyScore } from '@/lib/nutrition-monitor'
import BottomNav from '@/components/BottomNav'
import { ChartIcon } from '@/components/Icons'

interface AiReportRow {
  report_type: 'daily' | 'weekly'
  period_start: string
  period_end: string
  model: string
  analysis: ClaudeNutritionReport
}

export default function MonitorPage() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [quickAdds, setQuickAdds] = useState<QuickAddEntry[]>([])
  const [aiReports, setAiReports] = useState<AiReportRow[]>([])
  const [healthMetrics, setHealthMetrics] = useState<HealthDailyMetrics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: logData } = await supabase.from('daily_logs').select('*').order('date', { ascending: false }).limit(90)
      const dates = (logData || []).map((log) => log.date)
      const { data: quickAddData } = dates.length
        ? await supabase.from('quick_adds').select('*').in('date', dates)
        : { data: [] }
      const { data: reportData } = await supabase
        .from('nutrition_ai_reports')
        .select('report_type, period_start, period_end, model, analysis')
        .order('period_end', { ascending: false })
        .limit(14)
      setLogs(logData || [])
      setQuickAdds((quickAddData || []) as QuickAddEntry[])
      setAiReports((reportData || []) as AiReportRow[])
      const healthRes = await fetch('/api/health/status').catch(() => null)
      if (healthRes?.ok) {
        const healthData = await healthRes.json()
        setHealthMetrics(healthData.latest || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const days = useMemo(() => logs.map(toMonitorDay), [logs])
  const last7 = days.slice(0, 7)
  const score = last7.length
    ? weeklyScore(last7)
    : 0
  const selectedLog = logs[0]
  const latestAnalysis = selectedLog
    ? analyzeFoodDay(selectedLog, quickAdds.filter((item) => item.date === selectedLog.date))
    : null
  const latestWeeklyAi = aiReports.find((report) => report.report_type === 'weekly')
  const weekAnalyses = logs.slice(0, 7).map((log) => analyzeFoodDay(log, quickAdds.filter((item) => item.date === log.date)))
  const weekHealth = healthMetrics.slice(0, 7)
  const weekRows = buildHealthFoodRows(weekHealth, weekAnalyses)
  const [selectedDate, setSelectedDate] = useState('')
  const activeDate = selectedDate && weekRows.some((row) => row.date === selectedDate)
    ? selectedDate
    : weekRows[0]?.date || ''
  const selectedRow = weekRows.find((row) => row.date === activeDate)
  const selectedAnalysis = weekAnalyses.find((analysis) => analysis.date === activeDate) || null
  const selectedDailyAi = aiReports.find((report) => report.report_type === 'daily' && report.period_end === activeDate)
  const repeatedWatches = weekAnalyses.flatMap((analysis) => analysis.watch)
  const sodiumWatchCount = repeatedWatches.filter((item) => item.toLowerCase().includes('sodium')).length
  const proteinWatchCount = repeatedWatches.filter((item) => item.toLowerCase().includes('protein')).length
  const fiberWatchCount = repeatedWatches.filter((item) => item.toLowerCase().includes('fiber')).length

  return (
    <main className="max-w-md mx-auto min-h-screen pb-24 t-bg">
      <div className="app-header px-4 pt-10 pb-5 flex items-center gap-3">
        <Link href="/" className="text-xl btn-secondary w-8 h-8 flex items-center justify-center rounded-full">←</Link>
        <div>
          <h1 className="text-xl font-bold t-text">Food Analysis</h1>
          <p className="text-xs t-muted">What you ate and what to adjust</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : days.length === 0 ? (
        <div className="text-center py-20 px-4">
          <ChartIcon size={44} className="mx-auto mb-3 t-muted" />
          <p className="t-muted text-sm">No logs yet. Track a few days and this page will light up.</p>
        </div>
      ) : latestAnalysis ? (
        <div className="px-4 space-y-3">
          {weekRows.length > 0 && selectedRow && (
            <section className="t-card rounded-2xl p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs t-muted uppercase tracking-wider">Last 7 daily reports</p>
                  <h2 className="text-lg font-bold t-text mt-1">Pick a day</h2>
                </div>
                <p className="text-xs t-muted text-right">
                  {weekRows.length} day{weekRows.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {weekRows.map((row) => {
                  const active = row.date === activeDate
                  const day = new Date(`${row.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' })
                  const date = new Date(`${row.date}T12:00:00`).getDate()
                  return (
                    <button
                      key={row.date}
                      onClick={() => setSelectedDate(row.date)}
                      className="shrink-0 rounded-2xl px-3 py-2 text-left transition-all"
                      style={{
                        minWidth: 76,
                        background: active ? 'var(--accent)' : 'var(--card)',
                        color: active ? '#ffffff' : 'var(--text)',
                        border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                        boxShadow: active ? '0 8px 22px rgba(0,0,0,0.12)' : 'none',
                      }}
                    >
                      <p className="text-[10px] font-semibold uppercase leading-tight">{day}</p>
                      <p className="text-lg font-bold leading-tight">{date}</p>
                      <p className="text-[10px] leading-tight" style={{ opacity: active ? 0.9 : 0.65 }}>
                        {row.intake !== null ? `${row.intake} cal` : 'No food'}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs t-muted uppercase tracking-wider">Selected day</p>
                    <h2 className="text-lg font-bold t-text mt-1">{formatMonitorDate(activeDate)}</h2>
                  </div>
                  <p className="text-xs font-semibold t-accent text-right">{selectedRow.intake !== null ? `${selectedRow.intake} cal` : 'No food'}</p>
                </div>
                <p className="text-sm t-muted mt-2">{selectedRow.headline || 'No nutrition logged for this day. Health data is still shown below.'}</p>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs t-muted uppercase tracking-wider mb-2">Nutrition tracked</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        ['Cal', selectedRow.intake !== null ? selectedRow.intake : '-'],
                        ['P', selectedRow.protein !== null ? `${selectedRow.protein}g` : '-'],
                        ['Na', selectedRow.sodium !== null ? `${selectedRow.sodium}mg` : '-'],
                        ['Fiber', selectedRow.fiber !== null ? `${selectedRow.fiber}g` : '-'],
                        ['Carbs', selectedRow.carbs !== null ? `${selectedRow.carbs}g` : '-'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg p-1.5 text-center macro-pill">
                          <p className="text-[10px] font-bold t-text leading-tight">{value}</p>
                          <p className="text-[9px] t-muted leading-tight">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs t-muted uppercase tracking-wider mb-2">Health tracked</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        ['Steps', selectedRow.steps !== null ? selectedRow.steps.toLocaleString() : '-'],
                        ['Burn', selectedRow.burned !== null ? selectedRow.burned : '-'],
                        ['Sleep', selectedRow.sleepHours !== null ? `${selectedRow.sleepHours}h` : '-'],
                        ['Sleep score', selectedRow.sleepScore !== null ? selectedRow.sleepScore : '-'],
                        ['Ready', selectedRow.readiness !== null ? selectedRow.readiness : '-'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg p-1.5 text-center macro-pill">
                          <p className="text-[10px] font-bold t-text leading-tight">{value}</p>
                          <p className="text-[9px] t-muted leading-tight">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedRow.readinessNote && <p className="text-[10px] t-muted mt-1">{selectedRow.readinessNote}</p>}
              </div>

              {selectedDailyAi ? (
                <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs t-muted uppercase tracking-wider">Claude daily report</p>
                      <h3 className="text-base font-bold t-text mt-1">{selectedDailyAi.analysis.title}</h3>
                    </div>
                    <p className="text-[10px] t-muted text-right">{selectedDailyAi.model}</p>
                  </div>
                  <p className="text-sm t-muted mt-2">{selectedDailyAi.analysis.summary}</p>
                  {Boolean(selectedDailyAi.analysis.next_actions?.length) && (
                    <div className="mt-3 space-y-1.5">
                      {selectedDailyAi.analysis.next_actions?.map((item) => (
                        <p key={item} className="text-sm t-text">→ {item}</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <p className="text-xs t-muted uppercase tracking-wider">Claude daily report</p>
                  <p className="text-sm t-muted mt-1">No Claude report saved for this date yet. The midnight run saves it under the day it analyzes.</p>
                </div>
              )}

              <details className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <summary className="list-none cursor-pointer flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold t-text">Food and rule details</span>
                  <span className="text-xs t-muted">Open</span>
                </summary>
                <div className="mt-3 space-y-3">
                  {!selectedAnalysis || selectedAnalysis.eaten.length === 0 ? (
                    <p className="text-sm t-muted">No food was logged for this date.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedAnalysis.eaten.map((entry, index) => (
                        <div key={`${entry.slot}-${entry.name}-${index}`} className="rounded-xl p-3 macro-pill">
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

                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <p className="text-xs t-muted uppercase tracking-wider mb-1">Good signals</p>
                      {(selectedAnalysis?.positives.length ? selectedAnalysis.positives : ['No nutrition analysis for this date.']).map((item) => (
                        <p key={item} className="text-sm t-text">✓ {item}</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs t-muted uppercase tracking-wider mb-1">Watch</p>
                      {(selectedAnalysis?.watch.length ? selectedAnalysis.watch : ['No food issues because no food was logged.']).map((item) => (
                        <p key={item} className="text-sm t-text">• {item}</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs t-muted uppercase tracking-wider mb-1">Next move</p>
                      {(selectedAnalysis?.suggestions.length ? selectedAnalysis.suggestions : ['Backfill the day if you ate but did not log it.']).map((item) => (
                        <p key={item} className="text-sm t-text">→ {item}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </details>

              <p className="text-xs t-muted">
                A report generated at 12:00 AM for the previous day is saved and shown on that previous day&apos;s date.
              </p>
            </section>
          )}

          <section className="t-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs t-muted uppercase tracking-wider">Weekly food pattern</p>
                <p className="text-3xl font-bold t-text mt-1">{score}%</p>
              </div>
              <p className="text-xs t-muted text-right">Based on latest {weekAnalyses.length} logged days</p>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p className="t-text">Sodium watch days: <span className="font-semibold">{sodiumWatchCount}</span></p>
              <p className="t-text">Protein short days: <span className="font-semibold">{proteinWatchCount}</span></p>
              <p className="t-text">Fiber short days: <span className="font-semibold">{fiberWatchCount}</span></p>
            </div>
          </section>

          {latestWeeklyAi && (
            <section className="t-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs t-muted uppercase tracking-wider">Claude progressive report</p>
                  <h2 className="text-lg font-bold t-text mt-1">{latestWeeklyAi.analysis.title}</h2>
                </div>
                <p className="text-[10px] t-muted text-right">
                  {formatMonitorDate(latestWeeklyAi.period_start)} - {formatMonitorDate(latestWeeklyAi.period_end)}
                </p>
              </div>
              <p className="text-sm t-muted mt-2">{latestWeeklyAi.analysis.summary}</p>
              {Boolean(latestWeeklyAi.analysis.progress?.length) && (
                <div className="mt-3">
                  <p className="text-xs t-muted uppercase tracking-wider mb-2">Progress</p>
                  <div className="space-y-2">
                    {latestWeeklyAi.analysis.progress?.map((item) => (
                      <p key={item} className="text-sm t-text">✓ {item}</p>
                    ))}
                  </div>
                </div>
              )}
              {Boolean(latestWeeklyAi.analysis.focus_goals?.length) && (
                <div className="mt-3">
                  <p className="text-xs t-muted uppercase tracking-wider mb-2">Next week focus</p>
                  <div className="space-y-2">
                    {latestWeeklyAi.analysis.focus_goals?.map((item) => (
                      <p key={item} className="text-sm t-text">→ {item}</p>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

        </div>
      ) : (
        null
      )}

      <BottomNav active="analysis" />
    </main>
  )
}

function buildHealthFoodRows(health: HealthDailyMetrics[], analyses: ReturnType<typeof analyzeFoodDay>[]) {
  const healthByDate = new Map(health.map((item) => [item.date, item]))
  const rows: Array<{
    date: string
    headline: string | null
    intake: number | null
    protein: number | null
    sodium: number | null
    fiber: number | null
    carbs: number | null
    burned: number | null
    steps: number | null
    sleepHours: number | null
    sleepScore: number | null
    readiness: number | null
    readinessNote: string | null
  }> = analyses.map((analysis) => {
    const metrics = healthByDate.get(analysis.date)
    return {
      date: analysis.date,
      headline: analysis.headline,
      intake: Math.round(analysis.totals.cal),
      protein: Math.round(analysis.totals.protein),
      sodium: Math.round(analysis.totals.sodium),
      fiber: Math.round(analysis.totals.fiber),
      carbs: Math.round(analysis.totals.carbs),
      burned: metrics?.calories_out || null,
      steps: metrics?.steps || null,
      sleepHours: typeof metrics?.sleep_minutes === 'number'
        ? Math.round((metrics.sleep_minutes / 60) * 10) / 10
        : null,
      sleepScore: metrics?.sleep_efficiency || null,
      readiness: metrics?.readiness_score || null,
      readinessNote: metrics?.readiness_note || null,
    }
  })
  const analysisDates = new Set(rows.map((row) => row.date))
  health.forEach((metrics) => {
    if (analysisDates.has(metrics.date)) return
    rows.push({
      date: metrics.date,
      headline: null,
      intake: null,
      protein: null,
      sodium: null,
      fiber: null,
      carbs: null,
      burned: metrics.calories_out || null,
      steps: metrics.steps || null,
      sleepHours: typeof metrics.sleep_minutes === 'number'
        ? Math.round((metrics.sleep_minutes / 60) * 10) / 10
        : null,
      sleepScore: metrics.sleep_efficiency || null,
      readiness: metrics.readiness_score || null,
      readinessNote: metrics.readiness_note || null,
    })
  })
  return rows
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
}
