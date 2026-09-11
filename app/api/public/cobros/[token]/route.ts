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

  return NextResponse.json({
    cobroNumber: cobro.cobroNumber,
    concept: cobro.concept,
    amount: cobro.amount,
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
