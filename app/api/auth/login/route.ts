import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'nutrition_app_auth'

export async function POST(req: NextRequest) {
  const appPassword = process.env.APP_PASSWORD
  if (!appPassword) return NextResponse.json({ ok: true, gated: false })

  const { password } = await req.json().catch(() => ({ password: '' }))
  if (password !== appPassword) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true, gated: true })
  response.cookies.set(COOKIE_NAME, appPassword, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return response
}
