import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json()

    const result = await prisma.installer.updateMany({
      where: tenantWhereId(id, tenantId),
      data: {
        name: data.name !== undefined ? String(data.name).trim() : undefined,
        lastName: data.lastName !== undefined ? String(data.lastName).trim() : undefined,
        phone: data.phone !== undefined ? String(data.phone).trim() : undefined,
        email: data.email !== undefined ? (data.email ? String(data.email).trim() : null) : undefined,
        city: data.city !== undefined ? (data.city ? String(data.city).trim() : null) : undefined,
        active: data.active !== undefined ? Boolean(data.active) : undefined,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Installer not found or tenant mismatch' }, { status: 404 })
    }

    const installer = await prisma.installer.findFirst({
      where: tenantWhereId(id, tenantId),
    })

    return NextResponse.json(installer)
  } catch (error) {
    console.error('Update installer error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// Soft delete: active=false
export async function DELETE(request: Request, { params }: Params) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params

    const result = await prisma.installer.updateMany({
      where: tenantWhereId(id, tenantId),
      data: { active: false },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Installer not found or tenant mismatch' }, { status: 404 })
    }

    const installer = await prisma.installer.findFirst({
      where: tenantWhereId(id, tenantId),
    })

    return NextResponse.json(installer)
  } catch (error) {
    console.error('Disable installer error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}