import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { hasFeature } from '@/lib/features' // 👈 nuevo

async function findOwnedVariant(tenantId: string, productServiceId: string, variantId: string) {
  return prisma.productVariant.findFirst({
    where: { id: variantId, productServiceId, productService: { tenantId } },
  })
}

// 👇 nuevo — helper compartido entre PATCH y DELETE
async function ensureVariantsFeature(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true, features: true },
  })
  return tenant && hasFeature(tenant, 'productVariants')
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(req)
    const { id: productServiceId, variantId } = await params

    // 🔒
    if (!(await ensureVariantsFeature(tenantId))) {
      return NextResponse.json(
        { error: 'Gestionar variantes requiere el plan PRO.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const existing = await findOwnedVariant(tenantId, productServiceId, variantId)
    if (!existing) {
      return NextResponse.json({ error: 'Variant not found or tenant mismatch' }, { status: 404 })
    }

    const data: { label?: string; stock?: number; active?: boolean } = {}
    if (typeof body.label === 'string' && body.label.trim()) data.label = body.label.trim()
    if (body.stock !== undefined) {
      const stock = Number(body.stock)
      if (isNaN(stock) || stock < 0) {
        return NextResponse.json({ error: 'Stock inválido' }, { status: 400 })
      }
      data.stock = stock
    }
    if (typeof body.active === 'boolean') data.active = body.active

    const updated = await prisma.productVariant.update({ where: { id: variantId }, data })
    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una variante con ese nombre en este producto' }, { status: 409 })
    }
    console.error('Update variant error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const tenantId = await getTenantIdFromRequest(req)
  const { id: productServiceId, variantId } = await params

  const existing = await findOwnedVariant(tenantId, productServiceId, variantId)
  if (!existing) {
    return NextResponse.json({ error: 'Variant not found or tenant mismatch' }, { status: 404 })
  }

  // BudgetItem.productVariantId es onDelete: SetNull — los presupuestos
  // viejos que usaron esta variante no se rompen, solo pierden el link
  // al stock vivo (la característica en texto queda intacta).
  await prisma.productVariant.delete({ where: { id: variantId } })

  return NextResponse.json({ deleted: true })
}