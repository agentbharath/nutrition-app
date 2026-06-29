import { NextRequest, NextResponse } from 'next/server'
import { exchangeGoogleHealthCode, saveGoogleHealthConnection, syncGoogleHealthDate } from '@/lib/health'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const expectedState = req.cookies.get('health_oauth_state')?.value
  const verifier = req.cookies.get('health_oauth_verifier')?.value
  const redirect = new URL('/settings', req.url)

  if (!code || !state || !expectedState || !verifier || state !== expectedState) {
    redirect.searchParams.set('health', 'oauth-error')
    return clearOauthCookies(NextResponse.redirect(redirect))
  }

  try {
    const token = await exchangeGoogleHealthCode(code, verifier, req.nextUrl.origin)
    await saveGoogleHealthConnection(token)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    await syncGoogleHealthDate(today)
    redirect.searchParams.set('health', 'connected')
  } catch (error) {
    console.error(error)
    redirect.searchParams.set('health', 'connect-failed')
  }

  return clearOauthCookies(NextResponse.redirect(redirect))
}

function clearOauthCookies(response: NextResponse) {
  response.cookies.delete('health_oauth_state')
  response.cookies.delete('health_oauth_verifier')
  return response
}
