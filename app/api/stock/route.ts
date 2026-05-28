import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
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

    const product = await prisma.productService.findUnique({
      where: { id: productServiceId },
      select: { id: true, stock: true, name: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
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
    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.productService.update({
        where: { id: productServiceId },
        data: { stock: newStock },
      })

      await tx.stockMovement.create({
        data: {
          productServiceId,
          delta,
          type,
          reason,
        },
      })

      return updatedProduct
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Stock update error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
