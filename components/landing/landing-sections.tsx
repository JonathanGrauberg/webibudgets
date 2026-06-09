import {
  ArrowRight, Check, FileText, Download,
  Users, Package, Palette, Share2,
  Smartphone, Star, ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import {
  brandStats, brandSwatches, features,
  faqs, plans, testimonials,
} from './landing-data'

const icons = { FileText, Download, Users, Package, Palette, Share2 } as const

interface LandingSectionsProps {
  openFaqIndex: number | null
  setOpenFaqIndex: (index: number | null) => void
  dashboardHref: string
  dashboardLabel: string
}

const YELLOW = '#fcc107'

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-sm ${className}`}
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)' }}
    >
      {children}
    </div>
  )
}

function YellowButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-black text-sm transition hover:opacity-90 active:scale-[0.98]"
      style={{ backgroundColor: YELLOW, boxShadow: `0 8px 24px ${YELLOW}35` }}
    >
      {children}
    </Link>
  )
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white/70 border border-white/15 hover:bg-white/8 hover:text-white transition"
    >
      {children}
    </Link>
  )
}

export function LandingSections({
  openFaqIndex,
  setOpenFaqIndex,
  dashboardHref,
  dashboardLabel,
}: LandingSectionsProps) {
  return (
    <main className="overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Orbs */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: `${YELLOW}18` }} />
        <div className="pointer-events-none absolute top-1/2 right-0 w-96 h-96 rounded-full blur-[100px]"
          style={{ background: `${YELLOW}10` }} />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 w-80 h-80 rounded-full blur-[80px] bg-white/5" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.06] text-sm font-medium text-white/70 mb-8 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: YELLOW }} />
            Presentando WebiBudgets Pro
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            <span className="text-white">Presupuestos</span>
            <br />
            <span style={{ color: YELLOW }}>que impresionan.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
            Generá cotizaciones, gestioná clientes y personalizá tu marca — todo en una plataforma. Hecho para empresas de servicios que exigen precisión y estilo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <YellowButton href={dashboardHref}>
              {dashboardLabel === 'Dashboard' ? 'Ir al panel' : 'Empezar gratis'}
              <ArrowRight size={18} />
            </YellowButton>
            <GhostButton href="#pricing">Ver precios</GhostButton>
          </div>

          <p className="text-sm text-white/25 mb-16">
            Sin tarjeta de crédito. 14 días gratis. Cancelá cuando quieras.
          </p>

          {/* Mock dashboard */}
          <GlassCard className="p-6 sm:p-10 text-left">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
              {[...Array(18)].map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full animate-pulse"
                  style={{
                    backgroundColor: i % 3 === 0 ? YELLOW : i % 3 === 1 ? '#ffffff18' : '#ffffff0c',
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: 'Presupuestos', value: '247' },
                { label: 'Clientes', value: '89' },
                { label: 'Facturado', value: '$84K' },
                { label: 'Este mes', value: '+24%' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-black text-white mb-1">{stat.value}</p>
                  <p className="text-xs text-white/40">{stat.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px]"
          style={{ background: `${YELLOW}0c` }} />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Todo lo que necesitás</h2>
            <p className="text-lg text-white/40 max-w-xl mx-auto">
              Funciones diseñadas para negocios modernos que quieren control y flexibilidad.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const Icon = icons[feature.icon as keyof typeof icons]
              return (
                <GlassCard
                  key={i}
                  className="group p-7 hover:border-[#fcc107]/30 transition-all hover:bg-white/[0.08] cursor-default"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition group-hover:scale-110"
                    style={{ backgroundColor: `${YELLOW}18`, border: `1px solid ${YELLOW}30` }}
                  >
                    <Icon size={22} style={{ color: YELLOW }} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{feature.description}</p>
                </GlassCard>
              )
            })}
          </div>

          <GlassCard className="mt-10 p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${YELLOW}18` }}
            >
              <Smartphone size={22} style={{ color: YELLOW }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Panel 100% responsive</h3>
              <p className="text-sm text-white/45">
                Accedé a tus métricas desde cualquier lugar. La interfaz funciona perfecto en escritorio, tablet y móvil con sincronización en tiempo real.
              </p>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute top-1/2 left-0 w-96 h-96 rounded-full blur-[100px]"
          style={{ background: `${YELLOW}08` }} />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Precios simples y transparentes</h2>
            <p className="text-lg text-white/40 max-w-xl mx-auto">
              Elegí el plan ideal para tu negocio. Todos incluyen 14 días de prueba gratis.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-8 transition-all ${
                  plan.featured
                    ? 'border-2 md:scale-105'
                    : 'border border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
                }`}
                style={
                  plan.featured
                    ? {
                        borderColor: YELLOW,
                        background: 'rgba(252,193,7,0.06)',
                        boxShadow: `0 0 40px ${YELLOW}18, inset 0 1px 0 rgba(255,255,255,0.06)`,
                      }
                    : { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }
                }
              >
                {plan.featured && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black text-black"
                    style={{ backgroundColor: YELLOW }}
                  >
                    Más popular
                  </div>
                )}

                <h3 className="text-xl font-black text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-white/40 mb-6">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-white/40 ml-2 text-sm">{plan.period}</span>
                  )}
                </div>

                <Link
                  href={dashboardHref}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm mb-8 transition"
                  style={
                    plan.featured
                      ? { backgroundColor: YELLOW, color: '#000', boxShadow: `0 8px 24px ${YELLOW}35` }
                      : { border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }
                  }
                >
                  {plan.cta}
                  <ArrowRight size={16} />
                </Link>

                <div className="space-y-3 border-t border-white/10 pt-6">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <Check size={16} className="shrink-0 mt-0.5" style={{ color: YELLOW }} />
                      <span className="text-sm text-white/55">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <GlassCard className="mt-10 p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">¿Tenés dudas sobre los precios?</h3>
              <p className="text-sm text-white/40">Nuestro equipo está para ayudarte. Contactanos para cotizaciones personalizadas.</p>
            </div>
            <YellowButton href={dashboardHref}>Contactar ventas</YellowButton>
          </GlassCard>
        </div>
      </section>

      {/* ── BRANDING ── */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Tu marca, tu identidad</h2>
            <p className="text-lg text-white/40 max-w-xl mx-auto">
              Personalizá cada aspecto para que coincida con tu marca. Tus presupuestos siempre van a lucir profesionales.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <GlassCard className="p-6">
                <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-widest text-white/40">Colores de marca</h3>
                <div className="flex gap-3">
                  {brandSwatches.map((color, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-xl border border-white/10 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-widest text-white/40">Subir logo</h3>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-[#fcc107]/30 transition">
                  <FileText size={28} className="mx-auto mb-3 text-white/20" />
                  <p className="text-sm text-white/30 mb-1">Arrastrá tu logo o hacé clic para explorar</p>
                  <p className="text-xs text-white/20">PNG, SVG hasta 5MB</p>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-widest text-white/40">Fuentes personalizadas</h3>
                <div className="space-y-3">
                  {['Fuente de títulos', 'Fuente de cuerpo', 'Fuente de acento'].map((label, i) => (
                    <select
                      key={i}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white/60 text-sm outline-none"
                    >
                      <option>{label}</option>
                      <option>Inter</option>
                      <option>Poppins</option>
                    </select>
                  ))}
                </div>
              </GlassCard>
            </div>

            <div className="space-y-5">
              <GlassCard className="p-8">
                <div
                  className="rounded-xl p-8 mb-6"
                  style={{ background: `linear-gradient(135deg, ${YELLOW}12, transparent)`, border: `1px solid ${YELLOW}20` }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm"
                        style={{ backgroundColor: YELLOW, color: '#000' }}>A</div>
                      <div>
                        <p className="font-bold text-white text-sm">Acme Corp</p>
                        <p className="text-xs text-white/40">acme.com</p>
                      </div>
                    </div>
                    <span className="text-2xl font-black" style={{ color: YELLOW }}>$2.450</span>
                  </div>
                  <div className="space-y-2.5 mb-6 border-t border-white/10 pt-5">
                    {[
                      ['Diseño web', '$1.500'],
                      ['Desarrollo (20hs @ $35/h)', '$700'],
                      ['Gestión de proyecto', '$250'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-white/50">{label}</span>
                        <span className="text-white/70">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 pt-4 flex justify-between font-black">
                    <span className="text-white">Total</span>
                    <span style={{ color: YELLOW }}>$2.450</span>
                  </div>
                </div>
                <YellowButton href={dashboardHref}>
                  Descargar PDF de muestra
                </YellowButton>
              </GlassCard>

              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-5 text-center">
                  <p className="text-3xl font-black" style={{ color: YELLOW }}>20+</p>
                  <p className="text-xs text-white/40 mt-1">Estilos de fuente</p>
                </GlassCard>
                <GlassCard className="p-5 text-center">
                  <p className="text-3xl font-black" style={{ color: YELLOW }}>12+</p>
                  <p className="text-xs text-white/40 mt-1">Plantillas</p>
                </GlassCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute top-1/3 right-0 w-96 h-96 rounded-full blur-[100px]"
          style={{ background: `${YELLOW}08` }} />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Lo que dicen nuestros clientes</h2>
            <p className="text-lg text-white/40 max-w-xl mx-auto">
              Miles de empresas ya simplificaron su proceso de presupuestos con WebiBudgets.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-12">
            {testimonials.map((t, i) => (
              <GlassCard key={i} className="p-7 hover:border-[#fcc107]/20 transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={16} fill={YELLOW} style={{ color: YELLOW }} />
                  ))}
                </div>
                <p className="text-sm text-white/55 leading-relaxed mb-6">{t.content}</p>
                <div className="flex items-center gap-3 pt-5 border-t border-white/8">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-black shrink-0"
                    style={{ backgroundColor: YELLOW }}
                  >
                    {t.image}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-white/35">{t.role} · {t.company}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {brandStats.map((stat, i) => (
              <GlassCard key={i} className="p-8 text-center">
                <p className="text-4xl font-black mb-2" style={{ color: YELLOW }}>{stat.value}</p>
                <p className="text-sm text-white/40">{stat.label}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Preguntas frecuentes</h2>
            <p className="text-lg text-white/40">¿No encontrás lo que buscás? Contactá a nuestro equipo de soporte.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden transition-all"
                style={openFaqIndex === i ? { borderColor: `${YELLOW}40`, background: `${YELLOW}06` } : {}}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.04] transition"
                >
                  <h3 className="font-semibold text-white/80 text-sm pr-4">{faq.question}</h3>
                  <ChevronDown
                    size={18}
                    className="shrink-0 transition-transform text-white/30"
                    style={{
                      transform: openFaqIndex === i ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: openFaqIndex === i ? YELLOW : undefined,
                    }}
                  />
                </button>
                {openFaqIndex === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-white/45 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <GlassCard className="mt-10 p-8">
            <h3 className="text-xl font-black text-white mb-2">¿Seguís con dudas?</h3>
            <p className="text-sm text-white/40 mb-6">
              Nuestro equipo de soporte está disponible las 24hs para ayudarte a sacar el máximo provecho de WebiBudgets.
            </p>
            <YellowButton href={dashboardHref}>Contactar soporte</YellowButton>
          </GlassCard>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-96 rounded-full blur-[120px]"
          style={{ background: `${YELLOW}12` }} />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl font-black text-white mb-6 leading-tight">
            Transformá tu negocio<br />
            <span style={{ color: YELLOW }}>hoy mismo.</span>
          </h2>
          <p className="text-lg text-white/40 mb-10 leading-relaxed">
            Sumate a miles de empresas que simplificaron sus presupuestos y ahorran horas cada semana. Empezá tu prueba gratis de 14 días — sin tarjeta de crédito.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <YellowButton href={dashboardHref}>
              Empezar gratis
              <ArrowRight size={18} />
            </YellowButton>
            <GhostButton href="#pricing">Ver planes</GhostButton>
          </div>

          <p className="text-sm text-white/25">
            Sin tarjeta de crédito · 14 días gratis · Cancelá cuando quieras
          </p>

          <div className="mt-16 pt-10 border-t border-white/8">
            <p className="text-xs text-white/20 mb-6 uppercase tracking-widest">Empresas que confían en nosotros</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-30">
              {['TechStartup', 'DesignCo', 'BuildPro', 'ServiceMax', 'CreativeHub'].map((c) => (
                <span key={c} className="text-sm font-bold text-white">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-black"
                  style={{ backgroundColor: YELLOW }}
                >W</div>
                <span className="font-bold text-white">Webi<span style={{ color: YELLOW }}>Budgets</span></span>
              </div>
              <p className="text-sm text-white/30">Presupuestos inteligentes para negocios modernos.</p>
            </div>
            {[
              { title: 'Producto', links: [['Funciones', '#features'], ['Precios', '#pricing'], ['Seguridad', '#faq']] },
              { title: 'Empresa', links: [['Blog', '#'], ['Nosotros', '#'], ['Contacto', '#']] },
              { title: 'Legal', links: [['Privacidad', '#'], ['Términos', '#']] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold text-white/60 text-xs uppercase tracking-widest mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-sm text-white/30 hover:text-white transition">{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/20">© 2024 WebiBudgets. Todos los derechos reservados.</p>
            <p className="text-xs text-white/20">Hecho con precisión por <span style={{ color: YELLOW }}>Webi Studio</span></p>
          </div>
        </div>
      </footer>
    </main>
  )
}