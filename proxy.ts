import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'nutrition_app_auth'

const PUBLIC_PREFIXES = [
  '/_next',
  '/api/auth/login',
  '/api/auth/logout',
  '/favicon',
  '/icons',
  '/login',
  '/manifest',
  '/sw.js',
]

function isPublicPath(pathname: string) {
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true
  return /\.(avif|ico|jpg|jpeg|png|svg|webp|css|js|json|txt|xml)$/.test(pathname)
}

function hasCronAuthorization(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  return Boolean(cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`)
}

export function proxy(req: NextRequest) {
  const appPassword = process.env.APP_PASSWORD
  if (!appPassword) return NextResponse.next()

  const { pathname } = req.nextUrl
  if (isPublicPath(pathname)) return NextResponse.next()
  if (pathname.startsWith('/api/cron')) return NextResponse.next()
  if ((pathname.startsWith('/api/notify') || pathname.startsWith('/api/health/sync')) && hasCronAuthorization(req)) {
    return NextResponse.next()
  }

  if (req.cookies.get(COOKIE_NAME)?.value === appPassword) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
