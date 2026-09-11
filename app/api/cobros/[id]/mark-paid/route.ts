//app\api\cobros\[id]\mark-paid\route.ts
//
// Marcar un Cobro como pagado a mano (efectivo, transferencia, etc.) —
// para cuando el cliente no paga por el link de Mercado Pago.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

const VALID_METHODS = ['efectivo', 'transferencia', 'cheque', 'tarjeta', 'mercado_pago', 'otro']

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json().catch(() => ({}))

    const paymentMethod = VALID_METHODS.includes(data.paymentMethod) ? data.paymentMethod : 'efectivo'

    const existing = await prisma.cobro.findFirst({ where: { id, tenantId } })
    if (!existing) {
      return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
    }
    if (existing.status === 'paid') {
      return NextResponse.json({ error: 'Este cobro ya está marcado como pagado' }, { status: 400 })
    }

    const cobro = await prisma.cobro.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date(), paymentMethod },
      include: { client: { select: { id: true, name: true, company: true } } },
    })

    return NextResponse.json(cobro)
  } catch (error) {
    console.error('Error marking cobro as paid:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
