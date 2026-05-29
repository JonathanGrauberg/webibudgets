import { NextResponse } from 'next/server'
import { getTenantIdFromRequest, tenantWhere } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const tenantId = await getTenantIdFromRequest(request)

  const branding = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
    },
  })

  if (!branding) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  return NextResponse.json(branding)
}

export async function PUT(request: Request) {
  const tenantId = await getTenantIdFromRequest(request)

  let data: any = {}
  try {
    data = await request.json()
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const allowed = ['name', 'logoUrl', 'primaryColor', 'secondaryColor', 'accentColor', 'plan', 'maxUsers']
  const updateData: Record<string, any> = {}
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
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error updating tenant' }, { status: 500 })
  }
}
