//app\api\cobros\[id]\duplicate\route.ts
//
// "Reutilizar el mes que viene" — clona cliente/concepto/monto en un Cobro
// nuevo para el próximo período, en vez de recrearlo de cero cada mes.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { nextPeriodMonth } from '@/lib/cobro-period'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params

    const source = await prisma.cobro.findFirst({ where: { id, tenantId } })
    if (!source) {
      return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { cobroSequence: true } })
    const cobroNumber = tenant!.cobroSequence
    await prisma.tenant.update({ where: { id: tenantId }, data: { cobroSequence: { increment: 1 } } })

    const cobro = await prisma.cobro.create({
      data: {
        tenantId,
        clientId: source.clientId,
        cobroNumber,
        concept: source.concept,
        amount: source.amount,
        currency: source.currency,
        periodMonth: nextPeriodMonth(source.periodMonth),
        duplicatedFromId: source.id,
      },
      include: { client: { select: { id: true, name: true, company: true } } },
    })

    return NextResponse.json(cobro, { status: 201 })
  } catch (error) {
    console.error('Error duplicating cobro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
