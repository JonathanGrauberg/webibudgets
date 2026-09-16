//app\api\cobros\[id]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const cobro = await prisma.cobro.findFirst({
    where: { id, tenantId },
    include: { client: { select: { id: true, name: true, company: true, whatsappNumber: true } } },
  })

  if (!cobro) {
    return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
  }

  return NextResponse.json(cobro)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json()

    const existing = await prisma.cobro.findFirst({ where: { id, tenantId } })
    if (!existing) {
      return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (data.concept !== undefined) updateData.concept = String(data.concept).trim()
    if (data.alias !== undefined) updateData.alias = data.alias ? String(data.alias).trim() : null
    if (data.mpSurchargePercent !== undefined) {
      if (data.mpSurchargePercent === null) {
        updateData.mpSurchargePercent = null
      } else {
        const pct = Number(data.mpSurchargePercent)
        if (Number.isNaN(pct) || pct < 0 || pct > 100) {
          return NextResponse.json({ error: 'El recargo por Mercado Pago debe ser un % entre 0 y 100' }, { status: 400 })
        }
        updateData.mpSurchargePercent = pct
      }
    }
    if (data.amount !== undefined) updateData.amount = Number(data.amount)
    if (data.notes !== undefined) updateData.notes = data.notes || null

    // 👇 nuevo — (des)vincular un presupuesto/trabajo. `null` explícito desvincula.
    if (data.budgetId !== undefined) {
      if (data.budgetId === null) {
        updateData.budgetId = null
      } else {
        const budget = await prisma.budget.findFirst({ where: { id: data.budgetId, tenantId }, select: { id: true } })
        if (!budget) {
          return NextResponse.json({ error: 'El presupuesto no existe o no pertenece al tenant' }, { status: 404 })
        }
        updateData.budgetId = budget.id
      }
    }

    const cobro = await prisma.cobro.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, company: true } },
        budget: { select: { id: true, budgetNumber: true, total: true } },
      },
    })

    return NextResponse.json(cobro)
  } catch (error) {
    console.error('Error updating cobro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const existing = await prisma.cobro.findFirst({ where: { id, tenantId } })
  if (!existing) {
    return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
  }
  if (existing.status === 'paid') {
    return NextResponse.json({ error: 'No se puede eliminar un cobro ya pagado — es un registro contable' }, { status: 400 })
  }

  await prisma.cobro.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
