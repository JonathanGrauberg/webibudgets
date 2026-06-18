// app/(public)/pricing/page.tsx
import Link from 'next/link'
import { getServerSession } from 'next-auth' // 👈 Importamos la sesión del lado del servidor
import { authOptions } from '@/lib/auth' // Adjustá esta ruta según dónde tengas tus authOptions
import { PLAN_LIMITS } from '@/lib/plan'
import PricingCards from './PricingCards'

export default async function PricingPage() {
  // Obtenemos la sesión en el servidor de forma ultra veloz
  const session = await getServerSession(authOptions).catch(() => null)

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
            // Si el usuario ya está logueado, le mostramos un acceso directo a su panel
            <Link 
              href="/dashboard" 
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
            >
              Ir al Dashboard →
            </Link>
          ) : (
            // Si es un visitante anónimo, ve el flujo clásico
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
            Empezá gratis por 14 días. Sin tarjeta de crédito.
          </p>
        </div>

        {/* Cards */}
        <PricingCards />

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