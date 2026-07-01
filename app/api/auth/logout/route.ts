import { NextResponse } from 'next/server'

const COOKIE_NAME = 'nutrition_app_auth'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })
  return response
}
