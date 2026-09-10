//app\api\public\budgets\[token]\pay\route.ts
//
// Sin login. El cliente final clickeó "Pagar" en el portal — generamos la
// preferencia de cobro EN ESE MOMENTO (no antes), así nunca queda una
// preferencia vieja dando vueltas si el presupuesto se editó después.
import { NextResponse, NextRequest } from 'next/server'
import { loadPublicBudget } from '@/lib/public-budget'
import { computePaymentSummary } from '@/lib/budget-payments'
import { createBudgetPaymentPreference, MercadoPagoNotConnectedError } from '@/lib/mercadopago-checkout'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const budget = await loadPublicBudget(token)

  if (!budget || !budget.active) {
    return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
  }

  const summary = computePaymentSummary(budget, budget.payments)

  if (summary.state === 'paid') {
    return NextResponse.json({ error: 'Este presupuesto ya está saldado' }, { status: 400 })
  }

  if (!budget.tenant.mpConnected) {
    return NextResponse.json({ error: 'Este negocio todavía no habilitó el cobro online' }, { status: 400 })
  }

  // 👇 el cliente final puede elegir entre pagar la seña o el total — pero
  // el MONTO siempre se recalcula acá server-side, nunca se confía en un
  // número que mande el navegador. Si ya pagó algo (state='partial'), no
  // hay opciones: solo puede pagar lo que resta.
  const body = await req.json().catch(() => null)
  const kind = body?.kind === 'total' ? 'total' : body?.kind === 'deposit' ? 'deposit' : undefined

  const amount =
    summary.state === 'partial'
      ? summary.remaining
      : kind === 'total' || summary.depositAmount == null
        ? summary.remaining // en 'pending' remaining === total (todavía no pagó nada)
        : summary.depositAmount

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'No hay ningún monto pendiente de cobro' }, { status: 400 })
  }

  try {
    const { initPoint } = await createBudgetPaymentPreference({
      tenant: budget.tenant,
      budget: {
        id: budget.id,
        budgetNumber: budget.budgetNumber,
        total: budget.total,
        currency: budget.currency,
        client: budget.client,
      },
      amount,
      publicToken: token,
      origin: req.nextUrl.origin,
    })

    return NextResponse.json({ url: initPoint, amount })
  } catch (err) {
    if (err instanceof MercadoPagoNotConnectedError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[public/budgets/pay]', err)
    return NextResponse.json({ error: 'No pudimos generar el link de pago, probá de nuevo en un momento' }, { status: 500 })
  }
}
