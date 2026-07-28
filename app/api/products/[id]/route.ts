//app\api\products\[id]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'
import { isValidCurrency } from '@/lib/currencies' // 👈 nuevo


/* ======================
   GET
====================== */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(req)
    const { id } = await params

    const product = await prisma.productService.findFirst({
      where: tenantWhereId(id, tenantId),
    })

    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

/* ======================
   PATCH
====================== */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(req)
    const { id } = await params
    const data = await req.json()

    const result = await prisma.productService.updateMany({
      where: tenantWhereId(id, tenantId),
      data: {
        name: typeof data.name === 'string' ? data.name : undefined,
        description:
          typeof data.description === 'string' ? data.description : undefined,
        category: typeof data.category === 'string' ? data.category : undefined,
        price:
          data.price !== undefined && data.price !== ''
            ? Number(data.price)
            : undefined,
        cost:
          data.cost !== undefined && data.cost !== ''
            ? Number(data.cost)
            : undefined, // 👈 nuevo — igual criterio que price
        currency: isValidCurrency(data.currency) ? data.currency : undefined,
        unit: typeof data.unit === 'string' ? data.unit : undefined,
        active: typeof data.active === 'boolean' ? data.active : undefined,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Product not found or tenant mismatch' }, { status: 404 })
    }

    const updated = await prisma.productService.findFirst({
      where: tenantWhereId(id, tenantId),
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Patch product error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

/* ======================
   DELETE (soft delete)
====================== */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(_req)
    const { id } = await params

    const result = await prisma.productService.updateMany({
      where: tenantWhereId(id, tenantId),
      data: { active: false },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Product not found or tenant mismatch' }, { status: 404 })
    }

    const updated = await prisma.productService.findFirst({
      where: tenantWhereId(id, tenantId),
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}