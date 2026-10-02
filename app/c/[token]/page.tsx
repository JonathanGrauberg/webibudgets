//app\c\[token]\page.tsx
//
// Server Component — arma los meta tags de Open Graph reales antes de que
// WhatsApp los lea (igual que app/p/[token]/page.tsx para presupuestos).
import type { Metadata } from 'next'
import { loadPublicCobro } from '@/lib/public-cobro'
import { formatCurrency } from '@/lib/format'
import { CobroPortalClient } from './cobro-client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const cobro = await loadPublicCobro(token)

  if (!cobro) {
    return { title: 'Cobro no encontrado' }
  }

  const title = `${cobro.concept} — ${cobro.tenant.name}`
  const description = `Total: ${formatCurrency(cobro.amount, cobro.currency)} — Pagá online con Mercado Pago`

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function PublicCobroPortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <CobroPortalClient token={token} />
}
