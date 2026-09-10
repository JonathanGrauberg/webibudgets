//lib\budget-payments.ts
//
// El estado de cobro (pendiente/seña cobrada/saldado) nunca se guarda en la
// base — se calcula siempre a partir de los BudgetPayment con status
// 'approved'. Un solo lugar para esta cuenta, usado tanto por el portal
// público como por la tabla de presupuestos.

export type BudgetPaymentLike = { amount: number; status: string }

export type BudgetDepositLike = {
  total: number
  depositEnabled: boolean
  depositType: string | null
  depositValue: number | null
}

export type PaymentState = 'pending' | 'partial' | 'paid'

export function computeDepositAmount(budget: BudgetDepositLike): number | null {
  if (!budget.depositEnabled || budget.depositValue == null) return null
  if (budget.depositType === 'percent') {
    return Math.round(budget.total * (budget.depositValue / 100) * 100) / 100
  }
  return Math.round(budget.depositValue * 100) / 100
}

export function computePaymentSummary(budget: BudgetDepositLike, payments: BudgetPaymentLike[]) {
  const paid = Math.round(
    payments.filter((p) => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0) * 100
  ) / 100

  const remaining = Math.max(Math.round((budget.total - paid) * 100) / 100, 0)

  let state: PaymentState = 'pending'
  if (paid > 0 && remaining > 0) state = 'partial'
  else if (paid > 0 && remaining <= 0) state = 'paid'

  const depositAmount = computeDepositAmount(budget)

  // Próximo monto sugerido para cobrar: si no pagó nada y hay seña
  // configurada, la seña; si no, el saldo restante.
  const suggestedAmount = state === 'pending' && depositAmount != null ? depositAmount : remaining

  return { paid, remaining, state, depositAmount, suggestedAmount }
}

export const PAYMENT_STATE_LABEL: Record<PaymentState, string> = {
  pending: 'Pendiente',
  partial: 'Seña cobrada',
  paid: 'Saldado',
}
