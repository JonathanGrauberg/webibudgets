// app/api/expenses/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhere, tenantCreateData } from '@/lib/tenant'

export async function GET(request: Request) {
  const tenantId = await getTenantIdFromRequest(request)
  const { searchParams } = new URL(request.url)

  const categoryId = searchParams.get('categoryId')
  const budgetId = searchParams.get('budgetId')
  const scope = searchParams.get('scope') // 'general' | 'byBudget' | null (todos)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const expenses = await prisma.expense.findMany({
    where: {
      ...tenantWhere(tenantId),
      ...(categoryId ? { categoryId } : {}),
      ...(budgetId ? { budgetId } : {}),
      ...(scope === 'general' ? { budgetId: null } : {}),
      ...(scope === 'byBudget' ? { budgetId: { not: null } } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      category: { select: { id: true, name: true } },
      budget: { select: { id: true, budgetNumber: true, client: { select: { name: true, company: true } } } },
      registeredByUser: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(expenses)
}

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()

    if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
      return NextResponse.json({ error: 'La descripción es obligatoria' }, { status: 400 })
    }

    const amount = Number(data.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 })
    }

    // Si viene budgetId, confirmamos que el presupuesto sea de este mismo tenant
    // (evita que alguien asocie un gasto a un presupuesto ajeno vía API directa)
    if (data.budgetId) {
      const budgetExists = await prisma.budget.findFirst({
        where: { id: data.budgetId, tenantId },
        select: { id: true },
      })
      if (!budgetExists) {
        return NextResponse.json({ error: 'Presupuesto inválido para este tenant' }, { status: 400 })
      }
    }

    // Mismo chequeo para la categoría, si vino
    if (data.categoryId) {
      const categoryExists = await prisma.tenantExpenseCategory.findFirst({
        where: { id: data.categoryId, tenantId },
        select: { id: true },
      })
      if (!categoryExists) {
        return NextResponse.json({ error: 'Categoría inválida para este tenant' }, { status: 400 })
      }
    }

    const expense = await prisma.expense.create({
      data: tenantCreateData(
        {
          description: data.description.trim(),
          amount,
          currency: data.currency || 'ARS',
          date: data.date ? new Date(data.date) : new Date(),
          paymentMethod: data.paymentMethod || null,
          notes: data.notes || null,
          categoryId: data.categoryId || null,
          budgetId: data.budgetId || null,
          registeredByUserId: data.registeredByUserId || null,
        },
        tenantId
      ),
      include: {
        category: { select: { id: true, name: true } },
        budget: { select: { id: true, budgetNumber: true } },
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}