//app\api\products\[id]\variants\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { hasFeature } from '@/lib/features' // 👈 nuevo

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = await getTenantIdFromRequest(req)
  const { id: productServiceId } = await params

  const product = await prisma.productService.findFirst({
    where: { id: productServiceId, tenantId },
    select: { id: true },
  })
  if (!product) {
    return NextResponse.json({ error: 'Product not found or tenant mismatch' }, { status: 404 })
  }

  const variants = await prisma.productVariant.findMany({
    where: { productServiceId },
    orderBy: { label: 'asc' },
  })

  return NextResponse.json(variants)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(req)
    const { id: productServiceId } = await params

    // 🔒 Variantes requiere plan PRO
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, features: true },
    })
    if (!tenant || !hasFeature(tenant, 'productVariants')) {
      return NextResponse.json(
        { error: 'Gestionar variantes requiere el plan PRO.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const label: string = (body.label ?? '').trim()
    const stock: number = Number(body.stock ?? 0)

    if (!label) {
      return NextResponse.json({ error: 'Falta el nombre de la variante' }, { status: 400 })
    }
    if (isNaN(stock) || stock < 0) {
      return NextResponse.json({ error: 'Stock inválido' }, { status: 400 })
    }

    const product = await prisma.productService.findFirst({
      where: { id: productServiceId, tenantId },
      select: { id: true },
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found or tenant mismatch' }, { status: 404 })
    }

    const variant = await prisma.productVariant.create({
      data: { productServiceId, label, stock },
    })

    return NextResponse.json(variant, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una variante con ese nombre en este producto' }, { status: 409 })
    }
    console.error('Create variant error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}