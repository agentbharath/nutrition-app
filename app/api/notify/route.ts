import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { QuickAddEntry, analyzeFoodDay, buildDailyFoodSummary, buildWeeklySummary, getPacificDate, toMonitorDay } from '@/lib/nutrition-monitor'
import { DailyLog } from '@/lib/supabase'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

async function buildAnalysisMessage(type: string) {
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

    const { data: quickAdds } = await supabase
      .from('quick_adds')
      .select('*')
      .eq('date', date)
      .returns<QuickAddEntry[]>()
    const analysis = analyzeFoodDay(log, quickAdds || [])

    return { ...buildDailyFoodSummary(analysis), url: '/monitor', analyzedDays: 1 }
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

    const days = (logs || []).map(toMonitorDay)
    if (days.length === 0) {
      return {
        title: 'Weekly nutrition report',
        body: 'No logs found for the last week yet. Track a few days and this report will become useful.',
        url: '/monitor',
        analyzedDays: 0,
      }
    }

    return { ...buildWeeklySummary(days), url: '/monitor', analyzedDays: days.length }
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

  const { data: subs } = await supabase.from('push_subscriptions').select('*')
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
