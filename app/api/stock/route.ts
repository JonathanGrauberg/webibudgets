//app\api\stock\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

// Historial de movimientos de un producto (y opcionalmente una variante puntual)
export async function GET(req: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(req)
    const { searchParams } = new URL(req.url)
    const productServiceId = searchParams.get('productServiceId')
    const productVariantId = searchParams.get('productVariantId')

    if (!productServiceId) {
      return NextResponse.json({ error: 'productServiceId is required' }, { status: 400 })
    }

    const movements = await prisma.stockMovement.findMany({
      where: {
        tenantId,
        productServiceId,
        ...(productVariantId ? { productVariantId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(movements)
  } catch (error) {
    console.error('Stock movements fetch error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(req)
    const body = await req.json()

    const productServiceId: string = body.productServiceId
    const delta: number = Number(body.delta)
    const reason: string | null = body.reason ?? null

    if (!productServiceId || isNaN(delta)) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    const productVariantId: string | null = body.productVariantId ?? null

const product = await prisma.productService.findFirst({
  where: { id: productServiceId, tenantId },
  select: { id: true, stock: true, name: true, variants: { where: { active: true }, select: { id: true } } },
})

if (!product) {
  return NextResponse.json(
    { error: 'Product not found or tenant mismatch' },
    { status: 404 }
  )
}

// Si el producto tiene variantes, no se puede mover el stock "general" —
// hay que decir cuál variante (color, talle, etc.)
if (product.variants.length > 0 && !productVariantId) {
  return NextResponse.json(
    { error: 'Este producto tiene variantes: especificá productVariantId' },
    { status: 400 }
  )
}

let variant: { id: string; stock: number } | null = null
if (productVariantId) {
  variant = await prisma.productVariant.findFirst({
    where: { id: productVariantId, productServiceId },
    select: { id: true, stock: true },
  })
  if (!variant) {
    return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
  }
}

const currentStock = variant ? variant.stock : (product.stock ?? 0)
const newStock = currentStock + delta

    // 🚫 no permitir negativo
    if (newStock < 0) {
      return NextResponse.json(
        { error: `Stock insuficiente. Disponible: ${currentStock}` },
        { status: 409 }
      )
    }

    // tipo de movimiento
    let type: 'in' | 'out' | 'adjust' = 'adjust'
    if (delta > 0) type = 'in'
    if (delta < 0) type = 'out'

    // transacción = actualizar stock + guardar movimiento
    // Transacción tenant-safe: actualizar usando filters y registrar movimiento con tenantId
    const txResult = await prisma.$transaction(async (tx) => {
  if (variant) {
    const updateRes = await tx.productVariant.updateMany({
      where: { id: variant.id, productServiceId },
      data: { stock: newStock },
    })
    if (updateRes.count === 0) {
      throw new Error('Variant not found during update')
    }
  } else {
    const updateRes = await tx.productService.updateMany({
      where: { id: productServiceId, tenantId },
      data: { stock: newStock },
    })
    if (updateRes.count === 0) {
      throw new Error('Product not found or tenant mismatch during update')
    }
  }

  await tx.stockMovement.create({
    data: {
      productServiceId,
      productVariantId: variant?.id ?? null,
      delta,
      type,
      reason,
      tenantId,
    },
  })

  return variant
    ? tx.productVariant.findFirst({ where: { id: variant.id } })
    : tx.productService.findFirst({ where: { id: productServiceId, tenantId } })
})

    return NextResponse.json(txResult)
  } catch (error) {
    console.error('Stock update error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}