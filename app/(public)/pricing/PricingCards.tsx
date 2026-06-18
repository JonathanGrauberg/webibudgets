//app\(public)\pricing\PricingCards.tsx 
'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Check, Star } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/plan'

const plans = [
  { key: 'starter', ...PLAN_LIMITS.starter },
  { key: 'team', ...PLAN_LIMITS.team },
  { key: 'business', ...PLAN_LIMITS.business },
] as const

interface PricingCardsProps {
  currentPlan: string | null
}

export default function PricingCards({ currentPlan }: PricingCardsProps) {
  const { data: session } = useSession()

  async function handleCheckout(plan: string) {
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Error al iniciar checkout')
        return
      }

      window.location.href = data.checkoutUrl
    } catch (err) {
      console.error(err)
      alert('Error al conectar con MercadoPago')
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => {
        // ¿Es este el plan que el cliente ya tiene contratado?
        const isCurrentActive = currentPlan === plan.key

        return (
          <div
            key={plan.key}
            className={`relative rounded-3xl border p-7 flex flex-col transition-all duration-300 ${
              isCurrentActive
                ? 'border-indigo-600 bg-zinc-50/50 ring-2 ring-indigo-600/20 shadow-lg' 
                : plan.featured
                ? 'border-foreground bg-foreground text-background shadow-2xl scale-[1.02]'
                : 'border-border bg-card'
            }`}
          >
            {/* Badge de Plan Actual flotando */}
            {isCurrentActive && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1 shadow-sm">
                <Star className="h-3 w-3 fill-white" /> Plan Actual
              </span>
            )}

            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest">
                {plan.label}
              </p>

              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-black">
                  {plan.price}
                </span>
                <span className="text-sm">/mes</span>
              </div>

              <p className="mt-2 text-sm opacity-80">
                {plan.description}
              </p>
            </div>

            <ul className="space-y-2 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm">
                  <Check className="h-4 w-4 mt-0.5 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Renderizado de botón inteligente según contexto del usuario */}
            {isCurrentActive ? (
              <button
                disabled
                className="w-full rounded-full bg-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-500 cursor-not-allowed"
              >
                Tu Plan Actual
              </button>
            ) : session ? (
              <button
                onClick={() => handleCheckout(plan.key)}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold transition hover:opacity-90 ${
                  plan.featured 
                    ? 'bg-background text-foreground' 
                    : 'bg-primary text-white'
                }`}
              >
                Elegir {plan.label}
              </button>
            ) : (
              <Link
                href={`/register?plan=${plan.key}`}
                className={`block w-full rounded-full px-4 py-3 text-center text-sm font-semibold transition hover:opacity-90 ${
                  plan.featured 
                    ? 'bg-background text-foreground' 
                    : 'bg-primary text-white'
                }`}
              >
                Elegir {plan.label}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}