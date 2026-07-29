//app\api\tenants\roster-limits\route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { resolveMaxSellersForTenant, resolveMaxInstallersForTenant } from '@/lib/plan'

const TENANT_HEADER = 'x-tenant-id'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const h = await headers()
  const tenantId = h.get(TENANT_HEADER)
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not identified' }, { status: 400 })
  }

  const type = req.nextUrl.searchParams.get('type')
  if (type !== 'seller' && type !== 'installer') {
    return NextResponse.json({ error: 'type debe ser "seller" o "installer"' }, { status: 400 })
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, trialEndsAt: true },
    })

    const maxCount = type === 'seller'
      ? resolveMaxSellersForTenant(tenant?.plan ?? 'starter', tenant?.trialEndsAt)
      : resolveMaxInstallersForTenant(tenant?.plan ?? 'starter', tenant?.trialEndsAt)

    const activeCount = type === 'seller'
      ? await prisma.seller.count({ where: { tenantId, active: true } })
      : await prisma.installer.count({ where: { tenantId, active: true } })

    return NextResponse.json({
      plan: tenant?.plan ?? 'starter',
      maxCount,     // null = ilimitado
      activeCount,
    })
  } catch (error) {
    console.error('Error fetching roster limits:', error)
    return NextResponse.json({ error: 'Failed to fetch limits' }, { status: 500 })
  }
}