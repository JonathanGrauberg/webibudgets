//app\api\public\cobros\[token]\status\route.ts
//
// Polling liviano tras volver de Mercado Pago.
import { NextResponse } from 'next/server'
import { loadPublicCobro } from '@/lib/public-cobro'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cobro = await loadPublicCobro(token)

  if (!cobro) {
    return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ status: cobro.status })
}
