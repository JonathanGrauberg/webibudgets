// app/(public)/campus/guias/[guiaSlug]/[capituloSlug]/page.tsx
//
// Página de un capítulo — layout tipo "docs" con sidebar fija en escritorio
// (mismo patrón que components/help/help-manual.tsx, que ya venía bien) en
// vez de una columna angosta centrada. Los "pasos" usan <details>/<summary>
// nativo: se ven como acordeón pero el contenido queda siempre en el DOM,
// así un buscador lo indexa igual aunque esté colapsado visualmente.
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Instagram, Facebook, ArrowLeft, ArrowRight, Clock, CheckCircle2 } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCapitulo } from '@/lib/guias-data'
import { MarginMatrix } from '@/components/campus/margin-matrix'
import { DiagnosticRanges } from '@/components/campus/diagnostic-ranges'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ guiaSlug: string; capituloSlug: string }>
}): Promise<Metadata> {
  const { guiaSlug, capituloSlug } = await params
  const found = getCapitulo(guiaSlug, capituloSlug)
  if (!found) return { title: 'Capítulo no encontrado | .budgets' }
  const { guia, capitulo } = found
  const primerTexto = capitulo.bloques.find((b) => b.tipo === 'texto')
  return {
    title: `${capitulo.titulo} | ${guia.titulo} — .budgets`,
    description: primerTexto && primerTexto.tipo === 'texto' ? primerTexto.parrafos[0] : guia.descripcionLarga,
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

      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link href={`/campus/guias/${guia.slug}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> {guia.titulo}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[260px_1fr]">
          {/* Sidebar fija — índice de capítulos de la guía */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">En esta guía</p>
            <nav className="mt-3 space-y-1">
              {guia.capitulos.map((c, i) => {
                const isActive = c.slug === capitulo.slug
                return (
                  <Link
                    key={c.slug}
                    href={`/campus/guias/${guia.slug}/${c.slug}`}
                    className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
                      isActive ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                    <span>{c.titulo}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* Contenido — ancho, sin centrar, tipografía más grande */}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Capítulo {index + 1} de {guia.capitulos.length}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{capitulo.titulo}</h1>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> {capitulo.minutosLectura} min de lectura
            </p>

            <div className="mt-10 space-y-12">
              {capitulo.bloques.map((bloque, i) => {
                if (bloque.tipo === 'texto') {
                  return (
                    <section key={i}>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{bloque.numero}</p>
                      <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{bloque.titulo}</h2>
                      <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/90">
                        {bloque.parrafos.map((p, j) => (
                          <p key={j}>{p}</p>
                        ))}
                      </div>
                    </section>
                  )
                }
                if (bloque.tipo === 'matriz') {
                  return (
                    <section key={i}>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{bloque.numero}</p>
                      <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{bloque.titulo}</h2>
                      <MarginMatrix cuadrantes={bloque.cuadrantes} />
                    </section>
                  )
                }
                if (bloque.tipo === 'formula') {
                  return (
                    <section key={i}>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{bloque.numero}</p>
                      <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{bloque.titulo}</h2>
                      {bloque.intro && (
                        <div className="mt-4 space-y-3 text-base leading-relaxed text-foreground/90">
                          {bloque.intro.map((p, j) => (
                            <p key={j}>{p}</p>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 rounded-xl bg-primary/5 px-5 py-4 text-center font-mono text-sm font-semibold text-primary sm:text-base">
                        {bloque.formula}
                      </div>
                      <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/30 px-5 py-4 text-sm text-foreground/90">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ejemplo de aplicación</p>
                        {bloque.ejemplo.map((p, j) => (
                          <p key={j} className={j > 0 ? 'font-mono' : ''}>{p}</p>
                        ))}
                      </div>
                      {bloque.nota && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground/80">Nota técnica: </span>
                          {bloque.nota}
                        </p>
                      )}
                    </section>
                  )
                }
                if (bloque.tipo === 'rangos') {
                  return (
                    <section key={i}>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{bloque.numero}</p>
                      <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{bloque.titulo}</h2>
                      <DiagnosticRanges formula={bloque.formula} rangos={bloque.rangos} />
                    </section>
                  )
                }
                // bloque.tipo === 'pasos'
                return (
                  <section key={i}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{bloque.numero}</p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{bloque.titulo}</h2>
                    <div className="mt-5 space-y-3">
                      {bloque.pasos.map((paso, j) => (
                        <details key={j} className="group overflow-hidden rounded-2xl border border-border open:border-primary/30">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:content-none">
                            <span className="flex items-center gap-3 text-sm font-semibold sm:text-base">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {j + 1}
                              </span>
                              {paso.titulo}
                            </span>
                            <span className="text-muted-foreground transition group-open:rotate-180">▾</span>
                          </summary>
                          <div className="space-y-2.5 border-t border-border px-5 py-4 pl-[3.75rem] text-sm leading-relaxed text-muted-foreground">
                            {paso.contenido.map((p, k) => (
                              <p key={k}>{p}</p>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>

            {capitulo.notaFinal && (
              <p className="mt-12 flex items-center gap-2 border-t border-border pt-6 text-xs italic text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {capitulo.notaFinal}
              </p>
            )}

            {/* Navegación entre capítulos */}
            <div className="mt-12 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
              {anterior ? (
                <Link
                  href={`/campus/guias/${guia.slug}/${anterior.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" /> {anterior.titulo}
                </Link>
              ) : (
                <span />
              )}
              {siguiente ? (
                <Link
                  href={`/campus/guias/${guia.slug}/${siguiente.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Siguiente: {siguiente.titulo} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/campus/guias"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Ver más guías <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
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
