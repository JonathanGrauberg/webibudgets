// app/(public)/pricing/page.tsx
import Link from 'next/link'
import { Check } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/plan'

const plans = [
  { key: 'free',     ...PLAN_LIMITS.free },
  { key: 'starter',  ...PLAN_LIMITS.starter },
  { key: 'team',     ...PLAN_LIMITS.team },
  { key: 'business', ...PLAN_LIMITS.business },
] as const
 
export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav mínimo */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        
          <Link
            href="/"
            className="text-4xl font-black tracking-tighter text-primary leading-none"
          >
            .Budgets
          </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition">
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 transition"
          >
            Registrarse
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Planes y precios
          </p>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Simple y transparente
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Empezá gratis por 14 días. Sin tarjeta de crédito.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-3xl border p-7 flex flex-col ${
                plan.featured
                  ? 'border-foreground bg-foreground text-background shadow-2xl scale-[1.02]'
                  : 'border-border bg-card'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-background text-foreground text-[11px] font-bold px-3 py-1 border border-border shadow-sm">
                    Más popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${plan.featured ? 'text-background/60' : 'text-muted-foreground'}`}>
                  {plan.label}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tight">
                    {plan.key === 'free' ? 'Gratis' : plan.price}
                  </span>
                  {plan.key !== 'free' && (
                    <span className={`text-sm ${plan.featured ? 'text-background/60' : 'text-muted-foreground'}`}>
                      /mes
                    </span>
                  )}
                </div>
                <p className={`mt-2 text-xs leading-relaxed ${plan.featured ? 'text-background/70' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.featured ? 'text-background' : 'text-foreground'}`} />
                    <span className={plan.featured ? 'text-background/90' : 'text-foreground'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.key === 'free' ? '/register' : `/register?plan=${plan.key}`}
                className={`block w-full rounded-full py-3 text-center text-sm font-semibold transition ${
                  plan.featured
                    ? 'bg-background text-foreground hover:opacity-90'
                    : 'bg-foreground text-background hover:opacity-90'
                }`}
              >
                {plan.key === 'free' ? 'Empezar gratis' : `Elegir ${plan.label}`}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ mínimo */}
        <div className="mt-20 max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-center text-foreground">Preguntas frecuentes</h2>

          {[
            {
              q: '¿Necesito tarjeta para el período de prueba?',
              a: 'No. Los 14 días de prueba son completamente gratuitos y no requieren ningún dato de pago.',
            },
            {
              q: '¿Qué pasa cuando termina el trial?',
              a: 'Podés elegir un plan para continuar. Si no elegís ninguno, el acceso queda pausado pero tus datos se conservan.',
            },
            {
              q: '¿Puedo cambiar de plan después?',
              a: 'Sí, podés actualizar tu plan en cualquier momento desde la configuración de tu cuenta.',
            },
            {
              q: '¿Cómo funciona el pago?',
              a: 'Los pagos se procesan de forma segura a través de MercadoPago con renovación mensual automática.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-border pb-6">
              <p className="font-semibold text-foreground mb-2">{q}</p>
              <p className="text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}