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
  const latestDailyAi = selectedLog
    ? aiReports.find((report) => report.report_type === 'daily' && report.period_end === selectedLog.date)
    : null
  const latestWeeklyAi = aiReports.find((report) => report.report_type === 'weekly')
  const weekAnalyses = logs.slice(0, 7).map((log) => analyzeFoodDay(log, quickAdds.filter((item) => item.date === log.date)))
  const weekHealth = healthMetrics.slice(0, 7)
  const weekRows = buildHealthFoodRows(weekHealth, weekAnalyses)
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
          {latestDailyAi && (
            <section className="t-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs t-muted uppercase tracking-wider">Claude daily coach</p>
                  <h2 className="text-lg font-bold t-text mt-1">{latestDailyAi.analysis.title}</h2>
                </div>
                <p className="text-[10px] t-muted text-right">{latestDailyAi.model}</p>
              </div>
              <p className="text-sm t-muted mt-2">{latestDailyAi.analysis.summary}</p>
              <div className="mt-3 space-y-2">
                {latestDailyAi.analysis.next_actions?.map((item) => (
                  <p key={item} className="text-sm t-text">→ {item}</p>
                ))}
              </div>
            </section>
          )}

          <section className="t-card rounded-2xl p-4">
            <p className="text-xs t-muted uppercase tracking-wider">Latest analysis</p>
            <h2 className="text-lg font-bold t-text mt-1">{formatMonitorDate(latestAnalysis.date)}</h2>
            <p className="text-sm t-muted mt-2">{latestAnalysis.headline}</p>
            <div className="grid grid-cols-5 gap-1.5 mt-4">
              {[
                ['Cal', Math.round(latestAnalysis.totals.cal)],
                ['P', `${Math.round(latestAnalysis.totals.protein)}g`],
                ['Na', `${Math.round(latestAnalysis.totals.sodium)}mg`],
                ['F', `${Math.round(latestAnalysis.totals.fiber)}g`],
                ['C', `${Math.round(latestAnalysis.totals.carbs)}g`],
              ].map(([label, value]) => (
                <div key={label} className="macro-pill rounded-xl p-2 text-center">
                  <p className="text-xs font-bold t-text">{value}</p>
                  <p className="text-[10px] t-muted">{label}</p>
                </div>
              ))}
            </div>
          </section>

          {weekAnalyses.length > 0 && (
            <section className="t-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs t-muted uppercase tracking-wider">Last 7 daily reports</p>
                  <h2 className="text-lg font-bold t-text mt-1">Each day separated</h2>
                </div>
                <p className="text-xs t-muted text-right">
                  {weekRows.length} day{weekRows.length === 1 ? '' : 's'}
                </p>
              </div>
              <p className="text-xs t-muted mt-3">
                Intake is food logged. Burned is total calories out, including resting and sleeping baseline. No weekly blending here.
              </p>
              {weekHealth.length > 0 && weekHealth.every((item) => typeof item.sleep_minutes !== 'number') && (
                <p className="text-xs t-muted mt-1">Sleep is blank until Google Health returns sleep data.</p>
              )}
              <div className="mt-4 space-y-2">
                {weekRows.map((row) => (
                  <div key={row.date} className="macro-pill rounded-xl p-3">
                    <div className="flex items-start justify-between gap-3 border-b t-border pb-2">
                      <div>
                        <p className="text-xs font-semibold t-text">{formatMonitorDate(row.date)}</p>
                        <p className="text-[11px] t-muted mt-0.5">{row.headline || 'No food analysis for this day.'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold t-text">{row.intake !== null ? `${row.intake} cal` : '- cal'}</p>
                        <p className="text-[11px] t-muted">{row.readiness !== null ? `${row.readiness} readiness` : 'No readiness'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 mt-3">
                      {[
                        ['P', row.protein !== null ? `${row.protein}g` : '-'],
                        ['Na', row.sodium !== null ? `${row.sodium}mg` : '-'],
                        ['F', row.fiber !== null ? `${row.fiber}g` : '-'],
                        ['Steps', row.steps !== null ? row.steps.toLocaleString() : '-'],
                        ['Burn', row.burned !== null ? `${row.burned}` : '-'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg p-1.5 text-center" style={{ background: 'var(--card)' }}>
                          <p className="text-[10px] font-bold t-text leading-tight">{value}</p>
                          <p className="text-[9px] t-muted leading-tight">{label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] t-muted mt-2">
                      Sleep: {row.sleepHours !== null ? `${row.sleepHours}h` : 'not synced'} • Burned: {row.burned !== null ? `${row.burned} cal` : 'not synced'}
                    </p>
                    {row.readinessNote && <p className="text-[10px] t-muted mt-2">{row.readinessNote}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="t-card rounded-2xl p-4">
            <p className="text-xs t-muted uppercase tracking-wider mb-3">What was eaten</p>
            {latestAnalysis.eaten.length === 0 ? (
              <p className="text-sm t-muted">No eaten meals were confirmed for this day.</p>
            ) : (
              <div className="space-y-2">
                {latestAnalysis.eaten.map((entry, index) => (
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
          </section>

          <section className="grid grid-cols-1 gap-3">
            <div className="t-card rounded-2xl p-4">
              <p className="text-xs t-muted uppercase tracking-wider mb-3">Good signals</p>
              {latestAnalysis.positives.length === 0 ? (
                <p className="text-sm t-muted">No strong positives yet. Add or confirm more food to analyze.</p>
              ) : (
                <div className="space-y-2">
                  {latestAnalysis.positives.map((item) => (
                    <p key={item} className="text-sm t-text">✓ {item}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="t-card rounded-2xl p-4">
              <p className="text-xs t-muted uppercase tracking-wider mb-3">Watch</p>
              {latestAnalysis.watch.length === 0 ? (
                <p className="text-sm t-accent font-semibold">No major issues from what was eaten.</p>
              ) : (
                <div className="space-y-2">
                  {latestAnalysis.watch.map((item) => (
                    <p key={item} className="text-sm t-text">• {item}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="t-card rounded-2xl p-4">
              <p className="text-xs t-muted uppercase tracking-wider mb-3">Next move</p>
              {latestAnalysis.suggestions.length === 0 ? (
                <p className="text-sm t-muted">Keep the same pattern unless hunger or training changes.</p>
              ) : (
                <div className="space-y-2">
                  {latestAnalysis.suggestions.map((item) => (
                    <p key={item} className="text-sm t-text">→ {item}</p>
                  ))}
                </div>
              )}
            </div>
          </section>

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

          <section className="t-card rounded-2xl p-4">
            <p className="text-xs t-muted uppercase tracking-wider mb-3">Recent daily analyses</p>
            <div className="space-y-2">
              {weekAnalyses.map((analysis) => (
                <div key={analysis.date} className="border-b t-border pb-2 last:border-b-0 last:pb-0">
                  <p className="text-sm font-semibold t-text">{formatMonitorDate(analysis.date)}</p>
                  <p className="text-xs t-muted mt-0.5">{analysis.headline}</p>
                </div>
              ))}
            </div>
          </section>
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
    burned: number | null
    steps: number | null
    sleepHours: number | null
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
      burned: metrics?.calories_out || null,
      steps: metrics?.steps || null,
      sleepHours: typeof metrics?.sleep_minutes === 'number'
        ? Math.round((metrics.sleep_minutes / 60) * 10) / 10
        : null,
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
      burned: metrics.calories_out || null,
      steps: metrics.steps || null,
      sleepHours: typeof metrics.sleep_minutes === 'number'
        ? Math.round((metrics.sleep_minutes / 60) * 10) / 10
        : null,
      readiness: metrics.readiness_score || null,
      readinessNote: metrics.readiness_note || null,
    })
  })
  return rows
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
}
