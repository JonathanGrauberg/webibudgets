'use client'

import Link from 'next/link'
import { Wallet, ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react'

export function LandingPaymentsBento() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-black/5 bg-gradient-to-br from-neutral-50 via-white to-neutral-100/80 p-8 sm:p-10 lg:p-12 shadow-sm dark:border-white/10 dark:from-neutral-900 dark:to-neutral-950">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Columna Izquierda: Copy + CTA */}
          <div className="space-y-5 lg:col-span-5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(90deg, #00b1ea, #0038ff)' }}
            >
              <Wallet className="h-3.5 w-3.5" />
              NUEVO — COBRO ONLINE
            </span>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl dark:text-white leading-[1.15]">
                Cobrá tus presupuestos <br />
                <span style={{ color: '#0038ff' }}>con Mercado Pago.</span>
              </h2>
              <p className="text-sm font-normal leading-relaxed text-neutral-600 dark:text-neutral-400">
                Armá el presupuesto, mandalo por WhatsApp y que tu cliente pague la seña o el total desde el celular, sin crear cuenta ni descargar nada. El dinero llega directo a tu cuenta de Mercado Pago — nunca pasa por nosotros.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-xs font-bold text-white transition-all hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Empezá a cobrar online
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-2 text-[11px] text-neutral-400">
                Disponible en el plan Free (con una comisión mínima) — sin comisión en PRO.
              </p>
            </div>
          </div>

          {/* Columna Derecha: mock del portal de pago */}
          <div className="lg:col-span-7">
            <div className="mx-auto max-w-sm rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <div>
                  <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Presupuesto #000042</p>
                  <p className="text-[11px] text-neutral-400">Tu Negocio SRL</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-medium text-amber-700">
                  Pendiente
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Total</span>
                <span className="font-bold text-neutral-900 dark:text-white">$150.000</span>
              </div>

              <button
                type="button"
                disabled
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: '#0038ff' }}
              >
                <Wallet className="h-4 w-4" />
                Pagar seña ($75.000) con Mercado Pago
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                El dinero llega directo a tu cuenta
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <MessageCircle className="h-3.5 w-3.5" />
                Se manda directo por WhatsApp
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
