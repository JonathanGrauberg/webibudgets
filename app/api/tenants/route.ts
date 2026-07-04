//app\api\tenants\route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { isValidCurrency } from '@/lib/currencies' // 👈 nuevo

const MANAGER_ROLES = ['owner', 'admin']

export async function GET(request: Request) {
  const tenantId = await getTenantIdFromRequest(request)

  const branding = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,

      email: true,
      phone: true,
      address: true,
      website: true,
      description: true,
      currency: true, // 👈 nuevo

      logoUrl: true,
      faviconUrl: true,
      watermarkUrl: true,
      sidebarIconUrl: true,

      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      watermarkOpacity: true,
      showPageNumbers: true,
      showWebsiteInPdf: true,
      showFooterBranding: true,
    }
  })

  if (!branding) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  return NextResponse.json(branding)
}

export async function PUT(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = token.role as string | undefined
  if (!role || !MANAGER_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tenantId = await getTenantIdFromRequest(request)

  let data: Record<string, unknown> = {}
  try {
    data = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Diagnostic: log incoming payload to trace where branding fields may be lost
  // eslint-disable-next-line no-console
  console.debug('PUT /api/tenants received', { tenantId, data })

  const allowed = [
    'name',

    'email',
    'phone',
    'address',
    'website',
    'description',
    'currency', // 👈 nuevo

    'logoUrl',
    'faviconUrl',
    'watermarkUrl',
    'sidebarIconUrl',

    'primaryColor',
    'secondaryColor',
    'accentColor',
    'watermarkOpacity',
    'showPageNumbers',
    'showWebsiteInPdf',
    'showFooterBranding',
    // 'preferredTheme' intentionally excluded for MVP: fixed corporate theme

    'plan',
    'maxUsers',
  ]
  const updateData: Record<string, unknown> = {}
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, k)) {
      const v = data[k]
      if (k === 'maxUsers') {
        const n = Number(v)
        updateData[k] = Number.isFinite(n) ? n : null
      } else if (k === 'currency') {
        // 🌟 Validamos contra la lista soportada; si viene mal, no la tocamos
        if (isValidCurrency(v)) {
          updateData[k] = v
        }
      } else {
        updateData[k] = typeof v === 'string' && v.trim() === '' ? null : v
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }

  try {
    const updated = await prisma.tenant.update({ where: { id: tenantId }, data: updateData })
    console.log('[PUNTO 3 - Prisma devuelve]', {
      watermarkUrl: updated.watermarkUrl?.slice(0, 50) ?? null,
      sidebarIconUrl: updated.sidebarIconUrl?.slice(0, 50) ?? null,
    })
    // eslint-disable-next-line no-console
    console.debug('PUT /api/tenants prisma.update called', { tenantId, updateData, updated })
    return NextResponse.json({ success: true, tenant: updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating tenant'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}