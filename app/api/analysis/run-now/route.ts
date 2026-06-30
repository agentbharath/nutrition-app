import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { buildAnalysisMessage } from '@/app/api/notify/route'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

async function sendPush(msg: { title: string; body: string; url: string }) {
  const { data: subs } = await supabase.from('push_subscriptions').select('*')
  if (!subs || subs.length === 0) return
  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
        JSON.stringify(msg)
      )
    )
  )
}

export async function POST() {
  try {
    // Detect if today is Sunday in Pacific time — if so, run weekly too
    const now = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
    const isSunday = new Date(now).getDay() === 0

    // Always run daily analysis (covers yesterday)
    const dailyMsg = await buildAnalysisMessage('daily-analysis')
    if (!dailyMsg) {
      return NextResponse.json({ error: "No data to analyze yet — log yesterday's meals first." }, { status: 400 })
    }
    await sendPush({ title: dailyMsg.title, body: dailyMsg.body, url: dailyMsg.url })

    // On Sundays, also run weekly analysis
    let weeklyDone = false
    if (isSunday) {
      const weeklyMsg = await buildAnalysisMessage('weekly-analysis')
      if (weeklyMsg) {
        await sendPush({ title: weeklyMsg.title, body: weeklyMsg.body, url: weeklyMsg.url })
        weeklyDone = true
      }
    }

    return NextResponse.json({
      success: true,
      title: dailyMsg.title,
      weekly: weeklyDone,
    })
  } catch (error) {
    console.error('[run-now error]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
