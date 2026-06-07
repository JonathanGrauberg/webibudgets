import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'
import {
  isValidBudgetStatus,
  parseBudgetStatus,
} from '@/lib/budget-validators'
import { BudgetStatus } from '@prisma/client'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: budgetId } = await context.params

    if (!budgetId) {
      return NextResponse.json({ error: 'Missing budget id' }, { status: 400 })
    }

    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const status = parseBudgetStatus(body?.status)
    const confirmStock = Boolean(body?.confirmStock)

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    const tenantId = await getTenantIdFromRequest(request)

    const budget = await prisma.budget.findFirst({
      where: tenantWhereId(budgetId, tenantId),
      include: {
        items: {
          include: { productService: true },
        },
      },
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    const current = budget.status

    

    // ✅ Chequeo de stock SOLO para disparar modal al aprobar
    if (status === 'approved' && !confirmStock) {
      const problems = budget.items
        .map((it) => {
          const ps = it.productService
          const available = ps?.stock ?? 0
          const requested = Number(it.quantity) || 0
          const missing = Math.max(0, requested - available)

          return {
            productServiceId: it.productServiceId,
            name: ps?.name ?? 'Producto no encontrado',
            requested,
            available,
            missing,
          }
        })
        .filter((p) => p.missing > 0)

      if (problems.length > 0) {
        return NextResponse.json(
          { error: 'Insufficient stock', problems },
          { status: 409 }
        )
      }
    }

    await prisma.$transaction([
      prisma.budget.update({
        where: tenantWhereId(budgetId, tenantId),
        data: { status },
      }),
      prisma.budgetStatusHistory.create({
        data: {
          budgetId,
          from: current,
          to: status,
        },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Status change error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}