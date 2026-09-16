//app\api\public\cobros\[token]\route.ts
//
// Sin login — lo abre el cliente final desde el link que le mandaron.
import { NextResponse } from 'next/server'
import { loadPublicCobro } from '@/lib/public-cobro'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cobro = await loadPublicCobro(token)

  if (!cobro) {
    return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
  }

  // 👇 nuevo — si hay recargo por MP, el cliente paga esto por MP (no el
  // `amount` nominal) — se muestra en el botón para que sepa cuánto es antes de tocarlo.
  const surchargePct = cobro.mpSurchargePercent ?? 0
  const mpAmount = surchargePct > 0
    ? Math.round(cobro.amount * (1 + surchargePct / 100) * 100) / 100
    : cobro.amount

  return NextResponse.json({
    cobroNumber: cobro.cobroNumber,
    concept: cobro.concept,
    alias: cobro.alias, // 👈 nuevo — alias de transferencia, alternativa a pagar por MP
    amount: cobro.amount,
    mpAmount, // 👈 nuevo
    mpSurchargePercent: surchargePct > 0 ? surchargePct : null, // 👈 nuevo
    paymentMethod: cobro.paymentMethod, // 👈 nuevo — para saber si el "pagado" fue vía MP (y mostrar el monto real cobrado, con recargo)
    currency: cobro.currency,
    status: cobro.status,
    periodMonth: cobro.periodMonth,
    client: cobro.client ? { name: cobro.client.name, company: cobro.client.company } : null,
    tenant: {
      name: cobro.tenant.name,
      logoUrl: cobro.tenant.logoUrl,
      primaryColor: cobro.tenant.primaryColor,
    },
    showFooterBranding: cobro.tenant.showFooterBranding,
    canPay: !!cobro.tenant.mpConnected && cobro.status !== 'paid',
  })
}
