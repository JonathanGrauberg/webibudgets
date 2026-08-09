import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhere, tenantCreateData } from '@/lib/tenant'
import { hasFeature } from '@/lib/features'

export async function GET(request: Request) {
  const tenantId = await getTenantIdFromRequest(request)
  const boards = await prisma.kioskBoard.findMany({
    where: tenantWhere(tenantId),
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(boards)
}

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, features: true },
    })
    if (!tenant || !hasFeature(tenant, 'kiosk')) {
      return NextResponse.json({ error: 'El modo Kiosco requiere el plan PRO.' }, { status: 403 })
    }

    const data = await request.json()
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    const last = await prisma.kioskBoard.findFirst({
      where: { tenantId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const board = await prisma.kioskBoard.create({
      data: tenantCreateData({ name: data.name.trim(), order: (last?.order ?? -1) + 1 }, tenantId),
    })

    return NextResponse.json(board, { status: 201 })
  } catch (error) {
    console.error('Error creating kiosk board:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}