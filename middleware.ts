import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { isOwnerRole } from '@/lib/admin'

const PROTECTED_PREFIXES = [
  '/admin',
  '/dashboard',
  '/settings',
  '/budgets',
  '/clients',
  '/products',
  '/sellers',
  '/stock',
  '/installers',
]

function isProtected(pathname: string) {
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/auth')) return false
  if (pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname.includes('.')) return false
  if (pathname.startsWith('/api')) return true
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isAdminRoute(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const headers = new Headers(req.headers)

  if (token?.tenantId) {
    headers.set('x-tenant-id', String(token.tenantId))
  }

  if (isProtected(pathname) && !token) {
    if (pathname.startsWith('/api')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }

    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (isAdminRoute(pathname) && token && !isOwnerRole(token.role as string | undefined)) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/api/:path*', '/settings/:path*', '/dashboard/:path*', '/budgets/:path*', '/clients/:path*', '/products/:path*', '/sellers/:path*', '/stock/:path*', '/installers/:path*'],
}
