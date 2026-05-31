import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

const MANAGER_ROLES = ['owner', 'admin']

export async function GET(request: Request) {
  const tenantId = await getTenantIdFromRequest(request)

  const branding = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      faviconUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
    },
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

  const allowed = [
    'name',
    'logoUrl',
    'faviconUrl',
    'primaryColor',
    'secondaryColor',
    'accentColor',
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
    return NextResponse.json({ success: true, tenant: updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating tenant'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
