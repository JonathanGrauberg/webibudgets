'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, DollarSign, Users, PieChart, UserCheck } from 'lucide-react'

interface PartnerSplit {
  id: string
  name: string
  role: string
  percentage: number
}

export function LandingProfitSplitBento() {
  const [totalSale, setTotalSale] = useState(1000000)
  const [costs, setCosts] = useState(500000)

  // Lista de integrantes/vendedores con sus porcentajes por defecto
  const [partners, setPartners] = useState<PartnerSplit[]>([
    { id: '1', name: 'Juan Pérez', role: 'vendedor', percentage: 40 },
    { id: '2', name: 'Melina Rodriguez', role: 'vendedor', percentage: 35 },
    { id: '3', name: 'Sergio Aquino', role: 'admin', percentage: 25 },
  ])

  const netProfit = Math.max(0, totalSale - costs)

  // Modificar porcentaje de un integrante
  const handlePercentageChange = (id: string, newPercentage: number) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, percentage: Math.max(0, Math.min(100, newPercentage)) } : p))
    )
  }

  // Suma total de porcentajes para control/alerta visual
  const totalPercentage = partners.reduce((acc, p) => acc + p.percentage, 0)

  return (
    <section className="px-4 py-4 sm:px-6 lg:px-8">
      {/* Contenedor Oscuro (Dark Bento) */}
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-neutral-800 bg-neutral-950 p-8 sm:p-10 lg:p-12 shadow-2xl text-white">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          
          {/* Columna Izquierda: Copy */}
          <div className="space-y-5 lg:col-span-5">
            <span 
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-neutral-950"
              style={{ backgroundColor: '#fcc107' }}
            >
              <Sparkles className="h-3.5 w-3.5 text-neutral-950" />
              FINANZAS Y REPARTIJA
            </span>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl leading-[1.15] text-white">
                Rendición clara. <br />
                <span style={{ color: '#fcc107' }}>Cuentas transparentes.</span>
              </h2>
              <p className="text-sm font-normal leading-relaxed text-neutral-400">
                Descontá costos de materiales o fletes y asigná porcentajes específicos a cada socio o vendedor. Transparencia total en cada presupuesto.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold text-neutral-950 transition-all hover:bg-neutral-200"
              >
                Probar reparto automático
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-2 text-[11px] text-neutral-500">
                Calculá las comisiones y participaciones sin hojas de cálculo manuales.
              </p>
            </div>
          </div>

          {/* Columna Derecha: Widget Interactivo de Reparto */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-inner">
              
              <div className="mb-4 flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-300">
                    Simulador de Rendición & Distribución
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">Presupuesto N° 000007</span>
              </div>

              {/* Controles del presupuesto y ganancia */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Presupuesto ($)</label>
                  <input
                    type="number"
                    value={totalSale}
                    onChange={(e) => setTotalSale(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Costos Directos ($)</label>
                  <input
                    type="number"
                    value={costs}
                    onChange={(e) => setCosts(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-2 flex flex-col justify-center">
                  <span className="text-[10px] font-medium text-neutral-400">Ganancia Neta a Repartir</span>
                  <span className="text-sm font-extrabold text-emerald-400">
                    ${netProfit.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Lista de Integrantes y Repartija */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 font-semibold">
                  <span>Integrante</span>
                  <span>% Porcentaje / Monto</span>
                </div>

                {partners.map((partner) => {
                  const partnerAmount = (netProfit * partner.percentage) / 100

                  return (
                    <div 
                      key={partner.id} 
                      className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-2.5 transition-all hover:border-neutral-700"
                    >
                      {/* Info Integrante */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="rounded-full bg-neutral-800 p-1.5 text-neutral-400">
                          <UserCheck className="h-3.5 w-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-white truncate">{partner.name}</p>
                          <span className="inline-block rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] font-medium text-neutral-400 uppercase tracking-wider">
                            {partner.role}
                          </span>
                        </div>
                      </div>

                      {/* Control de Porcentaje y Resultado */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1">
                          <input
                            type="number"
                            value={partner.percentage}
                            onChange={(e) => handlePercentageChange(partner.id, Number(e.target.value))}
                            className="w-8 bg-transparent text-right text-xs font-bold text-white focus:outline-none"
                          />
                          <span className="text-xs text-neutral-500">%</span>
                        </div>

                        <div className="w-24 text-right">
                          <span className="text-xs font-extrabold" style={{ color: '#fcc107' }}>
                            ${partnerAmount.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer del widget con indicador de porcentaje total */}
              <div className="flex items-center justify-between border-t border-neutral-800/60 pt-2 text-[11px]">
                <span className="text-neutral-500">Distribución asignada:</span>
                <span className={`font-bold ${totalPercentage === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {totalPercentage}% {totalPercentage !== 100 && '(Ajustá los porcentajes)'}
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}