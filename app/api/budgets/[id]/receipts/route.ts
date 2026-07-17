import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'
import { hasFeature } from '@/lib/features'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const receipts = await prisma.receipt.findMany({
    where: { budgetId: id, tenantId },
    orderBy: { receiptNumber: 'desc' },
  })

  return NextResponse.json(receipts)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json()

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { features: true, receiptSequence: true },
    })

    if (!hasFeature({ features: tenant?.features }, 'vouchers')) {
      return NextResponse.json({ error: 'Módulo de documentos no habilitado' }, { status: 403 })
    }

    const budget = await prisma.budget.findFirst({ where: tenantWhereId(id, tenantId) })
    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    if (!data.amount || Number(data.amount) <= 0) {
      return NextResponse.json({ error: 'El importe debe ser mayor a 0' }, { status: 400 })
    }
    if (!data.paymentMethod) {
      return NextResponse.json({ error: 'Falta el medio de pago' }, { status: 400 })
    }

    const receiptNumber = tenant!.receiptSequence

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { receiptSequence: { increment: 1 } },
    })

    const receipt = await prisma.receipt.create({
      data: {
        tenantId,
        budgetId: id,
        receiptNumber,
        issuePlace: data.issuePlace || null,
        concept: data.concept || `Presupuesto N° ${String(budget.budgetNumber ?? 0).padStart(6, '0')}`,
        amount: Number(data.amount),
        currency: budget.currency,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference || null,
        pendingBalance:
          data.pendingBalance !== undefined && data.pendingBalance !== ''
            ? Number(data.pendingBalance)
            : null,
        notes: data.notes || null,
        branch: data.branch || null,
        cashRegister: data.cashRegister || null,
        registeredByUserId: data.registeredByUserId || null,
      },
    })

    return NextResponse.json(receipt, { status: 201 })
  } catch (error) {
    console.error('Error creating receipt:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}