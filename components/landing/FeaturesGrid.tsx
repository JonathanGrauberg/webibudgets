'use client'

import {
  Calculator,
  TrendingUp,
  Palette,
  Coins,
  Boxes,
  Layers,
  Sparkles,
  ArrowUpRight,
  PieChart
} from 'lucide-react'

const FEATURES = [
  // 1. Arriba Izquierda (Negro Span 2)
  {
    icon: Layers,
    badge: 'ECOSISTEMA INTEGRADO',
    title: 'Operación 360° en un solo flujo',
    description:
      'Aprobás el presupuesto y generás la Orden de Trabajo con los materiales autocompletados para el taller, el Remito de entrega y el Recibo final. Todo conectado sin reingresar datos.',
    featured: true,
  },
  // 2. Arriba Derecha
  {
    icon: TrendingUp,
    badge: 'MÉTRICAS & RENTABILIDAD',
    title: 'Control total de margen y ganancia real',
    description:
      'Métricas claras de rendimiento. Mantené visibilidad precisa de los costos de materiales, horas trabajadas y el beneficio neto de cada trabajo.',
    featured: false,
  },
  // 3. Medio Izquierda
  {
    icon: Calculator,
    badge: 'MOTOR DE CÁLCULO',
    title: 'Calculadora por m², m³ o fórmulas a medida',
    description:
      'Olvidate de las planillas complejas. Ingresá medidas, horas o cantidades y el sistema calcula costos, desperdicios y precios finales en tiempo real.',
    featured: false,
  },
  // 4. Medio Centro
  {
    icon: Palette,
    badge: 'BRANDING PRO',
    title: 'PDFs impecables con tu identidad',
    description:
      'Personalizá tu logo, colores corporativos y marca de agua. Emití presupuestos en PDF con estética profesional, listos para enviar por WhatsApp en 2 clics.',
    featured: false,
  },
  // 5. Medio Derecha (Cambiado: Multimoneda amplio)
  {
    icon: Coins,
    badge: 'MULTIMONEDA',
    title: 'Soporte Multimoneda Regional',
    description:
      'Cotizá en ARS, USD, EUR, BOB, COP, PEN, CLP, MXN, VES y más. Actualizá cotizaciones o precios de lista sin desarmar la estructura de tus cálculos.',
    featured: false,
  },
  // 6. Abajo Izquierda
  {
    icon: Boxes,
    badge: 'CATÁLOGO BASE',
    title: 'Insumos y servicios recurrentes',
    description:
      'Guardá tus materiales habituales, mano de obra y costos fijos para sumarlos a cualquier cotización en un segundo.',
    featured: false,
  },
  // 7. Abajo Derecha (El nuevo bloque Negro con Span 2 y el Donut Chart)
  {
    icon: PieChart,
    badge: 'BUSINESS INTELLIGENCE',
    title: 'Rendiciones & Estado Comercial',
    description:
      'Control en tiempo real del ratio de conversión, efectividad comercial y distribución por estados. Sabé exactamente cuánto se gana y cómo se reparten los beneficios.',
    featured: true,
    isDashboardCard: true, // Flag para saber dónde renderizar el widget visual
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Encabezado */}
        <div className="mb-12 text-center">
          <span 
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-neutral-950 mb-3"
            style={{ backgroundColor: '#fcc107' }}
          >
            <Sparkles className="h-3.5 w-3.5 text-neutral-950" />
            POTENCIA SIN COMPLICACIONES
          </span>
          
          <h2 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Diseñado para la realidad de tu empresa
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm sm:text-base text-muted-foreground">
            Herramientas precisas de cálculo, control de rentabilidad y documentos automáticos para que te enfoques en ejecutar.
          </p>
        </div>

        {/* Grilla principal */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon
            
            return (
              <div
                key={i}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] border p-7 transition-all duration-300 hover:shadow-xl ${
                  feat.featured 
                    ? 'md:col-span-2 lg:col-span-2 bg-neutral-950 text-white border-neutral-800' 
                    : 'border-border bg-card hover:border-neutral-400 dark:hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className={feat.isDashboardCard ? 'grid grid-cols-1 md:grid-cols-12 gap-6 items-center' : ''}>
                    
                    {/* Columna de Texto */}
                    <div className={feat.isDashboardCard ? 'md:col-span-7 space-y-2' : ''}>
                      <div className="mb-6 flex items-center justify-between">
                        <div 
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
                            feat.featured 
                              ? 'bg-amber-400/10 border border-amber-400/20' 
                              : 'bg-neutral-100 dark:bg-neutral-800'
                          }`}
                        >
                          <Icon className="h-6 w-6" style={{ color: '#fcc107' }} />
                        </div>

                        <span 
                          className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md ${
                            feat.featured 
                              ? 'bg-white/10 text-amber-300 border border-white/10' 
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {feat.badge}
                        </span>
                      </div>

                      <h3 className={`mb-2 text-xl font-extrabold tracking-tight ${feat.featured ? 'text-white text-2xl' : 'text-card-foreground'}`}>
                        {feat.title}
                      </h3>
                      
                      <p className={`text-xs sm:text-sm leading-relaxed ${feat.featured ? 'text-neutral-300' : 'text-muted-foreground'}`}>
                        {feat.description}
                      </p>
                    </div>

                    {/* Widget Donut Chart para el bloque de abajo */}
                    {feat.isDashboardCard && (
                      <div className="md:col-span-5 flex flex-col items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 shadow-inner">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                          Distribución por Estados
                        </p>
                        
                        <div className="flex items-center justify-center gap-4">
                          <div className="relative h-16 w-16 flex items-center justify-center">
                            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-neutral-800"
                                strokeWidth="4"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                style={{ stroke: '#fcc107' }}
                                strokeWidth="4"
                                strokeDasharray="10, 100"
                                strokeLinecap="round"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-neutral-500"
                                strokeWidth="4"
                                strokeDasharray="40, 100"
                                strokeDashoffset="-15"
                                strokeLinecap="round"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute text-center">
                              <span className="text-xs font-extrabold text-white">10%</span>
                            </div>
                          </div>

                          <div className="space-y-1 text-[10px]">
                            <div className="flex items-center gap-1.5 text-neutral-200">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#fcc107' }}></span>
                              <span>Aprobado (1)</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-neutral-400">
                              <span className="h-2 w-2 rounded-full bg-neutral-500"></span>
                              <span>Enviado (4)</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-neutral-400">
                              <span className="h-2 w-2 rounded-full bg-neutral-700"></span>
                              <span>Completado (5)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                <div className="mt-6 flex items-center gap-1 text-xs font-bold transition-opacity opacity-0 group-hover:opacity-100" style={{ color: '#fcc107' }}>
                  <span>Conocer más</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}