export const dashboardHref = '/auth/login'

export const navLinks = [
  { label: 'Dashboard', href: '#hero' },
  { label: 'Clientes', href: '#features' },
  { label: 'Productos', href: '#productos' },
  { label: 'Presupuestos', href: '#pricing' },
  { label: 'Vendedores', href: '#testimonials' },
  { label: 'Stock', href: '#faq' },
  { label: 'Configuración', href: '#footer' },
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
    description: 'Personalizá colores, logo y tipografías para que todo refleje tu negocio.',
  },
  {
    icon: 'Share2',
    title: 'Compartí en un clic',
    description: 'Enviá presupuestos por link o PDF y mantené a tus clientes siempre al día.',
  },
  {
    icon: 'Download',
    title: 'Exportá a PDF',
    description: 'Descargá documentos prolijos y consistentes con un diseño impecable.',
  },
]

export const plans = [
  {
    name: 'Inicial',
    description: 'Para emprendedores que empiezan.',
    price: '$0',
    period: '/mes',
    cta: 'Empezar gratis',
    featured: false,
    features: ['Hasta 10 presupuestos', '1 usuario', 'Gestión de clientes', 'Exportar a PDF'],
  },
  {
    name: 'Negocio',
    description: 'Para equipos en crecimiento.',
    price: '$29',
    period: '/mes',
    cta: 'Probar Negocio',
    featured: true,
    features: ['Presupuestos ilimitados', 'Hasta 5 usuarios', 'Control de stock', 'Identidad de marca', 'Soporte prioritario'],
  },
  {
    name: 'Empresa',
    description: 'Para operaciones a gran escala.',
    price: '$79',
    period: '/mes',
    cta: 'Contactar ventas',
    featured: false,
    features: ['Todo en Negocio', 'Usuarios ilimitados', 'Reportes avanzados', 'Acceso por roles', 'Onboarding dedicado'],
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
    answer: 'Sí. Podés ajustar colores, subir tu logo y elegir tipografías para que todo coincida con tu marca.',
  },
  {
    question: '¿Cuántos usuarios puedo agregar?',
    answer: 'Depende del plan. El plan Negocio incluye hasta 5 usuarios y el plan Empresa ofrece usuarios ilimitados.',
  },
  {
    question: '¿Mis datos están seguros?',
    answer: 'Tus datos se almacenan de forma segura con cifrado y respaldos automáticos para que nunca pierdas información.',
  },
  {
    question: '¿Puedo cancelar cuando quiera?',
    answer: 'Por supuesto. No hay contratos ni permanencia: podés cancelar tu suscripción en cualquier momento.',
  },
]
