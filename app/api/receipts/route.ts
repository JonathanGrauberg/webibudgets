// app/api/receipts/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { hasFeature } from '@/lib/features'

// GET: Obtener todos los recibos del tenant (incluye standalone y con presupuesto)
export async function GET(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)

    const receipts = await prisma.receipt.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        budget: {
          select: { id: true, budgetNumber: true },
        },
        client: { // 👈 nuevo — para que documents/page.tsx pueda mostrar algo en standalone
          select: { id: true, name: true, company: true },
        },
      },
    })

    return NextResponse.json(receipts)
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST: Crear un recibo SIN presupuesto asociado (standalone)
export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, features: true, receiptSequenceStandalone: true },
    })

    if (!tenant || !hasFeature(tenant, 'vouchers')) {
      return NextResponse.json({ error: 'Módulo de documentos no habilitado' }, { status: 403 })
    }

    if (!data.clientId) {
      return NextResponse.json({ error: 'Falta seleccionar un cliente' }, { status: 400 })
    }
    if (!data.amount || Number(data.amount) <= 0) {
      return NextResponse.json({ error: 'El importe debe ser mayor a 0' }, { status: 400 })
    }
    if (!data.paymentMethod) {
      return NextResponse.json({ error: 'Falta el medio de pago' }, { status: 400 })
    }

    const client = await prisma.client.findFirst({ where: { id: data.clientId, tenantId } })
    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado o no pertenece al tenant' }, { status: 404 })
    }

    const receiptNumber = tenant.receiptSequenceStandalone

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { receiptSequenceStandalone: { increment: 1 } },
    })

    const receipt = await prisma.receipt.create({
      data: {
        tenantId,
        budgetId: null,
        clientId: data.clientId,
        isStandalone: true,
        receiptNumber,
        issuePlace: data.issuePlace || null,
        concept: data.concept || 'Recibo sin presupuesto asociado',
        amount: Number(data.amount),
        currency: data.currency || 'ARS',
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference || null,
        pendingBalance: data.pendingBalance !== undefined && data.pendingBalance !== '' ? Number(data.pendingBalance) : null,
        notes: data.notes || null,
        branch: data.branch || null,
        cashRegister: data.cashRegister || null,
        registeredByUserId: data.registeredByUserId || null,
      },
    })

    return NextResponse.json(receipt, { status: 201 })
  } catch (error) {
    console.error('Error creating standalone receipt:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}