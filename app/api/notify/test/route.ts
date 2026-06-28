import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const { endpoint } = await req.json()
  if (!endpoint || typeof endpoint !== 'string') {
    return NextResponse.json({ error: 'Missing subscription endpoint' }, { status: 400 })
  }

  const { data: sub, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, auth, p256dh')
    .eq('endpoint', endpoint)
    .single()

  if (error || !sub) {
    return NextResponse.json({ error: 'Subscription not found. Re-enable notifications.' }, { status: 404 })
  }

  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
    JSON.stringify({
      title: '🔔 Test notification',
      body: 'Push notifications are working for this device.',
      url: '/settings',
    })
  )

  return NextResponse.json({ sent: 1 })
}
