//app\api\sellers\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantCreateData, tenantWhere } from '@/lib/tenant'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = await getTenantIdFromRequest(request)

    // Por defecto: solo activos
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const sellers = await prisma.seller.findMany({
      where: includeInactive ? tenantWhere(tenantId) : { ...tenantWhere(tenantId), active: true },
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(sellers)
  } catch (error) {
    console.error('Get sellers error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()

    // 1. Validación mínima de campos
    if (!data?.name || !data?.lastName) {
      return NextResponse.json(
        { error: 'name y lastName son obligatorios' },
        { status: 400 }
      )
    }

    // 2. 🚨 CONTROL DE LÍMITE: Buscar el plan/maxUsers del Tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxUsers: true },
    })
    
    const maxUsers = tenant?.maxUsers ?? 5 // Fallback seguro de 5 por las dudas

    // 3. Contar los usuarios activos reales en la tabla User
    const activeUsersCount = await prisma.user.count({
      where: { tenantId, active: true },
    })

    // 4. Si ya alcanzó o superó el límite, rebotamos con el código que entiende tu front
    if (activeUsersCount >= maxUsers) {
      return NextResponse.json(
        { error: 'plan_limit_reached', message: 'Alcanzaste el límite de usuarios permitidos en tu plan.' }, 
        { status: 403 }
      )
    }

    // 5. Si tiene cupo, procedemos a crear el vendedor normalmente
    const seller = await prisma.seller.create({
      data: tenantCreateData(
        {
          name: String(data.name).trim(),
          lastName: String(data.lastName).trim(),
          dni: data.dni ? String(data.dni).trim() : null,
          email: data.email ? String(data.email).trim() : null,
          phone: data.phone ? String(data.phone).trim() : null,
          address: data.address ? String(data.address).trim() : null,
          city: data.city ? String(data.city).trim() : null,
          province: data.province ? String(data.province).trim() : null,
          sector: data.sector ? String(data.sector).trim() : null,
          active: typeof data.active === 'boolean' ? data.active : true,
        },
        tenantId
      ),
    })

    return NextResponse.json(seller, { status: 201 })
  } catch (error) {
    console.error('Create seller error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
