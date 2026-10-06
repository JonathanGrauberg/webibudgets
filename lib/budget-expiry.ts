import { prisma } from '@/lib/prisma'

// Fecha de hoy en Argentina (UTC-3) a medianoche UTC: así un presupuesto
// "válido hasta el 10" sigue vigente todo el día 10 y recién vence el 11.
function todayInArgentina(now = new Date()): Date {
  const ar = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  return new Date(Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), ar.getUTCDate()))
}

// Pasa a "Vencido" los presupuestos en borrador o enviados cuya fecha de
// "válido hasta" ya pasó. Los aprobados, completados y rechazados no se tocan.
export async function expireOverdueBudgets(tenantId?: string) {
  const result = await prisma.budget.updateMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      status: { in: ['draft', 'sent'] },
      validUntil: { lt: todayInArgentina() },
    },
    data: { status: 'expired' },
  })
  return result.count
}
