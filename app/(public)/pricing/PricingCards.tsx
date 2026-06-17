//app\(public)\pricing\PricingCards.tsx
'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Check } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/plan'

const plans = [
  { key: 'starter', ...PLAN_LIMITS.starter },
  { key: 'team', ...PLAN_LIMITS.team },
  { key: 'business', ...PLAN_LIMITS.business },
] as const

export default function PricingCards() {
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
      {plans.map((plan) => (
        <div
          key={plan.key}
          className={`relative rounded-3xl border p-7 flex flex-col ${
            plan.featured
              ? 'border-foreground bg-foreground text-background shadow-2xl scale-[1.02]'
              : 'border-border bg-card'
          }`}
        >
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

          {session ? (
            <button
              onClick={() => handleCheckout(plan.key)}
              className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white"
            >
              Elegir {plan.label}
            </button>
          ) : (
            <Link
              href={`/register?plan=${plan.key}`}
              className="block w-full rounded-full bg-primary px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Elegir {plan.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}