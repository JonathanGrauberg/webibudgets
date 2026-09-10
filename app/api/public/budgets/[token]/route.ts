//app\api\public\budgets\[token]\route.ts
//
// Sin login — lo abre el cliente final desde el link que le mandaron.
// Devolvemos SOLO lo necesario para mostrar el presupuesto y cobrar: nunca
// tokens de MP, notas internas, costos, ni nada del resto del tenant.
import { NextResponse } from 'next/server'
import { loadPublicBudget } from '@/lib/public-budget'
import { computePaymentSummary } from '@/lib/budget-payments'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const budget = await loadPublicBudget(token)

  if (!budget || !budget.active) {
    return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
  }

  const summary = computePaymentSummary(budget, budget.payments)

  return NextResponse.json({
    // 👇 el detalle visual (ítems, totales, datos de la empresa) ya no
    // viaja acá — el portal lo muestra directo desde el HTML real del PDF
    // (ver /api/public/budgets/[token]/html). Esto solo trae lo que hace
    // falta para la tarjeta de pago.
    budgetNumber: budget.budgetNumber,
    currency: budget.currency,
    showFooterBranding: budget.tenant.showFooterBranding,
    depositEnabled: budget.depositEnabled,
    payment: {
      paid: summary.paid,
      remaining: summary.remaining,
      state: summary.state,
      depositAmount: summary.depositAmount,
      suggestedAmount: summary.suggestedAmount,
    },
    canPay: !!budget.tenant.mpConnected && summary.state !== 'paid',
  })
}
