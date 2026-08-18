// app/api/expenses/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params
  const data = await request.json()

  const updateData: Record<string, unknown> = {}

  if (typeof data.description === 'string' && data.description.trim()) {
    updateData.description = data.description.trim()
  }
  if (data.amount !== undefined) {
    const amount = Number(data.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 })
    }
    updateData.amount = amount
  }
  if (data.date !== undefined) {
    updateData.date = new Date(data.date)
  }
  if (data.paymentMethod !== undefined) {
    updateData.paymentMethod = data.paymentMethod || null
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes || null
  }
  if (data.categoryId !== undefined) {
    updateData.categoryId = data.categoryId || null
  }
  if (data.budgetId !== undefined) {
    updateData.budgetId = data.budgetId || null
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
  }

  const result = await prisma.expense.updateMany({
    where: tenantWhereId(id, tenantId),
    data: updateData,
  })

  if (result.count === 0) {
    return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
  }

  const expense = await prisma.expense.findFirst({
    where: tenantWhereId(id, tenantId),
    include: {
      category: { select: { id: true, name: true } },
      budget: { select: { id: true, budgetNumber: true } },
    },
  })

  return NextResponse.json(expense)
}

export async function DELETE(request: Request, { params }: Params) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const result = await prisma.expense.deleteMany({
    where: tenantWhereId(id, tenantId),
  })

  if (result.count === 0) {
    return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}