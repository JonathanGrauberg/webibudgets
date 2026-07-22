'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  ClipboardList,
  Receipt,
  FileCheck2,
  CheckCircle2,
  MapPin,
  Wrench,
  PackageCheck,
  UserCheck
} from 'lucide-react'

export function LandingWorkflowBento() {
  const [activeDoc, setActiveDoc] = useState<'ot' | 'remito' | 'recibo'>('ot')

  return (
    <section className="px-4 py-4 sm:px-6 lg:px-8">
      {/* Contenedor Oscuro Bento (max-w-7xl) */}
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-neutral-800 bg-neutral-950 p-8 sm:p-10 lg:p-12 shadow-2xl text-white">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          
          {/* Columna Izquierda: Copy + CTA */}
          <div className="space-y-5 lg:col-span-5">
            <span 
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-neutral-950"
              style={{ backgroundColor: '#fcc107' }}
            >
              <Sparkles className="h-3.5 w-3.5 text-neutral-950" />
              ECOSISTEMA INTEGRADO
            </span>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl leading-[1.15] text-white">
                Un presupuesto. <br />
                <span style={{ color: '#fcc107' }}>Cero doble carga.</span>
              </h2>
              <p className="text-sm font-normal leading-relaxed text-neutral-400">
                Aprobás la cotización y generás en 1 clic la **Orden de Trabajo** (con materiales autocompletados, personal, ubicación y checklist), el **Remito** o el **Recibo**. 
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold text-neutral-950 transition-all hover:bg-neutral-200"
              >
                Probar flujo de trabajo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-2 text-[11px] text-neutral-500">
                Ahorrá horas de oficina organizando la ejecución y la entrega.
              </p>
            </div>
          </div>

          {/* Columna Derecha: Widget Interactivo de Conversión de Documento */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-inner">
              
              {/* Título + Status */}
              <div className="mb-4 flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-xs font-bold text-neutral-400">
                  Presupuesto <span className="text-white">#000003</span> (Aprobado)
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" />
                  Datos precargados
                </span>
              </div>

              {/* Tabs de Documentos Derivados */}
              <div className="grid grid-cols-3 gap-1.5 mb-4 p-1 rounded-xl bg-neutral-950 border border-neutral-800">
                <button
                  onClick={() => setActiveDoc('ot')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                    activeDoc === 'ot'
                      ? 'text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  style={activeDoc === 'ot' ? { backgroundColor: '#fcc107' } : undefined}
                >
                  <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Orden de Trabajo</span>
                </button>

                <button
                  onClick={() => setActiveDoc('remito')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                    activeDoc === 'remito'
                      ? 'text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  style={activeDoc === 'remito' ? { backgroundColor: '#fcc107' } : undefined}
                >
                  <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Remito</span>
                </button>

                <button
                  onClick={() => setActiveDoc('recibo')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                    activeDoc === 'recibo'
                      ? 'text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  style={activeDoc === 'recibo' ? { backgroundColor: '#fcc107' } : undefined}
                >
                  <Receipt className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Recibo</span>
                </button>
              </div>

              {/* Previsualizador de lo que genera el sistema */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3 min-h-[220px]">
                {activeDoc === 'ot' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white">Nueva Orden de Trabajo — Inst. Cartelería</p>
                      <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-emerald-400" /> Asignado: Marcos
                      </span>
                    </div>

                    {/* Materiales Autocompletados */}
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-2.5">
                      <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                        Materiales a llevar (Autocompletados del presupuesto)
                      </span>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-neutral-300 font-medium">
                          <span>• Cartel Lona Lona Front</span>
                          <span style={{ color: '#fcc107' }}>5,63 m²</span>
                        </div>
                        <div className="flex justify-between text-xs text-neutral-300 font-medium">
                          <span>• Perfilería e Imperial Alpaca</span>
                          <span style={{ color: '#fcc107' }}>1 unidad</span>
                        </div>
                      </div>
                    </div>

                    {/* Extras de la OT */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400">
                      <div className="flex items-center gap-1.5 rounded-md bg-neutral-900 p-2 border border-neutral-800">
                        <MapPin className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        <span className="truncate">Ubicación Google Maps</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-md bg-neutral-900 p-2 border border-neutral-800">
                        <Wrench className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">Herramientas & Checklist</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDoc === 'remito' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white">Remito Oficial de Entrega</p>
                      <span className="text-[10px] text-neutral-400">Listo para firma</span>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-2.5 space-y-1.5">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase">Detalle de mercadería/obra</p>
                      <p className="text-xs text-neutral-300">• Cartel Lona Impreso (5.63 m²)</p>
                      <p className="text-xs text-neutral-300">• Estructura de perfilería de montaje</p>
                    </div>
                    <p className="text-[11px] text-neutral-400 italic">
                      Se emite en PDF listo para que el cliente firme el conforme de recepción en obra.
                    </p>
                  </div>
                )}

                {activeDoc === 'recibo' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white">Comprobante de Pago / Recibo</p>
                      <span className="text-[10px] text-emerald-400 font-bold">$ 30.600,00</span>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-2.5 space-y-1">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase">Concepto</p>
                      <p className="text-xs text-neutral-300">Anticipo 50% — Presupuesto #000003</p>
                    </div>
                    <p className="text-[11px] text-neutral-400 italic">
                      Mantiene el historial de saldos pendientes y pagos parciales vinculados al cliente.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}