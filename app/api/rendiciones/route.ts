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

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, features: true },
    })

    const periodStart = new Date(data.periodStart)
    const periodEnd = new Date(data.periodEnd)
    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime()) || periodStart > periodEnd) {
      return NextResponse.json({ error: 'Rango de fechas inválido' }, { status: 400 })
    }

    // 🔒 Sin 'commissions', solo rangos "estándar": máximo 31 días, y no más viejos que 31 días atrás
    if (!tenant || !hasFeature(tenant, 'commissions')) {
      const maxRangeMs = 31 * 24 * 60 * 60 * 1000
      const rangeMs = periodEnd.getTime() - periodStart.getTime()
      const daysSinceStart = Date.now() - periodStart.getTime()

      if (rangeMs > maxRangeMs || daysSinceStart > maxRangeMs) {
        return NextResponse.json({ error: 'Rango de fechas personalizado requiere el plan PRO.' }, { status: 403 })
      }
    }

    // 🔎 👈 EL FIX: buscamos si ya existe una rendición para este tenant y este
    // rango EXACTO de fechas, en vez de crear una fila nueva cada vez que se
    // entra a la pantalla — así el reparto ya guardado (RendicionAsignacion /
    // RendicionSellerShare) sigue apuntando al mismo id y no "desaparece".
    const existente = await prisma.rendicion.findFirst({
      where: { tenantId, periodStart, periodEnd },
    })

    if (existente) {
      // Una rendición cerrada es un snapshot congelado — se devuelve tal cual,
      // nunca se recalcula ni se le tocan los presupuestos vinculados.
      if (existente.status === 'closed') {
        return NextResponse.json({ id: existente.id }, { status: 200 })
      }

      // Sigue en borrador: refrescamos los totales cacheados y enlazamos
      // presupuestos nuevos que hayan quedado saldados desde la última vez —
      // pero jamás tocamos el reparto ya guardado por el usuario.
      const computed = await generateRendicionData(tenantId, periodStart, periodEnd)

      await prisma.$transaction(async (tx) => {
        await tx.rendicion.update({
          where: { id: existente.id },
          data: {
            presupuestosCompletados: computed.presupuestosCompletados,
            totalFacturado: computed.totalFacturado,
            totalCosto: computed.totalCosto,
            totalGanancia: computed.totalGanancia,
            margenPromedio: computed.margenPromedio,
          },
        })

        if (computed.budgetRows.length > 0) {
          await tx.rendicionBudget.createMany({
            data: computed.budgetRows.map((b) => ({
              rendicionId: existente.id,
              budgetId: b.budgetId,
            })),
            skipDuplicates: true, // 👈 clave — no falla si el presupuesto ya estaba vinculado
          })
        }
      })

      return NextResponse.json({ id: existente.id }, { status: 200 })
    }

    // No existía ninguna para este período: la creamos por primera vez, igual que antes.
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
          totalGastosGenerales: computed.totalGastosGenerales, // 👈 nuevo
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