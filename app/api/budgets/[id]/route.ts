//app\api\budgets\[id]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'
import {
  calculateBudgetTotals,
  getBudgetItemProductIds,
  groupBudgetItemQuantities,
  normalizeBudgetItems,
  parseShippingCost,
} from '@/lib/budget-calculator'
import {
  buildBudgetItemCreatePayload,
  buildStockProblems,
  findMissingProductIds,
  isValidBudgetStatus,
  parseBudgetStatus,
  loadBudgetProducts,
  normalizeRelationId,
  validateBudgetInstaller,
  validateBudgetSeller,
} from '@/lib/budget-validators'

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Params) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { error: 'Missing budget id param' },
      { status: 400 }
    )
  }

  try {
    const budget = await prisma.budget.findFirst({
      where: tenantWhereId(id, tenantId),
      include: {
        client: true,
        seller: true,
        installer: true,

        items: {
          include: {
            productService: true,
          },
        },

        history: {
          orderBy: {
            changedAt: 'desc',
          },
        },
      }
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { error: 'Missing budget id param' },
      { status: 400 }
    )
  }

  try {
    const data = await request.json()
    const sellerId = data.hasOwnProperty('sellerId') ? normalizeRelationId(data.sellerId) : undefined
    const installerId = data.hasOwnProperty('installerId') ? normalizeRelationId(data.installerId) : undefined

    if (data.status !== undefined) {
      const status = parseBudgetStatus(data.status)
      if (!status) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      data.status = status
    }

    if (Array.isArray(data.items)) {
      const normalizedItems = normalizeBudgetItems(data.items)
      if (normalizedItems.length === 0) {
        return NextResponse.json({ error: 'items are required' }, { status: 400 })
      }

      const productIds = getBudgetItemProductIds(normalizedItems)
      const groupedQty = groupBudgetItemQuantities(normalizedItems)

      const [sellerIsValid, installerIsValid, products] = await Promise.all([
        validateBudgetSeller(tenantId, sellerId ?? null),
        validateBudgetInstaller(tenantId, installerId ?? null),
        loadBudgetProducts(tenantId, productIds),
      ])

      if (sellerId !== undefined && !sellerIsValid) {
        return NextResponse.json({ error: 'Invalid sellerId for tenant' }, { status: 400 })
      }

      if (installerId !== undefined && !installerIsValid) {
        return NextResponse.json({ error: 'Invalid installerId for tenant' }, { status: 400 })
      }

      if (products.length !== productIds.length) {
        const missingIds = findMissingProductIds(products, productIds)
        return NextResponse.json(
          {
            error: 'Some products are invalid, inactive, or not part of the tenant',
            missingProductIds: missingIds,
          },
          { status: 400 }
        )
      }

      const stockProblems = buildStockProblems(products, groupedQty)

      const calculation = calculateBudgetTotals({
        items: normalizedItems,
        discountType: (data.discountType as 'percentage' | 'fixed' | null) ?? null,
        discountValue: Number(data.discountValue ?? 0) || 0,
        taxPercentage: Number(data.taxPercentage ?? 0) || 0,
        shippingCost: parseShippingCost(data.shippingCost),
      })

      const updateData: Record<string, unknown> = {
        subtotal: calculation.subtotal,
        discount: calculation.discountAmount,
        tax: calculation.taxAmount,
        shippingCost: calculation.shippingCost,
        total: calculation.total,
      }

      if (data.status !== undefined) {
        updateData.status = data.status
      }

      if (data.notes !== undefined) {
        updateData.notes = data.notes
      }

      if (data.paymentTerms !== undefined) {
        updateData.paymentTerms = data.paymentTerms ?? null
      }

      if (data.validUntil !== undefined) {
        updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null
      }

      if (data.installationResponsible !== undefined) {
        updateData.installationResponsible = data.installationResponsible ?? null
      }

      if (data.installerReference !== undefined) {
        updateData.installerReference = data.installerReference ?? null
      }

      if (data.details !== undefined) {
        updateData.details = data.details ?? []
      }
      
      if (sellerId !== undefined) {
        updateData.sellerId = sellerId
      }

      if (installerId !== undefined) {
        updateData.installerId = installerId
      }

      // 🌟 SOLUCIÓN: Creamos el mapa de costos aquí usando los "products" cargados arriba
      const productCostMap = new Map(products.map((p) => [p.id, p.cost ?? null]))

      const result = await prisma.$transaction([
        prisma.budget.updateMany({ where: tenantWhereId(id, tenantId), data: updateData }),
        prisma.budgetItem.deleteMany({ where: { budgetId: id } }),
        prisma.budgetItem.createMany({
          data: buildBudgetItemCreatePayload(normalizedItems).map((item: any) => {
            const pId = item.productServiceId || item.productId; // Previene discrepancias de nombres en el validador
            return {
              budgetId: id,
              productServiceId: pId || null,
              quantity: item.quantity, 
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              discount: item.discount,
              customName: item.customName,
              cost: pId ? productCostMap.get(pId) ?? null : null, // 👈 Ahora sí funciona perfectamente
              widthCm: item.widthCm,
              heightCm: item.heightCm,
              depthCm: item.depthCm,
              direct: item.direct,
              hours: item.hours,
              calculatedM2: item.calculatedM2,
            }
          }),
        }),
      ])

      if (result[0].count === 0) {
        return NextResponse.json({ error: 'Budget not found or tenant mismatch' }, { status: 404 })
      }

      const budget = await prisma.budget.findFirst({
        where: tenantWhereId(id, tenantId),
        include: {
          client: true,
          seller: true,
          installer: true,
          items: {
            include: {
              productService: true,
            },
          },
        },
      })

      return NextResponse.json({ ...budget, stockProblems })
    }

    const updated = await prisma.budget.updateMany({
      where: tenantWhereId(id, tenantId),
      data: {
        status: data.status,
        notes: data.notes,
        total: data.total,
      },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Budget not found or tenant mismatch' }, { status: 404 })
    }

    const budget = await prisma.budget.findFirst({
      where: tenantWhereId(id, tenantId),
      include: {
        client: true,
        seller: true,
        installer: true,
        items: {
          include: {
            productService: true,
          },
        },
      },
    })

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { error: 'Missing budget id param' },
      { status: 400 }
    )
  }

  try {
    const result = await prisma.budget.deleteMany({
      where: tenantWhereId(id, tenantId),
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Budget not found or tenant mismatch' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}