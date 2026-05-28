import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const budgets = await prisma.budget.findMany({
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
    const data = await request.json()

    if (!data?.clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }
    if (!Array.isArray(data?.items) || data.items.length === 0) {
      return NextResponse.json({ error: 'items are required' }, { status: 400 })
    }

    // ===============================
    // ✅ VALIDACIÓN SERVER-SIDE DE STOCK
    // (no descuenta stock, solo informa / valida productos)
    // ===============================

    const normalizedItems = data.items.map((it: any) => ({
      productServiceId: String(it.productServiceId),
      quantity: Math.max(0, Number(it.quantity) || 0),
      unitPrice: Number(it.unitPrice) || 0,
      discount: Number(it.discount ?? 0) || 0,
    }))

    const groupedQty = new Map<string, number>()
    for (const it of normalizedItems) {
      if (!it.productServiceId || it.quantity <= 0) continue
      groupedQty.set(it.productServiceId, (groupedQty.get(it.productServiceId) ?? 0) + it.quantity)
    }

    const productIds = Array.from(groupedQty.keys())
    if (productIds.length === 0) {
      return NextResponse.json({ error: 'items are required' }, { status: 400 })
    }

    const products = await prisma.productService.findMany({
      where: { id: { in: productIds }, active: true },
      select: { id: true, name: true, stock: true },
    })

    if (products.length !== productIds.length) {
      const found = new Set(products.map((p) => p.id))
      const missingIds = productIds.filter((id) => !found.has(id))
      return NextResponse.json(
        { error: 'Some products are invalid or inactive', missingProductIds: missingIds },
        { status: 400 }
      )
    }

    // Solo cálculo informativo de faltantes, no bloquea creación
    const stockProblems = products
      .map((p) => {
        const requested = groupedQty.get(p.id) ?? 0
        const available = p.stock ?? 0
        const missing = Math.max(0, requested - available)
        return {
          productServiceId: p.id,
          name: p.name,
          requested,
          available,
          missing,
        }
      })
      .filter((x) => x.missing > 0)

    // ===============================
    // ✅ CÁLCULOS (backend autoritativo)
    // ===============================

    const subtotal = normalizedItems.reduce(
      (acc: number, item: any) => acc + Number(item.quantity) * Number(item.unitPrice),
      0
    )

    const discountType = (data.discountType as 'percentage' | 'fixed' | null) ?? null
    const discountValue = Number(data.discountValue ?? 0) || 0

    let discount = 0
    if (discountType === 'percentage') {
      discount = subtotal * (Math.min(100, Math.max(0, discountValue)) / 100)
    } else if (discountType === 'fixed') {
      discount = Math.max(0, discountValue)
    }
    discount = Math.min(discount, subtotal)

    const taxPercentage = Number(data.taxPercentage ?? 0) || 0
    const taxedBase = Math.max(0, subtotal - discount)
    const tax = taxedBase * (Math.max(0, taxPercentage) / 100)

    const shippingCost =
      data.shippingCost === null || data.shippingCost === undefined || data.shippingCost === ''
        ? null
        : Math.max(0, Number(data.shippingCost) || 0)

    const total = taxedBase + tax + (shippingCost ?? 0)

    const sellerId =
      typeof data.sellerId === 'string' && data.sellerId.trim().length > 0
        ? data.sellerId.trim()
        : null

    const installerId =
      typeof data.installerId === 'string' && data.installerId.trim().length > 0
        ? data.installerId.trim()
        : null

    const budget = await prisma.budget.create({
      data: {
        status: 'draft',
        notes: typeof data.notes === 'string' ? data.notes : '',

        installationResponsible: data.installationResponsible ?? null,
        installerReference: data.installerReference ?? null,
        siteDetails: data.siteDetails ?? null,
        technicalDetails: data.technicalDetails ?? null,

        subtotal,
        discount,
        tax,
        shippingCost,
        total,

        paymentTerms: data.paymentTerms ?? null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,

        client: { connect: { id: data.clientId } },

        ...(sellerId ? { seller: { connect: { id: sellerId } } } : {}),
        ...(installerId ? { installer: { connect: { id: installerId } } } : {}),

        items: {
          create: normalizedItems.map((item: any) => ({
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.quantity) * Number(item.unitPrice),
            discount: Number(item.discount ?? 0) || 0,
            productService: { connect: { id: item.productServiceId } },
          })),
        },
      },
      include: {
        client: true,
        seller: true,
        installer: true,
        items: { include: { productService: true } },
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