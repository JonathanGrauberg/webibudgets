//app\api\rendiciones\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhere } from '@/lib/tenant'
import { hasFeature } from '@/lib/features'
import { generateRendicionData } from '@/lib/rendicion-engine'

export async function GET(request: Request) {
  const tenantId = await getTenantIdFromRequest(request)
  const rendiciones = await prisma.rendicion.findMany({
    where: tenantWhere(tenantId),
    orderBy: { periodStart: 'desc' },
    select: {
      id: true, periodStart: true, periodEnd: true, status: true,
      presupuestosCompletados: true, totalFacturado: true, totalGanancia: true,
    },
  })
  return NextResponse.json(rendiciones)
}

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { features: true } })
    if (!hasFeature({ features: tenant?.features }, 'commissions')) {
      return NextResponse.json({ error: 'Módulo de comisiones no habilitado' }, { status: 403 })
    }

    const periodStart = new Date(data.periodStart)
    const periodEnd = new Date(data.periodEnd)
    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime()) || periodStart > periodEnd) {
      return NextResponse.json({ error: 'Rango de fechas inválido' }, { status: 400 })
    }

    const computed = await generateRendicionData(tenantId, periodStart, periodEnd)

    const rendicion = await prisma.$transaction(async (tx) => {
      const created = await tx.rendicion.create({
        data: {
          tenantId,
          periodStart,
          periodEnd,
          presupuestosCompletados: computed.presupuestosCompletados,
          totalFacturado: computed.totalFacturado,
          totalCosto: computed.totalCosto,
          totalGanancia: computed.totalGanancia,
          margenPromedio: computed.margenPromedio,
        },
      })

      if (computed.sellerShares.length > 0) {
        await tx.rendicionSellerShare.createMany({
          data: computed.sellerShares.map((s) => ({
            rendicionId: created.id,
            sellerId: s.sellerId,
            presupuestosCompletados: s.presupuestosCompletados,
            totalFacturado: s.totalFacturado,
            ganancia: s.ganancia,
            margenPromedio: s.margenPromedio,
            percentage: s.percentage,
            gananciaAPagar: s.gananciaAPagar,
            isDefault: true,
          })),
        })
      }

      if (computed.budgetRows.length > 0) {
        await tx.rendicionBudget.createMany({
          data: computed.budgetRows.map((b) => ({
            rendicionId: created.id,
            budgetId: b.budgetId,
          })),
        })
      }

      return created
    })

    return NextResponse.json({ id: rendicion.id }, { status: 201 })
  } catch (error) {
    console.error('Error generating rendicion:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}