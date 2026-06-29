'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase, DailyLog } from '@/lib/supabase'
import type { HealthDailyMetrics } from '@/lib/supabase'
import type { ClaudeNutritionReport } from '@/lib/claude-nutrition'
import { analyzeFoodDay, formatMonitorDate, QuickAddEntry, toMonitorDay, weeklyScore } from '@/lib/nutrition-monitor'

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
  const latestHealth = selectedLog
    ? healthMetrics.find((item) => item.date === selectedLog.date) || healthMetrics[0]
    : healthMetrics[0]
  const weekAnalyses = logs.slice(0, 7).map((log) => analyzeFoodDay(log, quickAdds.filter((item) => item.date === log.date)))
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
          <p className="text-4xl mb-3">📈</p>
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

          {latestHealth && (
            <section className="t-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs t-muted uppercase tracking-wider">Health context</p>
                  <h2 className="text-lg font-bold t-text mt-1">{formatMonitorDate(latestHealth.date)}</h2>
                </div>
                <p className="text-xs t-muted text-right">Fitbit</p>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-4">
                {[
                  ['Steps', latestHealth.steps ? latestHealth.steps.toLocaleString() : '-'],
                  ['Sleep', latestHealth.sleep_minutes ? `${Math.round(latestHealth.sleep_minutes / 60 * 10) / 10}h` : '-'],
                  ['AZM', latestHealth.active_zone_minutes ?? '-'],
                  ['RHR', latestHealth.resting_heart_rate ?? '-'],
                ].map(([label, value]) => (
                  <div key={label} className="macro-pill rounded-xl p-2 text-center">
                    <p className="text-xs font-bold t-text">{value}</p>
                    <p className="text-[10px] t-muted">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs t-muted mt-3">
                Claude uses this for activity, sleep, and recovery context. Food calories stay separate from calories burned.
              </p>
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

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bottom-nav flex">
        <Link href="/" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">📋</span><span className="text-[11px]">Today</span>
        </Link>
        <Link href="/history" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">📅</span><span className="text-[11px]">History</span>
        </Link>
        <button className="flex-1 py-4 t-accent flex flex-col items-center gap-1">
          <span className="text-lg">📈</span><span className="text-[11px] font-semibold">Analysis</span>
        </button>
        <Link href="/settings" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">⚙️</span><span className="text-[11px]">Settings</span>
        </Link>
      </nav>
    </main>
  )
}
