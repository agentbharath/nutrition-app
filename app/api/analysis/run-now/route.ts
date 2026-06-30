import { NextRequest, NextResponse } from 'next/server'

// Hobby plan timeout fix applies here too
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const url = req.nextUrl

  // Internally calls /api/notify with the real CRON_SECRET (server-side only,
  // never exposed to the client) — so this route is safe to expose without auth.
  const res = await fetch(`${url.origin}/api/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
    body: JSON.stringify({ type: 'daily-analysis' }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
