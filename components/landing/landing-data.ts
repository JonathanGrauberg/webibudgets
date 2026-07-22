export const dashboardHref = '/auth/login'

export const navLinks = [
  { label: 'Dashboard', href: '#hero' },
  { label: 'Funciones', href: '#features' },
  { label: 'Precios', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contactanos', href: '#cta' },
]

export const sidebarItems = [
  { label: 'Dashboard', icon: 'LayoutGrid', active: true },
  { label: 'Clientes', icon: 'Users' },
  { label: 'Productos y Servicios', icon: 'Package' },
  { label: 'Presupuestos', icon: 'FileText' },
  { label: 'Rendiciones', icon: 'Handshake' }, // Agregado módulo clave
  { label: 'Documentos', icon: 'FileCheck' },  // Agregado módulo clave
  { label: 'Stock', icon: 'Layers' },
  { label: 'Equipo', icon: 'UserCheck' },
]

export const dashboardStats = [
  { label: 'Ingresos Aprobados', value: '$1.2M', sub: 'Mes en curso', icon: 'DollarSign' },
  { label: 'Pipeline Cotizado', value: '$450K', sub: 'En negociación', icon: 'TrendingUp' },
  { label: 'Presupuestos', value: '28', sub: 'Emitidos', icon: 'FileText' },
  { label: 'Conversión', value: '68%', sub: 'Efectividad de cierre', icon: 'CheckCircle' },
]

// 🚀 FEATURES REESTRUCTURADOS CON EL VALOR REAL DEL SISTEMA
export const features = [
  {
    icon: 'Calculator',
    title: 'Calculadora de Medidas e Ítems Libres',
    description: 'Cotizá por m², metros lineales o volumen al instante. Agregá ítems "On-the-fly" fuera de catálogo sin perder agilidad.',
  },
  {
    icon: 'FileCheck',
    title: 'Documentos Operativos con QR',
    description: 'Transformá presupuestos en Recibos de cobro, Remitos de entrega y Órdenes de Trabajo con numeración y QR de verificación.',
  },
  {
    icon: 'Handshake',
    title: 'Rendiciones y Reparto de Ganancias',
    description: 'Auditá la utilidad neta por proyecto. Distribuí porcentajes (%) o montos fijos en dinero entre socios, vendedores y personal.',
  },
  {
    icon: 'BarChart3',
    title: 'Dashboard Comercial e Inteligencia BI',
    description: 'Monitoreá tu pipeline en cotización, efectividad de cierre y detectá tus productos o servicios más cotizados en tiempo real.',
  },
  {
    icon: 'Palette',
    title: 'Branding & Marca Blanca Avanzada',
    description: 'Personalizá el PDF con tus colores HEX, marcas de agua adaptativas, logos y firma digital para proyectar máxima confianza.',
  },
  {
    icon: 'Boxes',
    title: 'Control de Stock y Variantes',
    description: 'Manejá inventarios con variantes por talle/color, alertas de stock bajo y actualización masiva de precios en lote.',
  },
]

export const brandSwatches = ['#111111', '#3f3f46', '#71717a', '#a1a1aa', '#e4e4e7']

export const testimonials = [
  {
    name: 'María González',
    role: 'Fundadora',
    company: 'Estudio Neostone',
    rating: 5,
    image: 'MG',
    content: '.budgets ordenó por completo nuestra forma de cotizar. Poder calcular metros cuadrados al vuelo y emitir la orden de trabajo con QR nos cambió la operación.',
  },
  {
    name: 'Lucas Fernández',
    role: 'Director Comercial',
    company: 'BuildPro',
    rating: 5,
    image: 'LF',
    content: 'El módulo de Rendiciones es clave: nos permite saber el margen exacto de ganancia de cada presupuesto y liquidar comisiones al equipo sin planillas extra.',
  },
  {
    name: 'Sofía Ramírez',
    role: 'Diseñadora',
    company: 'CreativeHub',
    rating: 5,
    image: 'SR',
    content: 'Poder mantener mi identidad de marca en cada PDF hace que las propuestas parezcan de una multinacional. A los clientes les encanta la prolijidad.',
  },
  {
    name: 'Diego Pérez',
    role: 'CEO',
    company: 'ServiceMax',
    rating: 5,
    image: 'DP',
    content: 'Simple, rápido y potente. Pasamos de demorar medio día en preparar cotizaciones complejas a resolverlas en menos de 2 minutos.',
  },
]

export const brandStats = [
  { value: '12K+', label: 'Presupuestos generados' },
  { value: '98%', label: 'Clientes satisfechos' },
  { value: '24/7', label: 'Soporte disponible' },
]

// ❓ FAQS ENFOCADAS EN DERRIBAR OBJECIONES REALES DE USO
export const faqs = [
  {
    question: '¿Puedo presupuestar productos a medida o fuera de mi catálogo?',
    answer: '¡Sí, totalmente! Podés usar el botón "Item Libre" para crear servicios al vuelo, o activar la calculadora por dimensiones (ancho y alto) para obtener totales automáticos por m², metro lineal o volumen.',
  },
  {
    question: '¿Cómo funciona el control de ganancias y rendiciones?',
    answer: 'El módulo de Rendiciones te permite transparentar la utilidad neta de cada trabajo. Podés desglosar automáticamente el porcentaje (%) o monto fijo ($) a distribuir entre vendedores, instaladores o socios.',
  },
  {
    question: '¿Puedo generar remitos u órdenes de trabajo desde el sistema?',
    answer: 'Sí. A partir de cualquier presupuesto podés emitir al instante Recibos de cobro, Remitos de entrega u Órdenes de Trabajo vinculadas, incluyendo numeración y código QR de validación.',
  },
  {
    question: '¿Los PDFs de los presupuestos llevan mi propia marca?',
    answer: 'Sí, de eso se trata .budgets. Podés personalizar el logo, favicon, colores HEX primarios/secundarios, marca de agua y pie con firma digital para mantener una marca blanca profesional.',
  },
  {
    question: '¿Cómo gestiono los permisos de mi equipo de trabajo?',
    answer: 'Desde el módulo de Equipo podés dar de alta usuarios y asignar roles específicos (Administrador, Vendedor, Instalador, Visualizador) para que cada persona acceda únicamente a lo que necesita.',
  },
  {
    question: '¿Necesito tarjeta de crédito para empezar?',
    answer: 'No. Podés crear tu cuenta y comenzar a explorar la plataforma sin ingresar ningún dato de pago.',
  },
]

// Nota: Conservamos los planes tal como están para revisarlos otro día
export const plans = [
  {
    name: 'Básico',
    description: 'Ideal para emprendedores y profesionales.',
    price: '$0,990',
    period: '/mes',
    cta: 'Comenzar',
    featured: false,
    features: [
      'Hasta 30 presupuestos por mes',
      '1 usuario',
      'Gestión de clientes',
      'Gestión de vendedores',
      'Gestión de instaladores',
      'Control de stock',
      'Exportación PDF',
      'Branding personalizado',
      'Soporte por email',
    ],
  },
  {
    name: 'Negocio',
    description: 'Para equipos en crecimiento.',
    price: '$5,990',
    period: '/mes',
    cta: 'Elegir Negocio',
    featured: true,
    features: [
      'Presupuestos ilimitados',
      'Hasta 5 usuarios',
      'Gestión completa del sistema',
      'Control de stock',
      'Branding personalizado',
      'Roles y permisos',
      'Soporte prioritario',
      'Asistencia personalizada',
    ],
  },
  {
    name: 'Empresa',
    description: 'Pensado para empresas con múltiples usuarios.',
    price: '$19,990',
    period: '/mes',
    cta: 'Contactar ventas',
    featured: false,
    features: [
      'Todo lo incluido en Negocio',
      'Usuarios ilimitados',
      'Presupuestos ilimitados',
      'Roles avanzados',
      'Atención 24/7',
      'Onboarding dedicado',
      'Asistencia personalizada',
      'Implementación acompañada',
    ],
  },
]