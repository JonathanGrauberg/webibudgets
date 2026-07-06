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
  { label: 'Vendedores', icon: 'UserCheck' },
  { label: 'Stock', icon: 'Layers' },
  { label: 'Usuarios', icon: 'User' },
]

export const dashboardStats = [
  { label: 'Clientes', value: '1', sub: 'Registrados', icon: 'Users' },
  { label: 'Servicios', value: '1', sub: 'Activos', icon: 'Package' },
  { label: 'Presupuestos', value: '1', sub: 'Creados', icon: 'FileText' },
  { label: 'Aprobados', value: '0', sub: 'Confirmados', icon: 'CheckCircle' },
  { label: 'Pendientes', value: '1', sub: 'En gestión', icon: 'Clock' },
]

export const features = [
  {
    icon: 'FileText',
    title: 'Presupuestos profesionales',
    description: 'Generá cotizaciones claras y elegantes en minutos, listas para enviar a tus clientes.',
  },
  {
    icon: 'Users',
    title: 'Gestión de clientes',
    description: 'Centralizá la información de cada cliente y seguí el historial de cada presupuesto.',
  },
  {
    icon: 'Package',
    title: 'Productos y servicios',
    description: 'Catálogo organizado con precios, stock y categorías para armar presupuestos al instante.',
  },
  {
    icon: 'Palette',
    title: 'Identidad de marca',
    description: 'Personalizá colores, logo y marca de agua para que todo refleje tu negocio.',
  },
  {
    icon: 'UsersRound',
    title: 'Gestión de equipos',
    description: 'Administrá vendedores, instaladores y usuarios con permisos según cada rol.',
  },
  {
    icon: 'Download',
    title: 'Exportá a PDF',
    description: 'Descargá documentos prolijos y consistentes con un diseño impecable.',
  },
]

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

export const brandSwatches = ['#111111', '#3f3f46', '#71717a', '#a1a1aa', '#e4e4e7']

export const testimonials = [
  {
    name: 'María González',
    role: 'Fundadora',
    company: 'Estudio Neostone',
    rating: 5,
    image: 'MG',
    content: 'Webi Studio ordenó por completo nuestra forma de cotizar. Lo que antes nos llevaba horas ahora lo resolvemos en minutos.',
  },
  {
    name: 'Lucas Fernández',
    role: 'Director Comercial',
    company: 'BuildPro',
    rating: 5,
    image: 'LF',
    content: 'La gestión de clientes y presupuestos en un solo lugar nos cambió la operación. El diseño es impecable y muy claro.',
  },
  {
    name: 'Sofía Ramírez',
    role: 'Diseñadora',
    company: 'CreativeHub',
    rating: 5,
    image: 'SR',
    content: 'Poder mantener mi identidad de marca en cada documento hace que mis presupuestos se vean realmente profesionales.',
  },
  {
    name: 'Diego Pérez',
    role: 'CEO',
    company: 'ServiceMax',
    rating: 5,
    image: 'DP',
    content: 'Simple, rápido y elegante. Exactamente lo que necesitábamos para profesionalizar nuestra gestión.',
  },
]

export const brandStats = [
  { value: '12K+', label: 'Presupuestos generados' },
  { value: '98%', label: 'Clientes satisfechos' },
  { value: '24/7', label: 'Soporte disponible' },
]

export const faqs = [
  {
    question: '¿Necesito tarjeta de crédito para empezar?',
    answer: 'No. Podés crear tu cuenta y usar el plan inicial sin ingresar ningún dato de pago.',
  },
  {
    question: '¿Puedo personalizar el diseño de mis presupuestos?',
    answer: 'Sí. de eso se trata .budgets, creá tu presupuesto con tu logo, tu marca, tus colores.',
  },
  {
    question: '¿Cuántos usuarios puedo agregar?',
    answer: 'Depende del plan. tocá en "Precios" para ver los detalles de cada uno, o contactanos para asesorarte sobre cuál es el mejor para vos.',
  },
  {
    question: '¿Mis datos están seguros?',
    answer: 'Tus datos son solo tuyos. tus datos estan cifrados y protegidos. No compartimos tu información con terceros.',
  },
  {
    question: '¿Puedo cancelar cuando quiera?',
    answer: 'Por supuesto. No hay contratos ni permanencia: podés cancelar tu suscripción en cualquier momento.',
  },
]
