// app/(public)/academia/guias/[guiaSlug]/[capituloSlug]/page.tsx
//
// Página de un capítulo — cada uno con su propia URL a propósito, para
// poder rankear en Google por su propia búsqueda puntual sin competir con
// los otros capítulos de la misma guía.
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Instagram, Facebook, ArrowLeft, ArrowRight, Clock, Sparkles } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCapitulo } from '@/lib/guias-data'
import { ChapterAccordion } from '@/components/academia/chapter-accordion'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ guiaSlug: string; capituloSlug: string }>
}): Promise<Metadata> {
  const { guiaSlug, capituloSlug } = await params
  const found = getCapitulo(guiaSlug, capituloSlug)
  if (!found) return { title: 'Capítulo no encontrado | .budgets' }
  const { guia, capitulo } = found
  return {
    title: `${capitulo.titulo} | ${guia.titulo} — .budgets`,
    description: capitulo.intro[0],
  }
}

export default async function CapituloPage({
  params,
}: {
  params: Promise<{ guiaSlug: string; capituloSlug: string }>
}) {
  const { guiaSlug, capituloSlug } = await params
  const found = getCapitulo(guiaSlug, capituloSlug)
  if (!found) notFound()

  const { guia, capitulo, index } = found
  const anterior = index > 0 ? guia.capitulos[index - 1] : null
  const siguiente = index < guia.capitulos.length - 1 ? guia.capitulos[index + 1] : null

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

      <div className="mx-auto max-w-2xl px-6 py-14">
        <Link href={`/academia/guias/${guia.slug}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> {guia.titulo}
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Capítulo {index + 1} de {guia.capitulos.length}
          </p>
          <h1 className="mt-2 text-balance text-2xl font-bold tracking-tight sm:text-3xl">{capitulo.titulo}</h1>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {capitulo.minutosLectura} min de lectura
          </p>
        </div>

        <div className="mt-6 space-y-3 text-sm leading-relaxed text-foreground/90">
          {capitulo.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {capitulo.pasosIntro && (
          <p className="mt-8 text-sm font-semibold">{capitulo.pasosIntro}</p>
        )}

        <ChapterAccordion pasos={capitulo.pasos} />

        {capitulo.cierre && (
          <div className="mt-6 space-y-3 text-sm leading-relaxed text-foreground/90">
            {capitulo.cierre.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {/* Conexión con la plataforma — algo real, no un módulo inventado */}
        <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {capitulo.ctaTitulo}
          </p>
          <p className="mt-1.5 text-sm text-foreground/80">{capitulo.ctaTexto}</p>
          <Link href="/auth/login" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Probar .budgets <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Navegación entre capítulos */}
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          {anterior ? (
            <Link
              href={`/academia/guias/${guia.slug}/${anterior.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> {anterior.titulo}
            </Link>
          ) : (
            <span />
          )}
          {siguiente ? (
            <Link
              href={`/academia/guias/${guia.slug}/${siguiente.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Siguiente: {siguiente.titulo} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/academia/guias"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Terminaste la guía — ver más <ArrowRight className="h-4 w-4" />
            </Link>
          )}
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
