//app\api\mercadopago\connect\disconnect\route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

const MANAGER_ROLES = ['owner', 'admin']

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const tenantId = token?.tenantId as string | undefined
  const role = token?.role as string | undefined

  if (!tenantId || !role || !MANAGER_ROLES.includes(role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      mpConnected: false,
      mpUserId: null,
      mpAccessToken: null,
      mpRefreshToken: null,
      mpTokenExpiresAt: null,
      mpPublicKey: null,
    },
  })

  return NextResponse.json({ success: true })
}
