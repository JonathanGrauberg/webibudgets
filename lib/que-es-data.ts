// lib/que-es-data.ts
//
// Contenido de la página pública /que-es — "todo lo que hace .budgets",
// módulo por módulo. Misma fuente que el PDF descargable
// (public/budgets-que-es-y-que-hace.pdf): si se agrega o cambia un módulo,
// actualizar ambos.

export interface QueEsBloque {
  titulo: string
  desc: string
  items: string[]
  proItems?: string[]
}

export interface QueEsSeccion {
  slug: string
  kicker: string
  titulo: string
  subtitulo: string
  bloques: QueEsBloque[]
}

export const QUE_ES_SECCIONES: QueEsSeccion[] = [
  {
    slug: 'dashboard',
    kicker: 'Visión general',
    titulo: 'Dashboard',
    subtitulo: 'La foto del negocio al entrar — sin tener que ir módulo por módulo a buscarla.',
    bloques: [
      {
        titulo: 'Métricas del período, en un vistazo',
        desc: 'Lo primero que ves al entrar, con filtro por Este mes / Este año / Histórico.',
        items: [
          'Cobrado vs. Por cobrar: cuánto entró de verdad (recibos + Mercado Pago + Cobros) contra el saldo pendiente de tus presupuestos aprobados — dos números separados a propósito, para no mezclar lo presupuestado con lo efectivamente cobrado.',
          'Documentos: total facturado según recibos emitidos en el período.',
          'Gastos: lo que salió del negocio en el mismo rango de fechas.',
          'Gráfico de movimientos día por día (últimos 30 días) con tres líneas — Cobros, Documentos y Gastos — para ver en qué momentos del mes entra y sale más plata.',
        ],
      },
      {
        titulo: 'Business Intelligence',
        desc: 'Un paso más allá de las métricas simples, para entender mejor a tus clientes y tu negocio.',
        items: [
          'Top 5 clientes: ranking por lo facturado en presupuestos aprobados y completados.',
          'Indicadores de evolución respecto del período anterior.',
        ],
      },
    ],
  },
  {
    slug: 'presupuestos',
    kicker: 'El corazón del sistema',
    titulo: 'Presupuestos',
    subtitulo: 'Cotizar rápido, con cálculos automáticos y un PDF prolijo para el cliente.',
    bloques: [
      {
        titulo: 'Armar una cotización',
        desc: 'Elegís cliente, agregás ítems, y el sistema hace las cuentas.',
        items: [
          'Ítems desde tu catálogo de Productos y Servicios, o ítems "al vuelo" escritos en el momento (nombre, precio y costo) sin necesidad de tenerlos precargados.',
          'Cálculo automático de subtotal, descuento, impuestos y envío.',
          'Notas, condiciones de pago, y adjunto de tus condiciones comerciales en PDF si las tenés cargadas.',
          'Sin límite de cantidad de presupuestos por mes, ni en el plan gratuito.',
          'Estados: Borrador → Enviado → Aprobado / Rechazado / Vencido → Completado. Solo los Aprobados y Completados entran en Rendiciones.',
          'Sección de "Información adicional" para cualquier dato libre que no tenga campo propio (ej. plazo de entrega) — se imprime en el PDF.',
          'PDF del presupuesto con tu marca: logo, colores y la plantilla de diseño que elijas.',
        ],
        proItems: [
          'Calculadora automática por medidas: para productos/servicios en m², m³, kg, horas o metros lineales, cargás ancho×alto (o desde/hasta, o el valor directo) y el sistema calcula la cantidad y el precio solo — pensado para construcción, textiles, o cualquier rubro que cobre por superficie, volumen o tiempo.',
        ],
      },
    ],
  },
  {
    slug: 'clientes',
    kicker: 'Base de datos comercial',
    titulo: 'Clientes',
    subtitulo: 'Una ficha por cliente, sin duplicados y con quién te compró más.',
    bloques: [
      {
        titulo: 'Gestión de clientes',
        desc: 'Alta rápida, sin fricción, con avisos para no llenar la base de repetidos.',
        items: [
          'Detección en vivo de posibles duplicados mientras escribís nombre, empresa, teléfono o dirección — con un clic pasás a editar el existente en vez de crear uno nuevo.',
          'El teléfono es opcional: se puede guardar un cliente sin dato de contacto todavía.',
          'Ranking de mejores clientes disponible directo desde el Dashboard.',
        ],
      },
    ],
  },
  {
    slug: 'productos-y-stock',
    kicker: 'Catálogo e inventario',
    titulo: 'Productos, Servicios y Stock',
    subtitulo: 'Tu catálogo con precio y costo, y un control simple de inventario.',
    bloques: [
      {
        titulo: 'Catálogo de productos y servicios',
        desc: 'La base que después usás al armar presupuestos.',
        items: [
          'Precio, costo, categoría y unidad de medida por producto o servicio — el costo es lo que permite calcular la ganancia real en Rendiciones.',
          'Categorías propias, además de las predefinidas del sistema.',
        ],
        proItems: ['Variantes de producto (ej. color, talle) con stock propio por variante.'],
      },
      {
        titulo: 'Control de stock',
        desc: 'Manual y simple a propósito — .budgets no es un sistema puramente de inventario.',
        items: [
          'El stock no se descuenta solo al aprobar o completar un presupuesto: lo manejás con movimientos de entrada/salida (ej. al recibir mercadería o hacer un ajuste por conteo físico).',
          'Al armar un presupuesto, si un producto no tiene cantidad suficiente el sistema te avisa — es una alerta, no un bloqueo.',
          'Los productos con menos de 10 unidades se marcan como "Stock bajo" de un vistazo.',
        ],
        proItems: ['Actualización masiva de precios: aplicá un % de aumento (o descuento) a todo el catálogo o solo a una categoría, sin editar producto por producto.'],
      },
    ],
  },
  {
    slug: 'documentos',
    kicker: 'Papelería del trabajo',
    titulo: 'Documentos: Recibos, Remitos y Órdenes de Trabajo',
    subtitulo: 'Todo lo que se genera a partir de un presupuesto aprobado.',
    bloques: [
      {
        titulo: 'Recibos',
        desc: 'Registran un cobro — en efectivo, transferencia o disparados automáticamente por un pago de Mercado Pago.',
        items: ['Quedan asociados al presupuesto y suman al "Cobrado" real del negocio.'],
      },
      {
        titulo: 'Remitos',
        desc: 'Para dejar constancia de la entrega de mercadería.',
        items: ['Documento propio, imprimible, vinculado al presupuesto correspondiente.'],
      },
      {
        titulo: 'Órdenes de Trabajo',
        desc: 'Para coordinar la instalación o ejecución con tu equipo en el campo.',
        items: [
          'Cada Orden trae un código QR en el PDF impreso: al escanearlo, el instalador ve la ubicación, el checklist y los materiales — pero necesita iniciar sesión con una cuenta real, no cualquiera que escanee el papel puede verlo.',
        ],
      },
    ],
  },
  {
    slug: 'cobros',
    kicker: 'Que te paguen, de la forma que sea',
    titulo: 'Cobros',
    subtitulo: 'Cobro online directo a tu cuenta, o cargos recurrentes sin armar un presupuesto nuevo cada vez.',
    bloques: [
      {
        titulo: 'Cobros online con Mercado Pago',
        desc: 'Tu cliente paga sin salir de .budgets, y la plata cae directo a TU cuenta de Mercado Pago.',
        items: [
          'Vinculás tu cuenta de Mercado Pago una sola vez (como cualquier "iniciar sesión con Google") — .budgets nunca ve tu contraseña.',
          'Link de pago para compartir (o botón directo de WhatsApp): el cliente ve el presupuesto y paga sin necesidad de cuenta propia.',
          'Podés pedir una seña (% o monto fijo) en vez del total — el cliente elige entre esa seña o pagar todo, nunca un monto libre.',
          'Cuando llega el pago, una campanita te avisa al lado del presupuesto y generás el recibo con un clic.',
          '100% opcional: convive perfecto con seguir cobrando en efectivo/transferencia y cargar el recibo a mano.',
          'Mercado Pago cobra su propia comisión por procesar el pago, aparte de la del plan — y por defecto acredita a 35 días, no al instante: es una configuración de tu cuenta de MP que conviene revisar antes de arrancar.',
        ],
      },
      {
        titulo: 'Cobros recurrentes (cuotas, mantenimiento, suscripciones)',
        desc: 'Para lo que le cobrás siempre igual a un cliente, sin rearmar un presupuesto cada mes.',
        items: [
          'Elegís cliente, concepto y monto — es un documento propio, no se mezcla con presupuestos ni recibos.',
          '"Reutilizar" clona el cobro del mes anterior para el período siguiente, en un paso.',
          'Se cobra igual que un presupuesto: link de pago, WhatsApp, o "Marcar pagado" a mano (con método y fecha real del pago) si te transfirieron directo.',
          'Podés traer el monto desde un producto/servicio de tu catálogo en vez de tipearlo, y dejar cargado un alias de transferencia propio como alternativa a Mercado Pago.',
        ],
      },
    ],
  },
  {
    slug: 'gastos',
    kicker: 'El otro lado de la cuenta',
    titulo: 'Gastos',
    subtitulo: 'Lo que sale del negocio, para saber la ganancia real — no solo lo facturado.',
    bloques: [
      {
        titulo: 'Registro de gastos',
        desc: 'Generales del negocio, o puntuales de un trabajo específico.',
        items: [
          'Categoría, monto, medio de pago y fecha.',
          'Un gasto puede asociarse a un presupuesto puntual (ej. viáticos de una instalación) — resta de la ganancia de ESE trabajo en Rendiciones, no de otro.',
          'Información sensible: visible solo para roles Admin y Owner.',
        ],
      },
    ],
  },
  {
    slug: 'tareas',
    kicker: 'Organización del equipo',
    titulo: 'Tareas',
    subtitulo: 'Un tablero para que el equipo sepa qué hay que hacer.',
    bloques: [
      {
        titulo: 'Tablero Kanban',
        desc: 'Columnas por estado — pendiente, en curso, hecho.',
        items: ['Cada tarea puede vincularse a un presupuesto o cliente puntual.'],
        proItems: [
          'Modo Kiosco: pantalla pensada para dejar fija en una tablet colgada en el taller, con letra grande y tableros organizados por solapas — para que el equipo vea el trabajo del día sin entrar al sistema desde el celular.',
        ],
      },
    ],
  },
  {
    slug: 'personal-e-instaladores',
    kicker: 'Tu gente en campo',
    titulo: 'Personal e instaladores',
    subtitulo: 'Agenda de contactos operativos, con o sin acceso al sistema.',
    bloques: [
      {
        titulo: 'Dos formas de cargar a alguien',
        desc: 'Según si necesita entrar al sistema o es solo un dato de agenda.',
        items: [
          'Perfil simple (Personal → "+ Nuevo personal"): solo un dato de contacto, sin acceso a la app.',
          'Cuenta de usuario con rol "Instalador": tiene login real, y es la única forma de aparecer disponible para asignar en una Orden de Trabajo (el QR de la orden exige iniciar sesión).',
        ],
      },
    ],
  },
  {
    slug: 'rendiciones',
    kicker: 'La plata, repartida bien',
    titulo: 'Rendiciones',
    subtitulo: 'Cuánto se facturó, cuánto costó, cuánto quedó de ganancia — y cómo se reparte.',
    bloques: [
      {
        titulo: 'Cierre de cuentas por período',
        desc: 'Junta todo lo cobrado en un rango de fechas y calcula la rentabilidad real.',
        items: [
          'Incluye presupuestos con algo cobrado (total o parcial, por recibo, Mercado Pago o Cobros vinculados) y también los Cobros recurrentes sin presupuesto, en un bloque aparte.',
          'Un recibo o pago nuevo dentro del período aparece solo, sin tener que "regenerar" nada a mano.',
          'Reparto de la ganancia por porcentaje editable entre los integrantes del equipo, guardado con historial de auditoría.',
          'Mientras está en borrador se puede seguir ajustando; al cerrarla, los números quedan fijos como una foto congelada.',
        ],
        proItems: ['La distribución automática de ganancias entre socios/vendedores por presupuesto es una función exclusiva del plan PRO.'],
      },
    ],
  },
  {
    slug: 'equipo-y-configuracion',
    kicker: 'Tu marca, tu equipo, tus reglas',
    titulo: 'Equipo, roles y configuración',
    subtitulo: 'Quién puede ver y hacer qué, y cómo se ve todo hacia afuera.',
    bloques: [
      {
        titulo: 'Roles de usuario',
        desc: 'Cada cuenta tiene un rol, con permisos distintos.',
        items: [
          'Owner y Admin: control total, incluyendo Gastos y configuración del negocio.',
          'Vendedor: presupuestos, clientes y cobros — sin acceso a información financiera sensible.',
          'Instalador: solo ve lo necesario para ejecutar sus Órdenes de Trabajo asignadas (QR, checklist, materiales, ubicación).',
          'Viewer: acceso de solo lectura.',
          'Cantidad de usuarios según el límite de tu plan.',
        ],
      },
      {
        titulo: 'Marca y diseño del PDF',
        desc: 'Para que todo lo que le mandás al cliente se vea con tu identidad, no la de .budgets.',
        items: [
          'Logo, favicon y colores propios, aplicados tanto en el sistema como en los PDF.',
          'Varias plantillas de diseño para el PDF de presupuesto, con detalles configurables (número de página, tu web en el pie, etc.).',
        ],
      },
    ],
  },
]

export interface PlanFeatureRow {
  label: string
  free: boolean
  pro: boolean
}

export const PLAN_FEATURES: PlanFeatureRow[] = [
  { label: 'Presupuestos ilimitados', free: true, pro: true },
  { label: 'Clientes, productos y stock básico', free: true, pro: true },
  { label: 'Cobros online con Mercado Pago', free: true, pro: true },
  { label: 'Cobros recurrentes y Documentos', free: true, pro: true },
  { label: 'Tablero de Tareas', free: true, pro: true },
  { label: 'Calculadora automática por medidas', free: false, pro: true },
  { label: 'Variantes de producto', free: false, pro: true },
  { label: 'Actualización masiva de precios', free: false, pro: true },
  { label: 'Reparto de ganancias entre vendedores', free: false, pro: true },
  { label: 'Órdenes de Trabajo con QR', free: false, pro: true },
  { label: 'Modo Kiosco', free: false, pro: true },
]
