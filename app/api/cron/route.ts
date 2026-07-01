import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/health'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronScheduleHeader = req.headers.get('x-vercel-cron-schedule')
  const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron/1.0') || Boolean(cronScheduleHeader)
  const url = req.nextUrl
  const type = url.searchParams.get('type') || 'lunch'

  if (auth !== `Bearer ${process.env.CRON_SECRET}` && !isVercelCron) {
    await createServiceSupabase().from('cron_execution_log').insert({
      cron_type: type, triggered_by: 'unauthorized', success: false, error_message: 'Auth failed',
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Log every invocation BEFORE doing the work, so we always see it even if downstream fails
  const { error: logError } = await createServiceSupabase().from('cron_execution_log').insert({
    cron_type: type,
    triggered_by: isVercelCron ? 'vercel-cron' : 'manual',
    vercel_cron_schedule: cronScheduleHeader,
    success: true,
  })
  if (logError) console.error('Failed to log cron execution:', logError)

  try {
    if (type === 'health-sync') {
      const res = await fetch(`${url.origin}/api/health/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.CRON_SECRET}` },
        body: JSON.stringify({ days: 8 }),
      })
      const data = await res.json()
      if (!res.ok) {
        await createServiceSupabase().from('cron_execution_log').insert({
          cron_type: type, triggered_by: isVercelCron ? 'vercel-cron' : 'manual',
          success: false, error_message: JSON.stringify(data).slice(0, 500),
        })
      }
      return NextResponse.json(data, { status: res.status })
    }

    const res = await fetch(`${url.origin}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({ type }),
    })
    const data = await res.json()
    if (!res.ok) {
      await createServiceSupabase().from('cron_execution_log').insert({
        cron_type: type, triggered_by: isVercelCron ? 'vercel-cron' : 'manual',
        success: false, error_message: JSON.stringify(data).slice(0, 500),
      })
    }
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    await createServiceSupabase().from('cron_execution_log').insert({
      cron_type: type, triggered_by: isVercelCron ? 'vercel-cron' : 'manual',
      success: false, error_message: String(err?.message || err).slice(0, 500),
    })
    return NextResponse.json({ error: 'Internal error', detail: String(err?.message || err) }, { status: 500 })
  }
}
