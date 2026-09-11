//app\api\public\cobros\[token]\pay\route.ts
//
// Sin login. El cliente final clickeó "Pagar" en el portal del Cobro.
import { NextResponse, NextRequest } from 'next/server'
import { loadPublicCobro } from '@/lib/public-cobro'
import { createCobroPaymentPreference, MercadoPagoNotConnectedError } from '@/lib/mercadopago-checkout'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cobro = await loadPublicCobro(token)

  if (!cobro) {
    return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
  }
  if (cobro.status === 'paid') {
    return NextResponse.json({ error: 'Este cobro ya está pagado' }, { status: 400 })
  }
  if (!cobro.tenant.mpConnected) {
    return NextResponse.json({ error: 'Este negocio todavía no habilitó el cobro online' }, { status: 400 })
  }

  try {
    const { initPoint } = await createCobroPaymentPreference({
      tenant: cobro.tenant,
      cobro: {
        id: cobro.id,
        cobroNumber: cobro.cobroNumber,
        concept: cobro.concept,
        amount: cobro.amount,
        currency: cobro.currency,
        client: cobro.client,
      },
      publicToken: token,
      origin: req.nextUrl.origin,
    })

    return NextResponse.json({ url: initPoint })
  } catch (err) {
    if (err instanceof MercadoPagoNotConnectedError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[public/cobros/pay]', err)
    return NextResponse.json({ error: 'No pudimos generar el link de pago, probá de nuevo en un momento' }, { status: 500 })
  }
}
