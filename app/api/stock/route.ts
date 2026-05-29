import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

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

    const product = await prisma.productService.findFirst({
      where: { id: productServiceId, tenantId },
      select: { id: true, stock: true, name: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or tenant mismatch' },
        { status: 404 }
      )
    }

    const currentStock = product.stock ?? 0
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
      const updateRes = await tx.productService.updateMany({
        where: { id: productServiceId, tenantId },
        data: { stock: newStock },
      })

      if (updateRes.count === 0) {
        throw new Error('Product not found or tenant mismatch during update')
      }

      await tx.stockMovement.create({
        data: {
          productServiceId,
          delta,
          type,
          reason,
          tenantId,
        },
      })

      const updated = await tx.productService.findFirst({ where: { id: productServiceId, tenantId } })
      return updated
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
