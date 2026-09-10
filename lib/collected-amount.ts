//lib\collected-amount.ts
//
// "Cuánto se cobró de verdad" de un presupuesto tiene DOS fuentes: recibos
// manuales (Receipt — efectivo/transferencia) y pagos online aprobados
// (BudgetPayment — Mercado Pago). Antes cada pantalla las sumaba por su
// cuenta (o ni sabía que la otra existía) — esta es la única fuente de
// verdad, usada por rendiciones, dashboard y el módulo de documentos.
import { prisma } from '@/lib/prisma'

const INACTIVE_RECEIPT_STATUSES = new Set(['cancelled', 'anulado', 'voided', 'void', 'annulled'])

export function isReceiptActive(status?: string | null) {
  if (!status) return true
  return !INACTIVE_RECEIPT_STATUSES.has(status)
}

export async function getCollectedByBudgetIds(budgetIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (budgetIds.length === 0) return map

  const [receipts, payments] = await Promise.all([
    prisma.receipt.findMany({
      // 👇 sourceBudgetPaymentId: null — un recibo generado desde "¿Crear
      // recibo de este pago?" es solo un comprobante imprimible, la plata
      // que representa ya la contó el BudgetPayment de abajo.
      where: { budgetId: { in: budgetIds }, sourceBudgetPaymentId: null },
      select: { budgetId: true, amount: true, status: true },
    }),
    prisma.budgetPayment.findMany({
      where: { budgetId: { in: budgetIds }, status: 'approved' },
      select: { budgetId: true, amount: true },
    }),
  ])

  for (const r of receipts) {
    if (!r.budgetId || !isReceiptActive(r.status)) continue
    map.set(r.budgetId, (map.get(r.budgetId) ?? 0) + Number(r.amount || 0))
  }
  for (const p of payments) {
    map.set(p.budgetId, (map.get(p.budgetId) ?? 0) + Number(p.amount || 0))
  }

  return map
}
