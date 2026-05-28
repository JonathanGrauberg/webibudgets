import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/* ======================
   GET
====================== */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await prisma.productService.findUnique({
      where: { id },
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
    const { id } = await params
    const data = await req.json()

    const updated = await prisma.productService.update({
      where: { id },
      data: {
        name: typeof data.name === 'string' ? data.name : undefined,
        description:
          typeof data.description === 'string' ? data.description : undefined,
        category: typeof data.category === 'string' ? data.category : undefined,
        price:
          data.price !== undefined && data.price !== ''
            ? Number(data.price)
            : undefined,
        unit: typeof data.unit === 'string' ? data.unit : undefined,
        active: typeof data.active === 'boolean' ? data.active : undefined,
      },
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
    const { id } = await params

    const updated = await prisma.productService.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}