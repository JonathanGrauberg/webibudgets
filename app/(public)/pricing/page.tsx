// app/(public)/pricing/page.tsx 
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth' 
import PricingCards from './PricingCards'
import { ArrowLeft } from 'lucide-react'

export default async function PricingPage() {
  const session = await getServerSession(authOptions).catch(() => null)
  
  // Extraemos el plan actual desde la sesión. 
  // (Asumo que tu objeto session.user contiene el plan o tenantPlan, adaptalo si se llama distinto, ej: session.user.plan)
  const currentPlan = session?.user?.plan || null

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
          {session ? (
            // Si viene desde adentro del sistema, un botón elegante de volver atrás
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-zinc-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 transition"
              >
                Registrarse
              </Link>
            </>
          )}
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
            {session 
              ? 'Mejorá tu plan en cualquier momento para expandir los límites de tu equipo.'
              : 'Empezá gratis por 14 días. Sin tarjeta de crédito.'
            }
          </p>
        </div>

        {/* Pasamos el plan actual como prop a las tarjetas cliente */}
        <PricingCards currentPlan={currentPlan} />

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