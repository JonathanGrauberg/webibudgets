import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'
import { PLAN_LIMITS } from '@/lib/plan'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json()

    // 🚨 CONTROL DE LÍMITES AL REACTIVAR UN INACTIVO
    if (data.active === true) {
      // Validamos si actualmente está INACTIVO antes de dejarlo pasar
      const currentInstaller = await prisma.installer.findFirst({
        where: tenantWhereId(id, tenantId),
        select: { active: true }
      })

      if (currentInstaller && !currentInstaller.active) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { plan: true }
        })
        const currentPlan = tenant?.plan || 'starter'
        const limits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS]
        const maxAllowed = typeof (limits as any).maxInstallers === 'number' 
          ? (limits as any).maxInstallers 
          : ((limits as any).maxUsers ?? 0); // Si no existe, por defecto es 0

        if (currentPlan !== 'business') {
          const activeCount = await prisma.installer.count({
            where: { tenantId, active: true }
          })

          if (activeCount >= maxAllowed) {
            return NextResponse.json({ error: 'plan_limit_reached' }, { status: 403 })
          }
        }
      }
    }

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