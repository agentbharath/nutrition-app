import { NextRequest, NextResponse } from 'next/server'
import { generateOauthState, generateOauthVerifier, getGoogleHealthAuthorizeUrl, healthIntegrationConfigured } from '@/lib/health'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!healthIntegrationConfigured()) {
    return NextResponse.redirect(new URL('/settings?health=missing-env', req.url))
  }

  const state = generateOauthState()
  const verifier = generateOauthVerifier()
  const authorizeUrl = getGoogleHealthAuthorizeUrl(req.nextUrl.origin, state, verifier)
  const response = NextResponse.redirect(authorizeUrl)

  response.cookies.set('health_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60,
    path: '/',
  })
  response.cookies.set('health_oauth_verifier', verifier, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60,
    path: '/',
  })

  return response
}
