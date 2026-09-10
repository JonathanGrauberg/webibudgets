//app\p\[token]\page.tsx
//
// Server Component — necesario para poder armar los meta tags de Open
// Graph con los datos reales del presupuesto ANTES de que WhatsApp (que no
// ejecuta JavaScript) los lea. La parte interactiva vive en portal-client.
import type { Metadata } from 'next'
import { loadPublicBudget } from '@/lib/public-budget'
import { formatCurrency } from '@/lib/format'
import { PublicBudgetPortalClient } from './portal-client'

const FALLBACK_IMAGE = 'https://budgets.webistudio.net/og-whatsapp.png'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const budget = await loadPublicBudget(token)

  if (!budget || !budget.active) {
    return { title: 'Presupuesto no encontrado' }
  }

  const budgetNumber = String(budget.budgetNumber ?? 0).padStart(6, '0')
  const title = `Presupuesto #${budgetNumber} - ${budget.tenant.name}`
  const description = `Total: ${formatCurrency(budget.total, budget.currency)} — Mirá el detalle y confirmá el pago`
  const image = budget.tenant.logoUrl || FALLBACK_IMAGE

  return {
    title,
    description,
    // 👇 nunca indexar — es el presupuesto privado de un cliente puntual,
    // no una página pública del sitio. El og:image/description de arriba
    // solo son para que la vista previa de WhatsApp se vea bien.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [image],
    },
  }
}

export default async function PublicBudgetPortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <PublicBudgetPortalClient token={token} />
}
