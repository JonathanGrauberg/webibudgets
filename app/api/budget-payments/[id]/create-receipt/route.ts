//app\api\budget-payments\[id]\create-receipt\route.ts
//
// "¿Crear recibo de este pago?" — genera un Receipt de respaldo/impresión
// para un pago que ya entró por Mercado Pago. Es solo un comprobante: la
// plata que representa YA está contada (el BudgetPayment), por eso queda
// marcado con sourceBudgetPaymentId — lib/collected-amount.ts lo excluye
// de la suma para no duplicarla.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { hasFeature } from '@/lib/features'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { features: true, receiptSequence: true, plan: true },
    })

    if (!hasFeature(tenant, 'vouchers')) {
      return NextResponse.json({ error: 'Módulo de documentos no habilitado' }, { status: 403 })
    }

    const payment = await prisma.budgetPayment.findFirst({
      where: { id, tenantId },
      include: { budget: { select: { id: true, budgetNumber: true, currency: true } }, receipt: true },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }
    if (payment.status !== 'approved') {
      return NextResponse.json({ error: 'Este pago todavía no está confirmado' }, { status: 400 })
    }
    if (payment.receipt) {
      return NextResponse.json({ error: 'Ya existe un recibo para este pago' }, { status: 409 })
    }

    const receiptNumber = tenant!.receiptSequence
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { receiptSequence: { increment: 1 } },
    })

    const budgetNumber = String(payment.budget.budgetNumber ?? 0).padStart(6, '0')

    const receipt = await prisma.receipt.create({
      data: {
        tenantId,
        budgetId: payment.budget.id,
        sourceBudgetPaymentId: payment.id,
        isStandalone: false,
        receiptNumber,
        concept: `Pago con Mercado Pago — Presupuesto N° ${budgetNumber}`,
        amount: payment.amount,
        currency: payment.budget.currency,
        paymentMethod: 'mercado_pago',
        paymentReference: payment.mpPaymentId,
      },
    })

    return NextResponse.json(receipt, { status: 201 })
  } catch (error) {
    console.error('Error creating receipt from BudgetPayment:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
