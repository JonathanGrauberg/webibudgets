//app\api\budgets\[id]\payment-link\route.ts
//
// Genera (o devuelve, si ya existía) el link público del presupuesto
// (/p/[publicToken]) donde el cliente final puede ver el presupuesto y
// pagar la seña con Mercado Pago. No crea la preferencia de cobro acá —
// eso pasa recién cuando el cliente final clickea "Pagar" en el portal
// (ver app/api/public/budgets/[token]/pay), para no generar preferencias
// que nadie va a usar.
import { randomBytes } from 'crypto'
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(req)
  const { id } = await params

  const budget = await prisma.budget.findFirst({
    where: tenantWhereId(id, tenantId),
    select: { id: true, publicToken: true },
  })

  if (!budget) {
    return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
  }

  let token = budget.publicToken
  if (!token) {
    token = randomBytes(12).toString('base64url')
    await prisma.budget.update({ where: { id: budget.id }, data: { publicToken: token } })
  }

  return NextResponse.json({ url: `${req.nextUrl.origin}/p/${token}` })
}
