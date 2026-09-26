// app/(public)/que-es/page.tsx
//
// Página pública "Qué es y qué hace .budgets" — versión en HTML del PDF
// descargable (public/budgets-que-es-y-que-hace.pdf), pensada para que
// tanto Google como los buscadores/asistentes con IA puedan leerla e
// indexarla: el PDF por sí solo no es lo que mejor rastrean, el texto
// plano y estructurado de esta página sí. Mismo contenido en lib/que-es-data.ts.
import type { Metadata } from 'next'
import Link from 'next/link'
import { Instagram, Facebook, Download, CheckCircle2, XCircle } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { QUE_ES_SECCIONES, PLAN_FEATURES } from '@/lib/que-es-data'

export const metadata: Metadata = {
  title: 'Qué es y qué hace .budgets | Gestión para PyMEs y profesionales',
  description:
    '.budgets es un sistema de gestión comercial para profesionales independientes y negocios que cotizan y venden: presupuestos, clientes, stock, documentos, cobros online y recurrentes, gastos, equipo y reparto de ganancias. Guía completa de todos los módulos, con la diferencia entre el plan gratuito y PRO.',
}

export default async function QueEsPage() {
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
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Qué es</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Un sistema de gestión hecho para quien cotiza y vende — solo o en equipo
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/90">
          .budgets es un sistema de gestión comercial pensado para profesionales independientes y negocios
          que arman presupuestos y venden productos o servicios: cotizás, hacés seguimiento del cliente,
          generás la documentación (recibos, remitos y, si además manejás trabajo en campo, órdenes de
          trabajo), cobrás online o en efectivo/transferencia, controlás tu stock si lo necesitás,
          organizás al equipo y sabés cuánto ganaste realmente en cada trabajo — todo desde un solo lugar,
          sin instalar nada: funciona desde el navegador, en la computadora o el celular.
        </p>

        <div className="mt-6 max-w-3xl rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <p className="font-bold">¿Esto termina siendo un ERP?</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            En el sentido estricto, no: no lleva contabilidad de partida doble, no maneja producción/BOM ni
            liquidación de sueldos. Pero sí cubre, de punta a punta, todo el circuito comercial de un negocio
            chico o mediano — cotización, stock, documentación, cobros, gastos, equipo y reparto de ganancias —
            que es justamente la parte de un ERP que este tipo de negocios usa en el día a día. Es correcto
            pensarlo como un <strong>sistema de gestión comercial</strong>, y bastante gente lo llama,
            informalmente, un <strong>&quot;mini-ERP&quot;</strong> para PyMEs.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href="/budgets-que-es-y-que-hace.pdf"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Download className="h-4 w-4" /> Descargar en PDF
          </a>
          <span className="text-xs text-muted-foreground">Mismo contenido de esta página, para guardar o compartir.</span>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
          {/* Sidebar fija — índice de módulos */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Módulos</p>
            <nav className="mt-3 space-y-1">
              {QUE_ES_SECCIONES.map((s) => (
                <a
                  key={s.slug}
                  href={`#${s.slug}`}
                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {s.titulo}
                </a>
              ))}
              <a
                href="#planes"
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-muted"
              >
                Planes: Free y PRO
              </a>
            </nav>
          </aside>

          {/* Contenido */}
          <div className="min-w-0 space-y-14">
            {QUE_ES_SECCIONES.map((seccion) => (
              <section key={seccion.slug} id={seccion.slug} className="scroll-mt-24">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{seccion.kicker}</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{seccion.titulo}</h2>
                <p className="mt-2 text-muted-foreground">{seccion.subtitulo}</p>

                <div className="mt-6 space-y-8">
                  {seccion.bloques.map((bloque, i) => (
                    <div key={i}>
                      <h3 className="text-lg font-semibold">{bloque.titulo}</h3>
                      <p className="mt-1 text-sm italic text-muted-foreground">{bloque.desc}</p>
                      <ul className="mt-3 space-y-2">
                        {bloque.items.map((item, j) => (
                          <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {bloque.proItems && bloque.proItems.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {bloque.proItems.map((item, j) => (
                            <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
                              <span className="mt-0.5 shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                                PRO
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Campus — contenido extra, no es un módulo del sistema */}
            <section id="campus-extra" className="scroll-mt-24">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contenido extra</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Campus .budgets</h2>
              <p className="mt-2 text-muted-foreground">No es un módulo del sistema, es contenido educativo gratuito para cualquiera.</p>
              <ul className="mt-6 space-y-2">
                <li className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>
                    <Link href="/campus/glosario" className="font-medium text-primary hover:underline">Glosario PyME</Link>: términos de gestión y de facturación explicados sin vueltas.
                  </span>
                </li>
                <li className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>
                    <Link href="/campus/guias" className="font-medium text-primary hover:underline">Guías prácticas</Link> con capítulos, sobre estrategia comercial, costos y cotizaciones.
                  </span>
                </li>
              </ul>
            </section>

            {/* Planes */}
            <section id="planes" className="scroll-mt-24">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Free y PRO</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Planes</h2>
              <p className="mt-2 text-muted-foreground">Arrancás gratis y sin límite de presupuestos; el plan PRO suma potencia, no volumen.</p>

              <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-foreground text-background">
                      <th className="px-4 py-3 text-left font-semibold">&nbsp;</th>
                      <th className="px-4 py-3 text-center font-semibold">Free</th>
                      <th className="px-4 py-3 text-center font-semibold">PRO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PLAN_FEATURES.map((row, i) => (
                      <tr key={row.label} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/40'}>
                        <td className="px-4 py-3 text-foreground/90">{row.label}</td>
                        <td className="px-4 py-3 text-center">
                          {row.free ? <CheckCircle2 className="mx-auto h-4 w-4 text-primary" /> : <XCircle className="mx-auto h-4 w-4 text-muted-foreground/40" />}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.pro ? <CheckCircle2 className="mx-auto h-4 w-4 text-primary" /> : <XCircle className="mx-auto h-4 w-4 text-muted-foreground/40" />}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50 font-semibold">
                      <td className="px-4 py-3">Precio</td>
                      <td className="px-4 py-3 text-center">$0</td>
                      <td className="px-4 py-3 text-center">
                        $40.000/mes
                        <br />
                        <span className="text-xs font-normal">($36.000/mes facturado anual)</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Si tenés un código de descuento de un revendedor autorizado, sumás un 10% extra sobre el precio de PRO. Más detalles en{' '}
                <Link href="/pricing" className="font-medium text-primary hover:underline">Precios</Link>.
              </p>

              <div className="mt-8">
                <Link
                  href="/register?plan=free"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90"
                >
                  Empezar gratis
                </Link>
              </div>
            </section>
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
