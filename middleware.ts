// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { isOwnerRole } from '@/lib/admin'
import { isTrialExpired } from './lib/plan'

const PUBLIC_PREFIXES = [
  '/auth',
  '/register',
  '/pricing',
  '/api/auth',
  '/api/webhooks',
  '/api/cron', // cron interno
]

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
  '/documents',
]

function isPublic(pathname: string): boolean {
  if (pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname.includes('.'))
    return true
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isProtected(pathname: string): boolean {
  if (isPublic(pathname)) return false
  if (pathname.startsWith('/api')) return true
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isAdminRoute(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const headers = new Headers(req.headers)
  if (token?.tenantId) {
    headers.set('x-tenant-id', String(token.tenantId))
  }

  // Sin token → redirigir a login
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

    if (token && isProtected(pathname)) {
    const role = token.role as string | undefined
    const tenantActive = token.tenantActive as boolean | undefined
    const plan = token.plan as string | null | undefined // 👈 nuevo
    const trialEndsAt = token.trialEndsAt as string | null | undefined
    const isSystemOwner = isOwnerRole(role) && isAdminRoute(pathname)

    // 👇 reemplaza el cálculo manual — usa la misma fuente de verdad que el resto del sistema
    const trialExpiredNow = isTrialExpired(plan ?? null, trialEndsAt)

    const blocked = !isSystemOwner && (tenantActive === false || trialExpiredNow)

    if (blocked) {
      if (pathname.startsWith('/api')) {
        return new Response(
          JSON.stringify({
            error: trialExpiredNow ? 'trial_expired' : 'tenant_inactive',
          }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        )
      }
      const url = req.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set(
        'error',
        trialExpiredNow ? 'trial_expired' : 'tenant_inactive'
      )
      return NextResponse.redirect(url)
    }

    // Solo owners pueden acceder a /admin
    if (isAdminRoute(pathname) && !isOwnerRole(role)) {
      const url = req.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: [
    '/api/:path*',
    '/settings/:path*',
    '/dashboard/:path*',
    '/budgets/:path*',
    '/clients/:path*',
    '/products/:path*',
    '/sellers/:path*',
    '/stock/:path*',
    '/installers/:path*',
    '/documents/:path*', // 👈 nuevo
    '/admin/:path*',
    '/register/:path*',
    '/pricing/:path*',
  ],
}