// lib/glosario-data.ts
//
// Contenido del "Glosario PyME" (/academia) — términos de negocios/tecnología
// explicados en criollo, con ejemplo real, para dueños de PyME y
// emprendedores que se cruzan con esta jerga y no tienen por qué saberla.
// Cada término tiene un slug propio (id de ancla) para poder linkearlo
// puntualmente desde SEO o desde un tooltip (?) dentro del sistema.

export interface GlosarioTermino {
  slug: string
  termino: string
  sigla?: string
  definicion: string
  ejemplo: string
}

export interface GlosarioCategoria {
  slug: string
  titulo: string
  terminos: GlosarioTermino[]
  disclaimer?: boolean // 👈 categorías donde la info puede quedar desactualizada rápido (ej: normativa fiscal argentina)
}

export const GLOSARIO_CATEGORIAS: GlosarioCategoria[] = [
  {
    slug: 'modelos-de-negocio',
    titulo: 'Modelos de negocio',
    terminos: [
      {
        slug: 'b2b',
        termino: 'B2B',
        sigla: 'Business to Business',
        definicion: 'Empresas que le venden a otras empresas, no al público en general.',
        ejemplo: 'Una fábrica de neumáticos que le vende a una automotriz, o vos vendiéndole insumos a otro negocio.',
      },
      {
        slug: 'b2c',
        termino: 'B2C',
        sigla: 'Business to Consumer',
        definicion: 'Empresas que le venden directo a la persona que va a usar el producto.',
        ejemplo: 'Una tienda de ropa o un supermercado — le venden al cliente final, no a otra empresa.',
      },
      {
        slug: 'b2b2c',
        termino: 'B2B2C',
        sigla: 'Business to Business to Consumer',
        definicion: 'Una empresa le vende a otra, pero las dos apuntan a llegar juntas al mismo consumidor final.',
        ejemplo: 'Rappi o PedidosYa: le venden el servicio al restaurante (B2B), pero el que termina comprando la comida sos vos (C).',
      },
      {
        slug: 'c2c',
        termino: 'C2C',
        sigla: 'Consumer to Consumer',
        definicion: 'Plataformas donde una persona le vende directo a otra persona, sin que la empresa sea la que vende.',
        ejemplo: 'Marketplace de Facebook o Mercado Libre cuando vende un particular — la plataforma solo conecta a los dos.',
      },
      {
        slug: 'd2c',
        termino: 'D2C',
        sigla: 'Direct to Consumer',
        definicion: 'Una marca le vende directo al público, sin pasar por un distribuidor o una tienda intermedia.',
        ejemplo: 'Una marca de indumentaria que vende solo por su propia web o Instagram, en vez de estar en locales de terceros.',
      },
      {
        slug: 'marketplace',
        termino: 'Marketplace',
        definicion: 'Una plataforma que junta a muchos vendedores distintos en un mismo lugar, y se queda con una comisión por cada venta.',
        ejemplo: 'Mercado Libre, Amazon — vos ponés tu producto ahí, ellos te traen compradores y se llevan un %.',
      },
    ],
  },
  {
    slug: 'tecnologia-y-software',
    titulo: 'Tecnología y software',
    terminos: [
      {
        slug: 'saas',
        termino: 'SaaS',
        sigla: 'Software as a Service',
        definicion: 'Un programa que no instalás en tu computadora: lo usás desde internet y pagás una suscripción mensual o anual por usarlo.',
        ejemplo: 'Netflix, Spotify, y esto mismo — .budgets es un SaaS: no lo instalás, entrás desde el navegador y pagás un plan.',
      },
      {
        slug: 'paas',
        termino: 'PaaS',
        sigla: 'Platform as a Service',
        definicion: 'Una plataforma en la nube pensada para que los programadores construyan SUS PROPIOS programas arriba de ella. No es algo que uses vos como dueño de un negocio — es una herramienta para el que desarrolla software.',
        ejemplo: 'Vercel o Heroku — ahí es donde alguien como nosotros aloja el sistema que después vos usás.',
      },
      {
        slug: 'iaas',
        termino: 'IaaS',
        sigla: 'Infrastructure as a Service',
        definicion: 'Alquilar la infraestructura pura — servidores, almacenamiento — sin nada armado arriba. Un nivel más técnico que el SaaS y el PaaS.',
        ejemplo: 'Amazon Web Services (AWS) — ahí se alquila la "computadora gigante" de la nube en la que corren miles de sistemas.',
      },
      {
        slug: 'api',
        termino: 'API',
        definicion: 'Una forma en que dos sistemas distintos se hablan entre sí y se pasan información automáticamente, sin que una persona tenga que copiar y pegar datos a mano.',
        ejemplo: 'Cuando .budgets se conecta con Mercado Pago para cobrar online, los dos sistemas "hablan" a través de una API.',
      },
      {
        slug: 'crm',
        termino: 'CRM',
        sigla: 'Customer Relationship Management',
        definicion: 'Un sistema para llevar un registro ordenado de tus clientes: quién es, qué le vendiste, qué te dijo, cuándo hay que volver a contactarlo.',
        ejemplo: 'En vez de tener los datos de los clientes desparramados en la cabeza, un cuaderno y WhatsApp, todo vive en un solo lugar.',
      },
      {
        slug: 'erp',
        termino: 'ERP',
        sigla: 'Enterprise Resource Planning',
        definicion: 'Un sistema grande que integra TODAS las áreas de una empresa (stock, finanzas, ventas, producción) en un solo lugar. Suele ser caro y pesado de implementar — pensado para empresas grandes, no para la mayoría de las PyMEs.',
        ejemplo: 'SAP es el ERP más conocido del mundo — una fábrica grande lo usa para controlar todo; una PyME chica generalmente no lo necesita.',
      },
      {
        slug: 'la-nube',
        termino: 'La nube (Cloud)',
        definicion: 'Guardar y usar información en servidores de internet, en vez de en la computadora física de tu local u oficina.',
        ejemplo: 'Si tus datos "están en la nube", significa que podés entrar a verlos desde el celular, la compu del local o desde tu casa — no dependen de una sola máquina.',
      },
    ],
  },
  {
    slug: 'finanzas-y-metricas',
    titulo: 'Finanzas y métricas de rendimiento',
    terminos: [
      {
        slug: 'roi',
        termino: 'ROI',
        sigla: 'Return on Investment (Retorno de la Inversión)',
        definicion: 'El porcentaje de plata que ganás (o perdés) en relación a lo que invertiste.',
        ejemplo: 'Si invertiste $100.000 en publicidad y te generó $150.000 en ventas, tuviste un ROI positivo — te devolvió más de lo que pusiste.',
      },
      {
        slug: 'kpi',
        termino: 'KPI',
        sigla: 'Key Performance Indicator (Indicador Clave de Rendimiento)',
        definicion: 'Un número puntual que elegís mirar para saber si vas bien o mal en algo — sin que tengas que revisar todo el negocio a mano.',
        ejemplo: '"Cuántos presupuestos aprobé este mes" o "cuánto cobré" son KPIs — de hecho, son justo los números que ves en tu Dashboard.',
      },
      {
        slug: 'cac',
        termino: 'CAC',
        sigla: 'Customer Acquisition Cost (Costo de Adquisición de Clientes)',
        definicion: 'Cuánta plata gastás en total (marketing + ventas) para conseguir UN cliente nuevo.',
        ejemplo: 'Si gastaste $50.000 en publicidad este mes y conseguiste 10 clientes nuevos, tu CAC fue de $5.000 por cliente.',
      },
      {
        slug: 'ltv',
        termino: 'LTV',
        sigla: 'Lifetime Value (Valor de Vida del Cliente)',
        definicion: 'Cuánta plata en total te va a dejar un cliente desde la primera compra hasta que deja de comprarte.',
        ejemplo: 'Un cliente que te compra $10.000 por mes durante 2 años te deja un LTV de $240.000 — y ese número tiene que ser mayor a lo que gastaste en conseguirlo (el CAC).',
      },
      {
        slug: 'mrr-arr',
        termino: 'MRR / ARR',
        sigla: 'Monthly / Annual Recurring Revenue',
        definicion: 'La plata que sabés que vas a cobrar sí o sí cada mes (MRR) o cada año (ARR), porque son ingresos fijos y repetidos — típico en suscripciones.',
        ejemplo: 'Si tenés 5 clientes pagándote $20.000 por mes de mantenimiento, tu MRR es $100.000 — plata que ya sabés que va a entrar el mes que viene.',
      },
      {
        slug: 'margen-bruto-vs-neto',
        termino: 'Margen bruto vs. margen neto',
        definicion: 'El margen bruto es lo que te queda después de descontar solo el costo del producto/servicio. El margen neto es lo que te queda DE VERDAD, después de descontar TODOS los gastos (alquiler, sueldos, impuestos, todo).',
        ejemplo: 'Vendiste algo en $100.000 que te costó $60.000 hacer: margen bruto $40.000. Pero entre alquiler, sueldos y demás gastos, gastaste $25.000 más: margen neto $15.000 — la plata que realmente te quedó en el bolsillo.',
      },
      {
        slug: 'punto-de-equilibrio',
        termino: 'Punto de equilibrio (Break-even)',
        definicion: 'La cantidad de ventas que necesitás hacer para que lo que entra sea igual a lo que gastás — ni ganás ni perdés.',
        ejemplo: 'Si tus gastos fijos son $500.000 por mes, el punto de equilibrio es cuánto tenés que vender ese mes para cubrir justo esos $500.000, antes de empezar a ganar de verdad.',
      },
      {
        slug: 'flujo-de-caja',
        termino: 'Flujo de caja (Cashflow)',
        definicion: 'La plata que entra y sale de tu negocio en el tiempo — no es lo mismo "tener ganancia en el papel" que "tener plata disponible hoy en la cuenta".',
        ejemplo: 'Podés tener presupuestos aprobados por $2.000.000, pero si todavía no te los pagaron, tu flujo de caja real puede estar en rojo aunque "en teoría" ganaste plata.',
      },
    ],
  },
  {
    slug: 'estrategia-y-operaciones',
    titulo: 'Estrategia y operaciones',
    terminos: [
      {
        slug: 'ceo-cfo-coo-cto',
        termino: 'CEO, CFO, COO, CTO',
        definicion: 'Los cargos más altos de una empresa, cada uno a cargo de un área: el CEO manda en general, el CFO maneja las finanzas, el COO la operación del día a día, y el CTO la parte tecnológica.',
        ejemplo: 'En una PyME chica, muchas veces UNA sola persona (el dueño) es las cuatro cosas a la vez — pero en una empresa grande cada una es un puesto distinto.',
      },
      {
        slug: 'mvp',
        termino: 'MVP',
        sigla: 'Minimum Viable Product (Producto Mínimo Viable)',
        definicion: 'Una versión bien básica de algo nuevo, que lanzás para probar si a la gente le interesa ANTES de gastar mucha plata terminándolo del todo.',
        ejemplo: 'En vez de gastar 6 meses armando un producto perfecto, sacás una versión simple en 2 semanas para ver si la gente lo compra — y si funciona, seguís mejorándolo.',
      },
      {
        slug: 'b2e',
        termino: 'B2E',
        sigla: 'Business to Employee',
        definicion: 'Estrategias o comunicación que la empresa dirige hacia adentro, a sus propios empleados — no al cliente.',
        ejemplo: 'Un sistema interno de comisiones o beneficios para motivar a tu equipo de vendedores es una acción B2E.',
      },
      {
        slug: 'benchmark',
        termino: 'Benchmark',
        definicion: 'Comparar cómo te va a vos contra cómo le va a la competencia o al promedio del rubro, para saber si estás bien o mal parado.',
        ejemplo: '"¿Cuánto cobra un servicio parecido al mío otra empresa de mi zona?" — eso es hacer benchmark.',
      },
      {
        slug: 'stakeholder',
        termino: 'Stakeholder',
        definicion: 'Cualquier persona o grupo que tiene algo que ver o que le importa cómo le va a tu negocio: dueños, empleados, clientes, proveedores.',
        ejemplo: 'Cuando decidís cambiar algo importante del negocio, pensás en cómo afecta a tus stakeholders — no solo a vos.',
      },
      {
        slug: 'pitch',
        termino: 'Pitch',
        definicion: 'Una explicación corta y clara de qué hacés y por qué alguien debería comprarte o invertir en vos — pensada para decirla en poco tiempo.',
        ejemplo: 'Si te preguntan "¿y vos a qué te dedicás?" en un ascensor y tenés que responder en 30 segundos, eso es tu pitch.',
      },
    ],
  },
  {
    slug: 'marketing-digital',
    titulo: 'Marketing digital',
    terminos: [
      {
        slug: 'lead',
        termino: 'Lead',
        definicion: 'Una persona que mostró interés en lo que vendés (dejó su contacto, preguntó, pidió un presupuesto) pero todavía no te compró.',
        ejemplo: 'Alguien que te escribe pidiendo un presupuesto es un lead — todavía no es cliente, pero ya está a un paso.',
      },
      {
        slug: 'funnel-de-ventas',
        termino: 'Funnel / Embudo de ventas',
        definicion: 'El recorrido que hace una persona desde que te conoce hasta que te compra — se llama "embudo" porque en cada paso se van quedando menos personas.',
        ejemplo: '100 personas ven tu publicidad → 20 piden presupuesto → 5 te compran. Ese achicamiento en cada etapa es el embudo.',
      },
      {
        slug: 'ctr',
        termino: 'CTR',
        sigla: 'Click Through Rate',
        definicion: 'El porcentaje de gente que hace clic en un anuncio o link, sobre el total que lo vio.',
        ejemplo: 'Si 1.000 personas vieron tu anuncio y 20 hicieron clic, tu CTR es del 2%.',
      },
      {
        slug: 'cpc',
        termino: 'CPC',
        sigla: 'Costo por Clic',
        definicion: 'Cuánto pagás, en promedio, cada vez que alguien hace clic en tu publicidad online.',
        ejemplo: 'Si gastaste $10.000 en un anuncio y te dio 50 clics, tu CPC fue de $200 por clic.',
      },
      {
        slug: 'tasa-de-conversion',
        termino: 'Tasa de conversión',
        definicion: 'El porcentaje de gente que termina haciendo lo que vos querías que haga (comprar, dejar el contacto, etc.), sobre el total que llegó a ver tu oferta.',
        ejemplo: 'Si 200 personas entraron a tu tienda online y 8 compraron, tu tasa de conversión es del 4%.',
      },
      {
        slug: 'seo-sem',
        termino: 'SEO / SEM',
        sigla: 'Search Engine Optimization / Marketing',
        definicion: 'SEO es lograr aparecer arriba en Google de forma gratuita, mejorando tu contenido y tu web. SEM es aparecer arriba pagando publicidad.',
        ejemplo: 'Que alguien busque "qué es ROI" en Google y llegue a este mismo glosario, sin que hayamos pagado nada por ese clic — eso es SEO funcionando.',
      },
      {
        slug: 'buyer-persona',
        termino: 'Buyer persona',
        definicion: 'Un perfil inventado, pero basado en datos reales, que representa a tu cliente ideal — para saber a quién le estás hablando.',
        ejemplo: '"María, 45 años, dueña de un taller de costura, no es de mucha tecnología" — pensar en ese perfil te ayuda a decidir cómo comunicarte.',
      },
    ],
  },
  {
    slug: 'atencion-al-cliente-y-ventas',
    titulo: 'Atención al cliente y ventas',
    terminos: [
      {
        slug: 'churn',
        termino: 'Churn',
        definicion: 'El porcentaje de clientes que dejan de comprarte o cancelan en un período determinado.',
        ejemplo: 'Si tenías 50 clientes con suscripción activa y este mes se fueron 3, tu churn del mes es del 6%.',
      },
      {
        slug: 'nps',
        termino: 'NPS',
        sigla: 'Net Promoter Score',
        definicion: 'Una encuesta simple ("del 0 al 10, ¿nos recomendarías?") que mide qué tan contentos están tus clientes, con un solo número.',
        ejemplo: 'Muchas empresas grandes te la mandan por mail después de una compra — es la típica pregunta "del 0 al 10".',
      },
      {
        slug: 'upsell-cross-sell',
        termino: 'Upsell / Cross-sell',
        definicion: 'Upsell es venderle a un cliente una versión MEJOR o más cara de lo que ya iba a comprar. Cross-sell es venderle algo ADICIONAL, relacionado.',
        ejemplo: '"¿Querés el plan PRO en vez del básico?" es upsell. "¿Le sumamos también el servicio de instalación?" es cross-sell.',
      },
      {
        slug: 'pipeline-de-ventas',
        termino: 'Pipeline de ventas',
        definicion: 'La lista de todos los negocios que estás gestionando en este momento, ordenados según en qué etapa están (contactado, presupuesto enviado, negociando, cerrado).',
        ejemplo: 'Tu pantalla de Presupuestos, filtrada por estado, es básicamente tu pipeline de ventas.',
      },
    ],
  },
  {
    slug: 'recursos-humanos',
    titulo: 'Recursos Humanos',
    terminos: [
      {
        slug: 'onboarding',
        termino: 'Onboarding',
        definicion: 'El proceso de recibir y capacitar a alguien nuevo — un empleado o un cliente — para que empiece a andar solo lo antes posible.',
        ejemplo: 'Los primeros días explicándole a un vendedor nuevo cómo se usa el sistema, cómo se cargan los presupuestos, etc.',
      },
      {
        slug: 'turnover',
        termino: 'Turnover (Rotación de personal)',
        definicion: 'Qué tan seguido se van y entran empleados nuevos en tu negocio.',
        ejemplo: 'Si cada 3 meses se te va alguien del equipo y tenés que volver a capacitar a otro, tenés un turnover alto — vale la pena preguntarse por qué.',
      },
      {
        slug: 'feedback',
        termino: 'Feedback',
        definicion: 'Una devolución sobre cómo está haciendo algo una persona — puede ser para corregir o para reforzar lo que está bien.',
        ejemplo: 'Sentarte con un vendedor a charlar qué hizo bien y qué podría mejorar en el último mes es darle feedback.',
      },
    ],
  },
  {
    slug: 'fiscal-y-legal-argentina',
    titulo: 'Fiscal y legal (Argentina)',
    disclaimer: true,
    terminos: [
      {
        slug: 'monotributo-vs-responsable-inscripto',
        termino: 'Monotributo vs. Responsable Inscripto',
        definicion: 'Son dos formas distintas de estar inscripto ante ARCA (ex AFIP) para facturar. El Monotributo es un régimen simplificado, con una cuota fija mensual, pensado para negocios más chicos. Ser Responsable Inscripto es el régimen general — más trámite, pero sin techo de facturación.',
        ejemplo: 'Un emprendedor que recién arranca suele estar en Monotributo; una empresa que ya factura mucho más suele pasar a Responsable Inscripto.',
      },
      {
        slug: 'cuit',
        termino: 'CUIT',
        sigla: 'Código Único de Identificación Tributaria',
        definicion: 'El número que te identifica ante ARCA para cualquier trámite impositivo — es como tu "DNI" para todo lo fiscal.',
        ejemplo: 'Todas tus facturas, presupuestos y trámites impositivos van a llevar tu CUIT.',
      },
      {
        slug: 'factura-a-b-c',
        termino: 'Factura A / B / C',
        definicion: 'Distintos tipos de factura según quién le vende a quién. En general: la Factura A es entre dos Responsables Inscriptos, la B es de un Responsable Inscripto a un consumidor final o Monotributista, y la C la emite un Monotributista.',
        ejemplo: 'Un Monotributista que le vende a una persona particular emite Factura C.',
      },
      {
        slug: 'cae',
        termino: 'CAE',
        sigla: 'Código de Autorización Electrónico',
        definicion: 'El código que le pone ARCA a cada factura electrónica para autorizarla — sin ese código, la factura no es válida.',
        ejemplo: 'Cuando facturás electrónicamente, ARCA te devuelve el CAE que queda impreso en el comprobante.',
      },
    ],
  },
]
