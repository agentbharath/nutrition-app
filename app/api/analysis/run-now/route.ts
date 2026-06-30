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

// Called directly from Settings button — no auth needed since it's
// server-side only and CRON_SECRET is never exposed to the client.
export async function POST() {
  try {
    const analysisMessage = await buildAnalysisMessage('daily-analysis')
    if (!analysisMessage) {
      return NextResponse.json({ error: 'No data to analyze yet — log today\'s meals first.' }, { status: 400 })
    }

    const { data: subs } = await supabase.from('push_subscriptions').select('*')
    if (subs && subs.length > 0) {
      await Promise.allSettled(
        subs.map((sub) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
            JSON.stringify({ title: analysisMessage.title, body: analysisMessage.body, url: analysisMessage.url })
          )
        )
      )
    }

    return NextResponse.json({ success: true, title: analysisMessage.title })
  } catch (error) {
    console.error('[run-now error]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
