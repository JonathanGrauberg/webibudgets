import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantCreateData, tenantWhere } from '@/lib/tenant'
import { PLAN_LIMITS } from '@/lib/plan' // 🚨 Importamos tus límites

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = await getTenantIdFromRequest(request)

    const includeInactive = searchParams.get('includeInactive') === 'true'

    const installers = await prisma.installer.findMany({
      where: includeInactive ? tenantWhere(tenantId) : { ...tenantWhere(tenantId), active: true },
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(installers)
  } catch (error) {
    console.error('Get installers error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()

    if (!data?.name || !data?.lastName || !data?.phone) {
      return NextResponse.json(
        { error: 'name, lastName y phone son obligatorios' },
        { status: 400 }
      )
    }

    // 🚨 CONTROL DE LÍMITES EN EL POST (app/api/installers/route.ts)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true }
    })
    const currentPlan = tenant?.plan || 'starter'

    if (currentPlan !== 'business') {
      // Definimos a mano los cupos reales por plan si hay discrepancias con el archivo
      const maxAllowed = currentPlan === 'pro' ? 5 : 0 // Starter es 0

      const activeCount = await prisma.installer.count({
        where: { tenantId, active: true }
      })

      if (activeCount >= maxAllowed) {
        return NextResponse.json({ error: 'plan_limit_reached' }, { status: 403 })
      }
    }

    const installer = await prisma.installer.create({
      data: tenantCreateData(
        {
          name: String(data.name).trim(),
          lastName: String(data.lastName).trim(),
          phone: String(data.phone).trim(),
          email: data.email ? String(data.email).trim() : null,
          city: data.city ? String(data.city).trim() : null,
          active: typeof data.active === 'boolean' ? data.active : true,
        },
        tenantId
      ),
    })

    return NextResponse.json(installer, { status: 201 })
  } catch (error) {
    console.error('Create installer error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}