import { type NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

const PUBLIC_PAGES = new Set(['/', '/login', '/sign-up', '/reset-password'])

const PUBLIC_API = ['/api/auth/login', '/api/auth/register', '/api/health']

function isPublicApi(pathname: string) {
  return PUBLIC_API.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null

  if (pathname.startsWith('/api')) {
    if (isPublicApi(pathname)) return NextResponse.next()
    if (!session) {
      return NextResponse.json(
        { ok: false, message: 'Authentication required.' },
        { status: 401 }
      )
    }
    if (pathname.startsWith('/api/admin') && session.role !== 'admin') {
      return NextResponse.json(
        { ok: false, message: 'Forbidden.' },
        { status: 403 }
      )
    }
    return NextResponse.next()
  }

  const isPublicPage = PUBLIC_PAGES.has(pathname)

  if (!session && !isPublicPage) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (session && (pathname === '/login' || pathname === '/sign-up')) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf)$).*)'
  ]
}
