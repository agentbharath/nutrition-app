import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { getClaudeModel, generateDailyClaudeReport, generateWeeklyClaudeReport } from '@/lib/claude-nutrition'
import { QuickAddEntry, analyzeFoodDay, buildDailyFoodSummary, buildWeeklySummary, getPacificDate, toMonitorDay } from '@/lib/nutrition-monitor'
import { DailyLog, NutritionAiReport } from '@/lib/supabase'
import { createServiceSupabase, getHealthMetricsForDates, healthIntegrationConfigured, syncRecentHealthDays } from '@/lib/health'

// Hobby plan defaults to 10s timeout — Claude API analysis + health sync
// routinely takes longer than that. This raises it to the Hobby max (60s).
export const maxDuration = 60

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

async function getPreviousWeeklyReport(beforeDate: string) {
  const { data } = await createServiceSupabase()
    .from('nutrition_ai_reports')
    .select('*')
    .eq('report_type', 'weekly')
    .lt('period_end', beforeDate)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle<NutritionAiReport>()

  return data?.analysis || null
}

async function saveAiReport(report: NutritionAiReport) {
  const { error } = await createServiceSupabase()
    .from('nutrition_ai_reports')
    .upsert(report, { onConflict: 'report_type,period_start,period_end' })

  if (error) console.error('Could not save AI report', error)
}

async function getQuickAddsForDates(dates: string[]) {
  if (dates.length === 0) return []
  const { data } = await createServiceSupabase()
    .from('quick_adds')
    .select('*')
    .in('date', dates)
    .returns<QuickAddEntry[]>()
  return data || []
}

export async function buildAnalysisMessage(type: string) {
  const supabase = createServiceSupabase()

  if ((type === 'daily-analysis' || type === 'weekly-analysis') && healthIntegrationConfigured()) {
    await syncRecentHealthDays(type === 'weekly-analysis' ? 8 : 2).catch((error) => {
      console.error('Health pre-sync failed', error)
    })
  }

  if (type === 'daily-analysis') {
    const date = getPacificDate(-1)
    const { data: log } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('date', date)
      .maybeSingle<DailyLog>()

    if (!log) {
      return {
        title: 'Daily nutrition recap',
        body: `No log found for ${date}. Open the app if you need to backfill it.`,
        url: '/monitor',
        analyzedDays: 0,
      }
    }

    const quickAdds = await getQuickAddsForDates([date])
    const analysis = analyzeFoodDay(log, quickAdds || [])
    const previousWeekly = await getPreviousWeeklyReport(date)
    const healthMetrics = (await getHealthMetricsForDates([date]))[0] || null

    // Pull the prior 5 days so the daily report can spot real trends
    // (repeated patterns, drift, streaks) instead of reasoning about
    // today in total isolation every single time.
    const recentDates: string[] = []
    for (let i = 1; i <= 5; i++) recentDates.push(getPacificDate(-1 - i))
    const { data: recentLogs } = await supabase
      .from('daily_logs')
      .select('*')
      .in('date', recentDates)
      .returns<DailyLog[]>()
    const recentQuickAdds = await getQuickAddsForDates(recentDates)
    const recentDaysTrend = (recentLogs || [])
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => {
        const a = analyzeFoodDay(l, recentQuickAdds || [])
        return { date: a.date, day: a.dayName, totals: a.totals }
      })

    const claudeReport = await generateDailyClaudeReport(analysis, previousWeekly, healthMetrics, recentDaysTrend)

    await saveAiReport({
      report_type: 'daily',
      period_start: date,
      period_end: date,
      model: getClaudeModel(),
      analysis: claudeReport,
      input_snapshot: { deterministic_analysis: analysis, health_metrics: healthMetrics, previous_weekly_report: previousWeekly },
    })

    const fallback = buildDailyFoodSummary(analysis)
    return {
      title: claudeReport.title || fallback.title,
      body: claudeReport.overall_assessment || fallback.body,
      url: '/monitor',
      analyzedDays: 1,
    }
  }

  if (type === 'weekly-analysis') {
    const endDate = getPacificDate(-1)
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('*')
      .lte('date', endDate)
      .order('date', { ascending: false })
      .limit(7)
      .returns<DailyLog[]>()

    const logData = logs || []
    const days = logData.map(toMonitorDay)
    if (days.length === 0) {
      return {
        title: 'Weekly nutrition report',
        body: 'No logs found for the last week yet. Track a few days and this report will become useful.',
        url: '/monitor',
        analyzedDays: 0,
      }
    }

    const sortedLogs = [...logData].sort((a, b) => a.date.localeCompare(b.date))
    const quickAdds = await getQuickAddsForDates(sortedLogs.map((log) => log.date))
    const analyses = sortedLogs.map((log) => analyzeFoodDay(log, quickAdds.filter((item) => item.date === log.date)))
    const previousWeekly = await getPreviousWeeklyReport(sortedLogs[0].date)
    const healthMetrics = await getHealthMetricsForDates(sortedLogs.map((log) => log.date))
    const claudeReport = await generateWeeklyClaudeReport(analyses, previousWeekly, healthMetrics)

    await saveAiReport({
      report_type: 'weekly',
      period_start: sortedLogs[0].date,
      period_end: sortedLogs[sortedLogs.length - 1].date,
      model: getClaudeModel(),
      analysis: claudeReport,
      input_snapshot: { deterministic_analyses: analyses, health_metrics: healthMetrics, previous_weekly_report: previousWeekly },
    })

    const fallback = buildWeeklySummary(days)
    return {
      title: claudeReport.title || fallback.title,
      body: claudeReport.overall_assessment || fallback.body,
      url: '/monitor',
      analyzedDays: days.length,
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type } = await req.json()
  const analysisMessage = await buildAnalysisMessage(type)

  const messages: Record<string, { title: string; body: string }> = {
    lunch: {
      title: '🥗 Lunch time!',
      body: "What's your day type? Open app to see your meal suggestion.",
    },
    dinner: {
      title: '🍽️ Dinner time!',
      body: 'Gym day or rest day? Open app for your dinner suggestion.',
    },
  }

  const msg = analysisMessage || messages[type] || messages.lunch

  const { data: subs } = await createServiceSupabase().from('push_subscriptions').select('*')
  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, analyzedDays: analysisMessage?.analyzedDays })
  }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
        JSON.stringify({ title: msg.title, body: msg.body, url: analysisMessage?.url || '/' })
      )
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ sent, failed, analyzedDays: analysisMessage?.analyzedDays })
}
