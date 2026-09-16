// app/(public)/campus/guias/[guiaSlug]/page.tsx
//
// Portada de una guía — qué vas a aprender, lista de capítulos.
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Instagram, Facebook, ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGuia } from '@/lib/guias-data'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ guiaSlug: string }>
}): Promise<Metadata> {
  const { guiaSlug } = await params
  const guia = getGuia(guiaSlug)
  if (!guia) return { title: 'Guía no encontrada | .budgets' }
  return {
    title: `${guia.titulo} | Guías de .budgets`,
    description: guia.descripcionLarga,
  }
}

export default async function GuiaPage({
  params,
}: {
  params: Promise<{ guiaSlug: string }>
}) {
  const { guiaSlug } = await params
  const guia = getGuia(guiaSlug)
  if (!guia) notFound()

  const session = await getServerSession(authOptions).catch(() => null)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-4xl font-black tracking-tighter text-primary leading-none">
          .budgets
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            <a href="https://www.instagram.com/budgets.app/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de .budgets" className="text-muted-foreground transition hover:text-foreground">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://www.facebook.com/budgetsporwebistudio" target="_blank" rel="noopener noreferrer" aria-label="Facebook de .budgets" className="text-muted-foreground transition hover:text-foreground">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
          <Link href={session ? '/dashboard' : '/auth/login'} className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted">
            {session ? 'Volver al sistema' : 'Iniciar sesión'}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-14">
        <Link href="/campus/guias" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Guías
        </Link>

        <div className="mt-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{guia.subtitulo}</p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-5xl">{guia.titulo}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{guia.descripcionLarga}</p>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {guia.capitulos.length} capítulos
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {guia.capitulos.map((cap, i) => (
            <Link
              key={cap.slug}
              href={`/campus/guias/${guia.slug}/${cap.slug}`}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-center gap-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <h2 className="text-base font-bold">{cap.titulo}</h2>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {cap.minutosLectura} min de lectura
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>

        <div className="mt-16 flex items-center justify-center gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
          <span>Seguinos:</span>
          <a href="https://www.instagram.com/budgets.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition hover:text-foreground">
            <Instagram className="h-4 w-4" /> Instagram
          </a>
          <a href="https://www.facebook.com/budgetsporwebistudio" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition hover:text-foreground">
            <Facebook className="h-4 w-4" /> Facebook
          </a>
        </div>
      </div>
    </div>
  )
}
