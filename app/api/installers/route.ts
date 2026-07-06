import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantCreateData, tenantWhere } from '@/lib/tenant'
import { resolveMaxInstallersForTenant } from '@/lib/plan' // 👈 fuente de verdad en vivo

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

    // 🚨 CONTROL DE LÍMITE: leemos plan + trialEndsAt EN VIVO desde lib/plan.ts
    // (antes: hardcodeaba currentPlan === 'pro' ? 5 : 0 — 'pro' no existe como plan,
    // así que CUALQUIER plan que no fuera 'business' quedaba con maxAllowed = 0)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, trialEndsAt: true },
    })

    const maxInstallers = resolveMaxInstallersForTenant(tenant?.plan ?? 'starter', tenant?.trialEndsAt)

    const activeCount = await prisma.installer.count({
      where: { tenantId, active: true },
    })

    // null = ilimitado (plan business/vip, o trial activo)
    if (maxInstallers !== null && activeCount >= maxInstallers) {
      return NextResponse.json({ error: 'plan_limit_reached' }, { status: 403 })
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