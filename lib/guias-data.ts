// lib/guias-data.ts
//
// Contenido de "Academia > Guías" — piezas más largas y de tono más serio
// que el Glosario, organizadas en guías con capítulos. Cada capítulo es su
// propia página (mejor SEO: cada uno apunta a su propia búsqueda) y sus
// "pasos" se muestran colapsados por default (se abren al tocarlos), para
// que la guía no se vea como una pared de texto de entrada.
//
// Nunca incluir nombres propios de clientes ni información sensible acá —
// todo el contenido tiene que valer para cualquier PyME, en general.

export interface GuiaPaso {
  titulo: string
  contenido: string[] // uno o más párrafos/bullets — se muestran al expandir
}

export interface GuiaCapitulo {
  slug: string
  titulo: string
  minutosLectura: number
  intro: string[] // siempre visible, antes de los pasos colapsables
  pasosIntro?: string // frase corta antes de la lista de pasos, ej. "Los 3 pasos para..."
  pasos: GuiaPaso[]
  cierre?: string[] // párrafo(s) de cierre, siempre visible, después de los pasos
  ctaTitulo: string // conexión con la plataforma, real — no un módulo inventado
  ctaTexto: string
}

export interface Guia {
  slug: string
  titulo: string
  descripcionCorta: string // para la card en /academia/guias
  descripcionLarga: string // para la portada de la guía
  capitulos: GuiaCapitulo[]
}

export const GUIAS: Guia[] = [
  {
    slug: 'estrategia-b2b-y-crecimiento',
    titulo: 'Estrategia B2B y Crecimiento',
    descripcionCorta: 'Cómo conseguir clientes grandes, convertir ventas sueltas en ingresos recurrentes, y saber qué de tu catálogo te da plata de verdad.',
    descripcionLarga:
      'Tres capítulos pensados para PyMEs que venden a otras empresas: cómo apuntar a clientes grandes sin presupuesto de marketing millonario, cómo dejar de depender de vender "de cero" cada mes, y cómo identificar qué productos o servicios realmente te dejan ganancia.',
    capitulos: [
      {
        slug: 'abm-simplificado',
        titulo: 'Account-Based Marketing (ABM) simplificado para PyMEs',
        minutosLectura: 4,
        intro: [
          'El marketing tradicional funciona como una red de pesca: tirás la red (anuncios masivos, publicaciones, folletos) y ves qué cae. El Account-Based Marketing (ABM) funciona al revés, como la pesca con arpón: elegís de antemano a un puñado de empresas puntuales a las que te interesa venderle, investigás quién decide ahí adentro, y armás una propuesta pensada específicamente para esa empresa.',
          'No hace falta presupuesto de agencia para aplicarlo — es más una forma de ordenar el esfuerzo comercial que ya hacés, apuntándolo mejor.',
        ],
        pasosIntro: 'Los 3 pasos para ejecutar ABM sin presupuesto millonario:',
        pasos: [
          {
            titulo: 'Definir el Perfil de Cliente Ideal (ICP)',
            contenido: [
              'No alcanza con algo genérico como "empresas que necesiten insumos". Cuanto más específico, mejor apuntás.',
              'Ejemplo concreto: "Ferreterías industriales con más de 3 vendedores, que hoy tardan más de 24 horas en mandar un presupuesto a sus clientes."',
              'Con un perfil así de puntual, sabés exactamente a quién buscar y qué dolor resolverle.',
            ],
          },
          {
            titulo: 'Mapear a los decisores de compra',
            contenido: [
              'En ventas B2B casi nunca decide una sola persona. Conviene identificar al menos dos roles:',
              '• El Comprador Operativo: encargado de compras o jefe de depósito. Le importa la velocidad y que no haya problemas.',
              '• El Comprador Financiero: dueño o gerente administrativo. Le importa la rentabilidad y la claridad en la facturación.',
              'Tu propuesta le tiene que hablar a los dos, no solo al que te contesta el mail.',
            ],
          },
          {
            titulo: 'Crear una propuesta hiper-personalizada',
            contenido: [
              'Olvidate de mandar un catálogo genérico en PDF. Un presupuesto con ítems bien desglosados, tiempos de entrega concretos y métodos de pago flexibles vende mucho más que una lista de precios.',
              'La personalización no tiene que ver con diseño gráfico — tiene que ver con que la otra empresa sienta que entendiste su problema puntual, no que le mandaste lo mismo que a todos.',
            ],
          },
        ],
        ctaTitulo: 'Presupuestos armados a medida, sin perder tiempo',
        ctaTexto: 'En .budgets armás cada presupuesto con ítems desglosados, condiciones y tiempos de entrega — la propuesta personalizada del Paso 3 se arma en minutos, no en Word desde cero cada vez.',
      },
      {
        slug: 'ingresos-recurrentes',
        titulo: 'De presupuestos ocasionales a ingresos recurrentes',
        minutosLectura: 4,
        intro: [
          'Muchas PyMEs sufren meses con picos altos de facturación seguidos de semanas vacías — la típica venta B2B "serrucho". Pasa porque cada presupuesto se trata como una venta aislada, en vez de construir un acuerdo comercial que siga en el tiempo.',
          'La clave para un crecimiento más predecible no es necesariamente salir a buscar clientes nuevos todos los días, sino transformar los presupuestos que ya aprobaste en acuerdos que se repiten.',
        ],
        pasosIntro: 'Las 3 estrategias para convertir presupuestos esporádicos en ingresos recurrentes:',
        pasos: [
          {
            titulo: 'El modelo de "Contrato Marco" (acuerdo de provisión)',
            contenido: [
              'En vez de cotizar cada pedido chico desde cero, negociá un volumen estimado trimestral o anual con tus mejores clientes.',
              'Acordás precios por escala y condiciones de entrega ya preaprobadas. El cliente no pierde tiempo pidiendo presupuestos a la competencia cada vez que necesita algo — directamente emite la orden de compra bajo el acuerdo que ya tienen.',
            ],
          },
          {
            titulo: 'Facilidad de pago automatizada',
            contenido: [
              'La fricción para cobrar frena la recompra. Si el cliente tiene que hacer una transferencia manual y mandarte el comprobante cada vez, la venta se retrasa — a veces se cae directamente.',
              'Un link de pago recurrente para mantenimiento, servicios periódicos o reposición automática de stock saca esa fricción del medio. Cuando el pago se acredita solo, el flujo operativo no se detiene.',
            ],
          },
          {
            titulo: 'Garantía de stock reservado',
            contenido: [
              'Ofrecésela a tu 20% de clientes más importantes: "te garantizamos stock reservado de tus insumos críticos, a cambio de un compromiso de compra mensual".',
              'Para la empresa que te compra, tener disponibilidad inmediata suele valer más que un pequeño descuento — es una forma de fidelizar que no pasa solo por el precio.',
            ],
          },
        ],
        ctaTitulo: 'Cobros recurrentes, sin perseguir transferencias',
        ctaTexto: 'El módulo de Cobros de .budgets te deja cargar un cargo mensual con link de pago por Mercado Pago — el cliente paga solo, sin que tengas que acordarte de pedirle el comprobante cada mes.',
      },
      {
        slug: 'matriz-de-margen',
        titulo: 'La Matriz de Margen: qué te da plata y qué te la saca',
        minutosLectura: 5,
        intro: [
          'Facturar más no siempre significa ganar más. Es común que una empresa aumente sus ventas un 30% y, aun así, termine el mes con menos caja disponible.',
          'Pasa por el "margen fantasma": productos o servicios que en el papel parecen rentables, pero cuyos costos ocultos (flete, roturas, tiempo de armado, comisiones, almacenamiento) se comen la ganancia real.',
        ],
        pasosIntro: 'Cómo clasificar tu catálogo en 4 cuadrantes:',
        pasos: [
          {
            titulo: 'Productos Estrella (alto margen, alto volumen)',
            contenido: [
              'Son el motor financiero del negocio. Tienen que tener prioridad de stock y aparecer primero en tus cotizaciones — son lo que más te conviene vender.',
            ],
          },
          {
            titulo: 'Productos Gancho (bajo margen, alto volumen)',
            contenido: [
              'Artículos estándar que la competencia también vende, y a precios ajustados. No dejan ganancia pura, pero sirven para "abrir la puerta" con un cliente nuevo.',
              'Regla de oro: nunca mandes un presupuesto que tenga SOLO productos gancho — combinalos siempre con algo de mayor margen.',
            ],
          },
          {
            titulo: 'Productos Especializados (alto margen, bajo volumen)',
            contenido: [
              'Soluciones a medida, servicios técnicos, o ítems difíciles de conseguir. Cotizalos a precio de especialista — quien los busca no está comparando centavos, busca que le resuelvas un problema puntual.',
            ],
          },
          {
            titulo: 'Productos Parásito (bajo margen, bajo volumen)',
            contenido: [
              'Insumos que vendés poco, ocupan espacio en el depósito, o exigen una logística cara para lo que dejan.',
              'Acción concreta: o les actualizás el precio con decisión, o los sacás directamente de tu catálogo comercial — están usando capital de trabajo que podría estar en otro lado.',
            ],
          },
        ],
        ctaTitulo: 'Vé el margen real de cada producto, no el de memoria',
        ctaTexto: 'En Productos y Servicios cargás el costo de cada ítem junto al precio de venta, y en cada Presupuesto aprobado ves la columna de Margen — así identificás tus Productos Estrella (y tus Parásito) con datos, no a ojo.',
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
