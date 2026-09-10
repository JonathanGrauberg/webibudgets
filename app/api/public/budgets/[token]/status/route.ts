//app\api\public\budgets\[token]\status\route.ts
//
// Endpoint liviano para el polling de "Procesando pago..." — el portal lo
// consulta cada pocos segundos al volver de Mercado Pago, hasta que el
// webhook (que puede tardar unos segundos) impacte el pago en la base.
import { NextResponse } from 'next/server'
import { loadPublicBudget } from '@/lib/public-budget'
import { computePaymentSummary } from '@/lib/budget-payments'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const budget = await loadPublicBudget(token)

  if (!budget) {
    return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
  }

  const summary = computePaymentSummary(budget, budget.payments)

  return NextResponse.json({
    state: summary.state,
    paid: summary.paid,
    remaining: summary.remaining,
  })
}
