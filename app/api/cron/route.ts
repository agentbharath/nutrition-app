import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron/1.0') ||
    Boolean(req.headers.get('x-vercel-cron-schedule'))
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = req.nextUrl
  const type = url.searchParams.get('type') || 'lunch'

  if (type === 'health-sync') {
    const res = await fetch(`${url.origin}/api/health/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ days: 8 }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const res = await fetch(`${url.origin}/api/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
    body: JSON.stringify({ type }),
  })

  const data = await res.json()
  return NextResponse.json(data)
}
