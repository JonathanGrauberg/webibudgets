import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantCreateData, tenantWhere } from '@/lib/tenant'

export async function GET(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const products = await prisma.productService.findMany({
      where: tenantWhere(tenantId),
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()

    const product = await prisma.productService.create({
      data: tenantCreateData(
        {
          name: data.name,
          description: data.description ?? '',
          category: data.category,
          price: Number(data.price),
          unit: data.unit,
          active: data.active ?? true,
        },
        tenantId
      ),
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
