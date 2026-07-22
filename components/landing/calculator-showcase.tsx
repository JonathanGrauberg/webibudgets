'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BudgetItemCalculator } from '@/components/budget/budget-item-calculator'
import { Maximize2, Clock, Droplets, Ruler, ArrowRight, Sparkles } from 'lucide-react'

const DEMO_TABS = [
  {
    id: 'm²',
    label: 'Superficie',
    sub: 'm²',
    icon: Maximize2,
    unitPrice: 8500,
    defaultWidth: 240,
    defaultHeight: 150,
  },
  {
    id: 'hr',
    label: 'Horas',
    sub: 'hr',
    icon: Clock,
    unitPrice: 12000,
    defaultHours: 3.5,
  },
  {
    id: 'm³',
    label: 'Volumen',
    sub: 'm³',
    icon: Droplets,
    unitPrice: 24000,
    defaultWidth: 100,
    defaultHeight: 100,
    defaultDepth: 200,
  },
  {
    id: 'm',
    label: 'Longitud',
    sub: 'm',
    icon: Ruler,
    unitPrice: 4500,
    defaultDirect: 12,
  },
]

export function LandingCalculatorBento() {
  const [activeTab, setActiveTab] = useState(DEMO_TABS[0])
  const [widthCm, setWidthCm] = useState<number | null>(240)
  const [heightCm, setHeightCm] = useState<number | null>(150)
  const [depthCm, setDepthCm] = useState<number | null>(null)
  const [direct, setDirect] = useState<number | null>(null)
  const [hours, setHours] = useState<number | null>(null)
  const [, setQuantity] = useState<number>(3.6)

  const handleTabChange = (tab: (typeof DEMO_TABS)[0]) => {
    setActiveTab(tab)
    setWidthCm(tab.defaultWidth ?? null)
    setHeightCm(tab.defaultHeight ?? null)
    setDepthCm(tab.defaultDepth ?? null)
    setDirect(tab.defaultDirect ?? null)
    setHours(tab.defaultHours ?? null)
  }

  const handleChange = (field: string, val: number | null) => {
    if (field === 'widthCm') setWidthCm(val)
    if (field === 'heightCm') setHeightCm(val)
    if (field === 'depthCm') setDepthCm(val)
    if (field === 'direct') setDirect(val)
    if (field === 'hours') setHours(val)
  }

  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      {/* Contenedor alineado a la grilla global (max-w-7xl) */}
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-black/5 bg-gradient-to-br from-neutral-50 via-white to-neutral-100/80 p-8 sm:p-10 lg:p-12 shadow-sm dark:border-white/10 dark:from-neutral-900 dark:to-neutral-950">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          
          {/* Columna Izquierda: Copy + CTA Negro */}
          <div className="space-y-5 lg:col-span-5">
            <span 
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-neutral-900"
              style={{ backgroundColor: '#fcc10720' }}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: '#fcc107' }} />
              CÁLCULO AUTOMÁTICO
            </span>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl dark:text-white leading-[1.15]">
                Chau planillas <br />
                <span style={{ color: '#fcc107' }}>auxiliares.</span>
              </h2>
              <p className="text-sm font-normal leading-relaxed text-neutral-600 dark:text-neutral-400">
                Ingresá medidas o tiempos y .budgets calcula superficies, volúmenes e importes exactos en tiempo real.
              </p>
            </div>

            <div className="pt-2">
              {/* Botón negro elegante */}
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-xs font-bold text-white transition-all hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Probá .budgets gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-2 text-[11px] text-neutral-400">
                Guardá este cálculo en un PDF con tu marca en 2 clics.
              </p>
            </div>
          </div>

          {/* Columna Derecha: Widget Interactivo */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
              
              {/* Selector de Unidades en color #fcc107 */}
              <div className="mb-4 grid grid-cols-4 gap-1.5 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
                {DEMO_TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab.id === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs transition-all ${
                        isActive
                          ? 'font-bold text-neutral-950 shadow-sm'
                          : 'font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                      }`}
                      style={isActive ? { backgroundColor: '#fcc107' } : undefined}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Calculadora */}
              <div className="rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-2 dark:border-neutral-800 dark:bg-neutral-950/50">
                <BudgetItemCalculator
                  unit={activeTab.id}
                  unitPrice={activeTab.unitPrice}
                  currency="ARS"
                  widthCm={widthCm}
                  heightCm={heightCm}
                  depthCm={depthCm}
                  direct={direct}
                  hours={hours}
                  onChange={handleChange}
                  onQuantityChange={setQuantity}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}