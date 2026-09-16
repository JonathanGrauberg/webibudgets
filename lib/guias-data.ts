// lib/guias-data.ts
//
// Contenido de "Campus > Guías" — material de consulta más largo y de
// tono más formal que el Glosario, organizado en guías con capítulos.
// Cada capítulo es un array de "bloques" (texto / pasos-en-acordeón / matriz
// visual) para poder armar estructuras distintas por capítulo sin forzar un
// esquema único. Nada de nombres propios de clientes ni información
// sensible — todo el contenido vale para cualquier PyME, en general, y no
// está escrito "para clientes de .budgets" sino para cualquier visitante.

export interface GuiaPaso {
  titulo: string
  contenido: string[]
}

export interface MatrizCuadrante {
  numero: number
  nombre: string
  volumen: 'Alto' | 'Bajo'
  margen: 'Alto' | 'Bajo'
  funcion: string
  color: string // hex
}

export interface DiagnosticoRango {
  etiqueta: string // ej. "Superior al 80%"
  diagnostico: string
  accion: string
  color: string // hex
}

export type GuiaBloque =
  | { tipo: 'texto'; numero: string; titulo: string; parrafos: string[] }
  | { tipo: 'pasos'; numero: string; titulo: string; pasos: GuiaPaso[] }
  | { tipo: 'matriz'; numero: string; titulo: string; cuadrantes: MatrizCuadrante[] }
  // 👇 fórmula destacada — evitamos notación LaTeX (no hay renderer de
  // matemática instalado, y tampoco hace falta: el público busca entender,
  // no ver una fórmula de libro de texto), va en texto plano legible.
  | { tipo: 'formula'; numero: string; titulo: string; intro?: string[]; formula: string; ejemplo: string[]; nota?: string }
  // 👇 tarjetas de diagnóstico por rango — mismo lenguaje visual que la
  // Matriz de Margen, para tablas de "según tu número, hacé esto".
  | { tipo: 'rangos'; numero: string; titulo: string; formula?: string; rangos: DiagnosticoRango[] }

export interface GuiaCapitulo {
  slug: string
  titulo: string
  minutosLectura: number
  bloques: GuiaBloque[]
  notaFinal?: string // solo en el último capítulo de la guía — crédito discreto, sin caja destacada
}

export interface Guia {
  slug: string
  titulo: string
  subtitulo: string
  descripcionCorta: string // para la card en /campus/guias
  descripcionLarga: string // para la portada de la guía
  capitulos: GuiaCapitulo[]
}

export const GUIAS: Guia[] = [
  {
    slug: 'estrategia-b2b-y-crecimiento',
    titulo: 'Estrategia B2B y Crecimiento Operativo',
    subtitulo: 'Material de consulta empresarial',
    descripcionCorta: 'Prospección de cuentas grandes, cómo estructurar ingresos recurrentes, y cómo diagnosticar qué parte del catálogo da rentabilidad real.',
    descripcionLarga:
      'Tres capítulos para empresas que venden a otras empresas: cómo dirigir el esfuerzo comercial a cuentas estratégicas en vez de captación masiva, cómo institucionalizar la relación con los clientes activos para ganar previsibilidad financiera, y cómo clasificar el catálogo según su contribución marginal real.',
    capitulos: [
      {
        slug: 'abm-simplificado',
        titulo: 'Fundamentos de Prospección B2B: el modelo ABM',
        minutosLectura: 5,
        bloques: [
          {
            tipo: 'texto',
            numero: '1.1',
            titulo: 'Introducción al Marketing Basado en Cuentas',
            parrafos: [
              'En el ámbito comercial B2B (Business-to-Business), las estrategias masivas de atracción suelen generar un volumen elevado de consultas con baja tasa de conversión. El modelo Account-Based Marketing (ABM) propone un cambio de paradigma: reemplazar la captación abierta por una estrategia de precisión dirigida explícitamente a empresas objetivo predefinidas.',
              'Mientras que el marketing tradicional opera como una red de captura amplia, el ABM concentra los recursos comerciales en identificar, mapear y abordar un número acotado de cuentas estratégicas cuya escala justifica un proceso de venta consultivo.',
            ],
          },
          {
            tipo: 'pasos',
            numero: '1.2',
            titulo: 'Etapas de ejecución en la PyME',
            pasos: [
              {
                titulo: 'Definición del Perfil de Cliente Ideal (ICP)',
                contenido: [
                  'El Perfil de Cliente Ideal no se limita a variables demográficas; contempla parámetros operativos y financieros precisos.',
                  'Criterios estructurales: volumen de facturación estimada, dotación de personal y estructura del área de compras.',
                  'Criterios operativos: metodología de aprovisionamiento, frecuencia de emisión de órdenes de pago y nivel de digitalización interna.',
                ],
              },
              {
                titulo: 'Mapeo del Centro Comprador',
                contenido: [
                  'En operaciones B2B, la decisión de compra no recae en un único individuo. Es fundamental identificar las distintas figuras que componen el comité de decisión.',
                  'El Usuario Operativo: responsable del área que utilizará el insumo o servicio. Su prioridad radica en la eficiencia, los tiempos de entrega y la simplicidad técnica.',
                  'El Evaluador Financiero: responsable de administración o gerencia. Su análisis se enfoca en las condiciones de crédito, facturación, márgenes y retorno de inversión.',
                  'El Decisor Final: socio o director con potestad para autorizar la partida presupuestaria.',
                ],
              },
              {
                titulo: 'Elaboración de propuestas de valor asimétricas',
                contenido: [
                  'El abordaje a cada cuenta clave requiere abandonar la presentación de catálogos genéricos. La propuesta comercial debe estructurarse en función de la problemática específica detectada en la fase de prospección, detallando:',
                  'Alcance de la provisión y plazos de entrega garantizados.',
                  'Esquema de costos transparente y previsibilidad en el ajuste de precios.',
                  'Plan de contingencia y soporte operativo tras la venta.',
                ],
              },
            ],
          },
        ],
      },
      {
        slug: 'ingresos-recurrentes',
        titulo: 'Recurrencia Comercial y Estructuración de Ingresos',
        minutosLectura: 5,
        bloques: [
          {
            tipo: 'texto',
            numero: '2.1',
            titulo: 'La vulnerabilidad de la venta intermitente',
            parrafos: [
              'Un problema persistente en las pequeñas y medianas empresas es la fluctuación drástica en la facturación mensual. Este fenómeno ocurre cuando el modelo de ingresos depende exclusivamente de transacciones puntuales (ad-hoc), obligando a la fuerza de ventas a reiniciar el ciclo de captación al comienzo de cada período.',
              'La previsibilidad financiera no se logra aumentando indefinidamente la base de clientes ocasionales, sino institucionalizando la relación comercial con los clientes activos para transformarlos en cuentas recurrentes.',
            ],
          },
          {
            tipo: 'pasos',
            numero: '2.2',
            titulo: 'Mecanismos de fidelización financiera',
            pasos: [
              {
                titulo: 'El Acuerdo Marco de Provisión (Contrato Marco)',
                contenido: [
                  'Es un instrumento legal y comercial que fija las pautas generales para futuras operaciones entre las partes sin necesidad de renegociar términos en cada pedido individual.',
                  'Beneficios operativos: se establecen previamente las condiciones de pago, los tiempos de reposición, las listas de precios de referencia y los márgenes de tolerancia de entrega.',
                  'Resultado: el cliente agiliza sus órdenes de compra internas y se reducen los tiempos de emisión administrativa.',
                ],
              },
              {
                titulo: 'Modelos de adhesión y cuenta corriente estructurada',
                contenido: [
                  'Para asegurar la continuidad del flujo de caja, la empresa debe reducir la fricción en la cobranza habitual.',
                  'Cobros programados: automatización de liquidaciones periódicas para abonos, mantenimiento o provisión recurrente.',
                  'Líneas de crédito vinculadas a cumplimiento: definición clara de cupos en cuenta corriente con plazos estrictos y bonificaciones por pronto pago, evitando el desgaste de la gestión manual de cobranza.',
                ],
              },
              {
                titulo: 'Esquemas de reserva de capacidad',
                contenido: [
                  'Consiste en garantizar al cliente una cuota prioritaria de stock o de horas operativas dentro de la planificación de la empresa, a cambio de un compromiso formal de compra mensual.',
                  'Este modelo blinda la cuenta ante intentos de captación por parte de competidores directos.',
                ],
              },
            ],
          },
        ],
      },
      {
        slug: 'matriz-de-margen',
        titulo: 'Diagnóstico de Rentabilidad: la Matriz de Margen Operativo',
        minutosLectura: 6,
        bloques: [
          {
            tipo: 'texto',
            numero: '3.1',
            titulo: 'Distorsión entre facturación bruta y utilidad neta',
            parrafos: [
              'En la gestión comercial suele registrarse un error recurrente: evaluar el éxito de un ejercicio analizando únicamente el volumen de facturación. Un incremento en las ventas brutas puede derivar en un deterioro de la caja si los productos o servicios comercializados presentan un margen de contribución insuficiente para absorber los costos operativos no asignados (logística, roturas, tiempo de gestión, gastos financieros por cobranza diferida).',
            ],
          },
          {
            tipo: 'matriz',
            numero: '3.2',
            titulo: 'Clasificación del catálogo por contribución marginal',
            cuadrantes: [
              {
                numero: 1,
                nombre: 'Bienes Kern (Estrella)',
                volumen: 'Alto',
                margen: 'Alto',
                funcion: 'Núcleo de rentabilidad. Absorben costos fijos y generan caja pura.',
                color: '#28A745',
              },
              {
                numero: 2,
                nombre: 'Bienes Gancho',
                volumen: 'Alto',
                margen: 'Bajo',
                funcion: 'Insumos de alta rotación para captación y absorción de estructura.',
                color: '#FFC107',
              },
              {
                numero: 3,
                nombre: 'Soluciones de Especialidad',
                volumen: 'Bajo',
                margen: 'Alto',
                funcion: 'Prestaciones a medida con alta valoración técnica por el cliente.',
                color: '#17A2B8',
              },
              {
                numero: 4,
                nombre: 'Insumos Parásito',
                volumen: 'Bajo',
                margen: 'Bajo',
                funcion: 'Alto costo de oportunidad y margen nulo o negativo.',
                color: '#DC3545',
              },
            ],
          },
          {
            tipo: 'pasos',
            numero: '3.3',
            titulo: 'Plan de acción por cuadrante',
            pasos: [
              {
                titulo: 'Bienes Kern (alta rotación / alto margen)',
                contenido: [
                  'Representan la fortaleza financiera de la organización. Requieren un monitoreo continuo de stock para evitar quiebres y deben formar parte de la oferta principal en toda negociación B2B.',
                ],
              },
              {
                titulo: 'Bienes Gancho (alta rotación / bajo margen)',
                contenido: [
                  'Cumplen un rol táctico para abrir cuentas o competir con precios de mercado.',
                  'Regla operativa: se debe aplicar una política estricta de cross-selling (venta cruzada). Una propuesta comercial nunca debe consolidarse únicamente con artículos de este segmento, ya que el costo logístico de despacho neutraliza la utilidad.',
                ],
              },
              {
                titulo: 'Soluciones de Especialidad (baja rotación / alto margen)',
                contenido: [
                  'Comprende servicios técnicos, piezas complejas o trabajos a medida. Dado que el cliente prioriza la resolución del problema por sobre la tarifa, deben cotizarse bajo el criterio de valor percibido, evitando la competencia por descuentos.',
                ],
              },
              {
                titulo: 'Insumos Parásito (baja rotación / bajo margen)',
                contenido: [
                  'Generan un costo de oportunidad elevado al inmovilizar capital de trabajo en depósito y consumir horas de gestión administrativa.',
                  'Acción requerida: reestructuración de precios, paso a modalidad de provisión bajo pedido (sin stock propio en depósito), o retiro definitivo de la cartera activa.',
                ],
              },
            ],
          },
        ],
        notaFinal: 'Este material forma parte del programa de desarrollo para PyMEs de Campus .budgets.',
      },
    ],
  },
  {
    slug: 'gestion-de-costos-y-cotizaciones',
    titulo: 'Gestión de Costos y Cotizaciones Operativas',
    subtitulo: 'Material de consulta empresarial',
    descripcionCorta: 'Cómo calcular un precio de venta que realmente cubra tu estructura, cómo armar una cotización que no genere problemas después, y qué hacer cuando te piden descuento.',
    descripcionLarga:
      'Tres capítulos sobre el corazón de cualquier negocio que cotiza: cómo fijar un precio de venta con margen real (no "costo x 2"), qué tiene que llevar sí o sí una propuesta comercial para no generar fricción en el cobro, y cómo responder al pedido de descuento sin resignar rentabilidad.',
    capitulos: [
      {
        slug: 'precio-de-venta-y-costos',
        titulo: 'Determinación del Precio de Venta y Análisis de Costos',
        minutosLectura: 5,
        bloques: [
          {
            tipo: 'texto',
            numero: '1.1',
            titulo: 'La distorsión del "costo x 2"',
            parrafos: [
              'Un hábito extendido en la gestión PyME consiste en fijar el precio de venta multiplicando el costo directo de compra por un factor arbitrario (por ejemplo, duplicar el valor de costo). Este enfoque ignora la estructura de costos fijos de la organización, la tasa de absorción operativa y la variabilidad en los plazos de cobranza.',
              'Para determinar un precio sostenible, la estructura debe considerar la totalidad de las erogaciones asociadas al funcionamiento del negocio, clasificadas según su naturaleza financiera.',
            ],
          },
          {
            tipo: 'pasos',
            numero: '1.2',
            titulo: 'Clasificación estructural de costos',
            pasos: [
              {
                titulo: 'Costos Directos de Provisión (Variables)',
                contenido: [
                  'Son aquellos vinculados directamente a la generación del producto o servicio comercializado:',
                  'Materia prima e insumos: mercadería o insumos utilizados en la ejecución.',
                  'Mano de obra directa: horas operativas o liquidaciones asociadas a la producción/prestación específica.',
                  'Comisiones y costos transaccionales: tarifas por procesamiento de pagos, retenciones impositivas y comisiones de venta.',
                ],
              },
              {
                titulo: 'Costos de Estructura (Fijos)',
                contenido: [
                  'Erogaciones indispensables para mantener la operativa abierta, independientemente del volumen de ventas del mes:',
                  'Alquileres, servicios públicos y seguros.',
                  'Sueldos administrativos y cargas sociales asociadas.',
                  'Licencias de software, conectividad y amortización de equipamiento.',
                ],
              },
            ],
          },
          {
            tipo: 'formula',
            numero: '1.3',
            titulo: 'Cálculo del margen de contribución real',
            intro: [
              'El cálculo del precio de venta debe realizarse sobre el margen sobre precio final (markup de venta) y no sobre el costo simple, para evitar la pérdida sistemática de margen operativo:',
            ],
            formula: 'Precio de Venta = Costo Directo Unitario ÷ (1 − % Margen deseado)',
            ejemplo: [
              'Si un bien registra un costo directo de $10.000 y la empresa requiere un margen bruto del 35% para absorber estructura y generar utilidad:',
              'Precio de Venta = 10.000 ÷ (1 − 0,35) = 10.000 ÷ 0,65 = $15.384,61',
            ],
            nota: 'Calcular el 35% directamente sobre los $10.000 fijaría un precio de $13.500 — una pérdida sistemática del 13,8% del margen proyectado en cada transacción.',
          },
        ],
      },
      {
        slug: 'estructura-del-presupuesto',
        titulo: 'Estructura y Presentación del Presupuesto Comercial',
        minutosLectura: 4,
        bloques: [
          {
            tipo: 'texto',
            numero: '2.1',
            titulo: 'El presupuesto como documento legal y operativo',
            parrafos: [
              'La propuesta comercial no es un mero listado de precios; constituye el marco de referencia que delimita las expectativas del cliente y los compromisos de la empresa. Un presupuesto ambiguo o incompleto deriva en objeciones en la cobranza, solicitudes de trabajo adicional no facturado y desgaste operativo.',
            ],
          },
          {
            tipo: 'pasos',
            numero: '2.2',
            titulo: 'Componentes indispensables de la propuesta',
            pasos: [
              {
                titulo: 'Desglose clarificado de ítems (alcance)',
                contenido: [
                  'Descripción detallada de los bienes entregables o servicios a prestar, evitando términos genéricos como "mantenimiento general" o "insumos varios".',
                  'Unidades de medida explícitas (horas, metros, unidades, módulos).',
                ],
              },
              {
                titulo: 'Período de validez de la oferta',
                contenido: [
                  'En entornos con fluctuación de costos, cada cotización debe incluir una cláusula explícita de vigencia.',
                  'Plazo estándar: 5 a 15 días corridos desde la fecha de emisión.',
                  'Cláusula de reajuste: condición de actualización de valores en caso de variaciones en las listas de precios de los proveedores de origen antes de la aprobación formal.',
                ],
              },
              {
                titulo: 'Condiciones y métodos de pago',
                contenido: [
                  'Porcentaje de anticipo requerido para el inicio de tareas (mínimo recomendado para PyMEs: 30% a 50%).',
                  'Esquema de hitos de facturación para trabajos de larga duración (ejemplo: 40% anticipo, 40% contra avance, 20% contra entrega final).',
                  'Medios de pago aceptados y especificación de recargos o bonificaciones aplicables por instrumento financiero.',
                ],
              },
            ],
          },
        ],
      },
      {
        slug: 'negociacion-y-descuentos',
        titulo: 'Negociación, Descuentos y Cierre de Cotizaciones',
        minutosLectura: 5,
        bloques: [
          {
            tipo: 'texto',
            numero: '3.1',
            titulo: 'La política comercial frente al pedido de descuento',
            parrafos: [
              'El pedido de descuento es una constante en las transacciones B2B y comerciales. Ceder porcentaje de precio sin ajustar el alcance de la provisión erosiona directamente la utilidad neta de la empresa, dado que los costos fijos y variables permanecen inalterados.',
            ],
          },
          {
            tipo: 'pasos',
            numero: '3.2',
            titulo: 'Estrategias de compensación comercial',
            pasos: [
              {
                titulo: 'Flexibilización asimétrica (quitar alcance)',
                contenido: [
                  'Frente a la solicitud de reducción de precio, la respuesta operativa consiste en redefinir la propuesta: "Podemos ajustar el monto final a su presupuesto mediante la reducción del volumen de entrega o la modificación de los plazos de ejecución."',
                  'Esta postura protege el valor unitario de la hora o del insumo y evita la devaluación percibida del servicio.',
                ],
              },
              {
                titulo: 'Bonificación por volumen o pronto pago',
                contenido: [
                  'Los descuentos únicamente deben otorgarse a cambio de una contraprestación financiera tangible para la caja.',
                  'Pronto pago: descuento financiero a cambio de la cancelación inmediata en efectivo o transferencia, reduciendo el costo de financiamiento propio.',
                  'Escala por lote: bonificación porcentual supeditada al incremento en las cantidades físicas contratadas en una misma orden.',
                ],
              },
            ],
          },
          {
            tipo: 'rangos',
            numero: '3.3',
            titulo: 'Análisis de tasa de conversión de cotizaciones',
            formula: 'Tasa de Aprobación = (Presupuestos Aprobados ÷ Presupuestos Emitidos) × 100',
            rangos: [
              {
                etiqueta: 'Superior al 80%',
                diagnostico: 'Precios fijados por debajo del valor de mercado.',
                accion: 'Incrementar márgenes gradualmente — se está sacrificando utilidad.',
                color: '#DC3545',
              },
              {
                etiqueta: 'Inferior al 30%',
                diagnostico: 'Desacople entre propuesta de valor, target o claridad.',
                accion: 'Revisar el perfil de clientes abordados y el formato de presentación.',
                color: '#FFC107',
              },
              {
                etiqueta: '50% a 65% (óptimo)',
                diagnostico: 'Equilibrio sano entre competitividad y margen.',
                accion: 'Mantener la estrategia y monitorear variaciones de costos.',
                color: '#28A745',
              },
            ],
          },
        ],
        notaFinal: 'Este material forma parte del programa de desarrollo empresarial de Campus .budgets.',
      },
    ],
  },
]

export function getGuia(slug: string): Guia | undefined {
  return GUIAS.find((g) => g.slug === slug)
}

export function getCapitulo(guiaSlug: string, capituloSlug: string): { guia: Guia; capitulo: GuiaCapitulo; index: number } | undefined {
  const guia = getGuia(guiaSlug)
  if (!guia) return undefined
  const index = guia.capitulos.findIndex((c) => c.slug === capituloSlug)
  if (index === -1) return undefined
  return { guia, capitulo: guia.capitulos[index], index }
}
