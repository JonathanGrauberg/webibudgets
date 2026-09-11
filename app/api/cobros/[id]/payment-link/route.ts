//app\api\cobros\[id]\payment-link\route.ts
import { randomBytes } from 'crypto'
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(req)
  const { id } = await params

  const cobro = await prisma.cobro.findFirst({
    where: { id, tenantId },
    select: { id: true, publicToken: true },
  })

  if (!cobro) {
    return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
  }

  let token = cobro.publicToken
  if (!token) {
    token = randomBytes(12).toString('base64url')
    await prisma.cobro.update({ where: { id: cobro.id }, data: { publicToken: token } })
  }

  return NextResponse.json({ url: `${req.nextUrl.origin}/c/${token}` })
}
