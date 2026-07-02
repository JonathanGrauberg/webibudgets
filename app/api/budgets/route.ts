// app\api\budgets\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhere } from '@/lib/tenant'
import {
  calculateBudgetTotals,
  groupBudgetItemQuantities,
  getBudgetItemProductIds,
  normalizeBudgetItems,
  parseShippingCost,
} from '@/lib/budget-calculator'
import {
  buildBudgetItemCreatePayload,
  buildStockProblems,
  findMissingProductIds,
  loadBudgetProducts,
  normalizeRelationId,
  validateBudgetClient,
  validateBudgetInstaller,
  validateBudgetSeller,
} from '@/lib/budget-validators'

export async function GET(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)

    const budgets = await prisma.budget.findMany({
      where: tenantWhere(tenantId),
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json(budgets)
  } catch (error) {
    console.error('Get budgets error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()

    if (!data?.clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }
    if (!Array.isArray(data?.items) || data.items.length === 0) {
      return NextResponse.json({ error: 'items are required' }, { status: 400 })
    }

    // ===================================================
    // 🚨 CONTROL DE LÍMITE DE PRESUPUESTOS MENSUALES
    // ===================================================
    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true }
    })
    const currentPlan = tenantData?.plan || 'starter'

    if (currentPlan === 'starter') {
      const maxMonthlyBudgets = 30
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)

      const monthlyBudgetsCount = await prisma.budget.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfMonth
          }
        }
      })

      if (monthlyBudgetsCount >= maxMonthlyBudgets) {
        return NextResponse.json(
          { error: 'plan_limit_reached', message: 'Alcanzaste el límite de 30 presupuestos mensuales para el plan Starter.' },
          { status: 403 }
        )
      }
    }

    // ===============================================
    // ✅ VALIDACIÓN SERVER-SIDE DE STOCK & ITEMS
    // ===============================================
    const normalizedItems = normalizeBudgetItems(data.items)
    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: 'items are required' }, { status: 400 })
    }

    // 🌟 FILTRAMOS ID's: Solo extraemos id para ítems que NO sean personalizados (On-the-fly)
    const productIds = getBudgetItemProductIds(normalizedItems).filter(Boolean)
    const groupedQty = groupBudgetItemQuantities(normalizedItems)

    const clientIsValid = await validateBudgetClient(tenantId, data.clientId)
    if (!clientIsValid) {
      return NextResponse.json({ error: 'Invalid clientId for tenant' }, { status: 400 })
    }

    const sellerId = normalizeRelationId(data.sellerId)
    const installerId = normalizeRelationId(data.installerId)

    const [sellerIsValid, installerIsValid, products] = await Promise.all([
      validateBudgetSeller(tenantId, sellerId),
      validateBudgetInstaller(tenantId, installerId),
      loadBudgetProducts(tenantId, productIds),
    ])

    if (!sellerIsValid) {
      return NextResponse.json({ error: 'Invalid sellerId for tenant' }, { status: 400 })
    }
    if (!installerIsValid) {
      return NextResponse.json({ error: 'Invalid installerId for tenant' }, { status: 400 })
    }

    // Corregimos la comparación: Solo validamos si faltan IDs del catálogo real
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

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { budgetSequence: true },
    })

    if (!tenant) {
      throw new Error('Tenant not found')
    }

    const budgetNumber = tenant.budgetSequence

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        budgetSequence: { increment: 1 },
      },
    })

    // ===============================================
    // 💾 CREACIÓN DEL PRESUPUESTO EN BASE DE DATOS
    // ===============================================
    const budget = await prisma.budget.create({
      data: {
        tenant: {
          connect: { id: tenantId },
        },
        status: 'draft',
        budgetNumber,
        notes: typeof data.notes === 'string' ? data.notes : '',
        installationResponsible: data.installationResponsible ?? null,
        installerReference: data.installerReference ?? null,
        details: Array.isArray(data.details) ? data.details : [],
        subtotal: calculation.subtotal,
        discount: calculation.discountAmount,
        tax: calculation.taxAmount,
        shippingCost: calculation.shippingCost,
        total: calculation.total,
        paymentTerms: data.paymentTerms ?? null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        client: {
          connect: { id: data.clientId },
        },
        ...(sellerId ? { seller: { connect: { id: sellerId } } } : {}),
        ...(installerId ? { installer: { connect: { id: installerId } } } : {}),

        // 🌟 MAPEO INTELIGENTE DE ÍTEMS (NATIVOS VS LIBRES)
        items: {
          create: normalizedItems.map((item: any) => {
            const isCustom = !item.productServiceId || item.isCustom || item.customName;
            
            return {
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              subtotal: Number(item.subtotal || (item.quantity * item.unitPrice)),
              discount: Number(item.discount ?? 0),
              // Si es un producto libre, guardamos su nombre y NO conectamos productService
              customName: isCustom ? (item.customName || item.name || 'Ítem personalizado') : null,
              ...(!isCustom ? {
                productService: {
                  connect: { id: item.productServiceId }
                }
              } : {})
            }
          }),
        },
      },
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

    return NextResponse.json(
      {
        ...budget,
        stockProblems,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating budget:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}