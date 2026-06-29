import { NextRequest, NextResponse } from 'next/server'
import { healthIntegrationConfigured, syncRecentHealthDays } from '@/lib/health'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!healthIntegrationConfigured()) {
    return NextResponse.json({ error: 'Health integration is not configured.' }, { status: 400 })
  }

  const auth = req.headers.get('authorization')
  const isCron = auth === `Bearer ${process.env.CRON_SECRET}`

  try {
    const body = await req.json().catch(() => ({})) as { days?: number }
    const days = Math.min(Math.max(Number(body.days || (isCron ? 8 : 3)), 1), 14)
    const synced = await syncRecentHealthDays(days)
    const failed = synced.filter((item) => item && typeof item === 'object' && 'error' in item)
    return NextResponse.json({
      synced: synced.length - failed.length,
      failed: failed.length,
      days,
      errors: failed,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Health sync failed.' }, { status: 500 })
  }
}
