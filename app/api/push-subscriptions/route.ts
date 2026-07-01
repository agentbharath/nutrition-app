import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/health'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const endpoint = body.endpoint
    if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

    const supabase = createServiceSupabase()
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { endpoint, auth: body.keys?.auth || body.auth, p256dh: body.keys?.p256dh || body.p256dh },
        { onConflict: 'endpoint' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save push subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const endpoint = req.nextUrl.searchParams.get('endpoint') || body.endpoint
    if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

    const supabase = createServiceSupabase()
    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove push subscription' },
      { status: 500 }
    )
  }
}
