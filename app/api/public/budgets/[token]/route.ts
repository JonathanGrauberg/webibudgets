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
    budgetNumber: budget.budgetNumber,
    status: budget.status,
    currency: budget.currency,
    total: budget.total,
    createdAt: budget.createdAt,
    client: budget.client ? { name: budget.client.name, company: budget.client.company } : null,
    items: budget.items.map((item) => ({
      name: item.customName || item.productService?.name || 'Ítem',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
    tenant: {
      name: budget.tenant.name,
      logoUrl: budget.tenant.logoUrl,
      primaryColor: budget.tenant.primaryColor,
      accentColor: budget.tenant.accentColor,
    },
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
