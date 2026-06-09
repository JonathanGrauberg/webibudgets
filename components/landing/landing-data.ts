export const features = [
  { icon: 'FileText', title: 'Presupuestos inteligentes', description: 'Creá presupuestos profesionales en segundos con plantillas inteligentes y cálculos automáticos.' },
  { icon: 'Download', title: 'Exportación PDF con un clic', description: 'Exportá presupuestos y facturas como PDFs con tu logo y colores de marca.' },
  { icon: 'Users', title: 'Gestión de clientes', description: 'Organizá y seguí a todos tus clientes en una base de datos centralizada y fácil de buscar.' },
  { icon: 'Package', title: 'Catálogo de productos', description: 'Mantené un catálogo completo de productos y servicios con precios y descripciones.' },
  { icon: 'Palette', title: 'Personalización de marca', description: 'Personalizá colores, fuentes y diseños para que coincidan perfectamente con tu identidad.' },
  { icon: 'Share2', title: 'Multi-empresa', description: 'Perfecto para agencias que gestionan múltiples marcas con aislamiento total de datos.' },
]

export const plans = [
  {
    name: 'Starter',
    description: 'Ideal para freelancers y equipos pequeños',
    price: '$29',
    period: '/mes',
    cta: 'Empezar',
    featured: false,
    features: ['Hasta 50 presupuestos/mes', '5 perfiles de clientes', 'Plantillas básicas', 'Exportación PDF', 'Soporte por email', '1 cuenta de usuario'],
  },
  {
    name: 'Team',
    description: 'Para empresas en crecimiento y agencias',
    price: '$79',
    period: '/mes',
    cta: 'Probar gratis 14 días',
    featured: true,
    features: ['Presupuestos ilimitados', 'Clientes ilimitados', 'Plantillas avanzadas', 'PDFs con marca propia', 'Soporte prioritario', 'Hasta 5 usuarios', 'Branding personalizado', 'Colaboración en tiempo real'],
  },
  {
    name: 'Business',
    description: 'Para empresas con necesidades complejas',
    price: 'A consultar',
    period: '',
    cta: 'Contactar ventas',
    featured: false,
    features: ['Todo lo de Team +', 'Usuarios ilimitados', 'Acceso avanzado a API', 'Soluciones white-label', 'Gerente de cuenta dedicado', 'Integraciones personalizadas', 'Garantía SLA', 'Analytics avanzado'],
  },
]

export const testimonials = [
  { name: 'Sarah Chen', role: 'Fundadora, Estudio de Diseño', company: 'Chen Creative', image: 'SC', content: 'WebiBudgets transformó completamente cómo manejamos los presupuestos. El tiempo de respuesta a clientes bajó un 60% y la facturación está totalmente automatizada.', rating: 5 },
  { name: 'Marcos Rodríguez', role: 'Gerente de Operaciones', company: 'BuildRight Construcción', image: 'MR', content: 'Gestionar múltiples proyectos y clientes era una pesadilla. Ahora todo está organizado, el equipo colabora sin fricciones y casi nunca perdemos un plazo.', rating: 5 },
  { name: 'Elena Kowalski', role: 'CEO', company: 'Digital Agency Plus', image: 'EK', content: 'El white-label es un cambio de juego para nuestra agencia. Los clientes adoran los presupuestos profesionales y podemos mantener nuestra marca en todo el proceso.', rating: 5 },
  { name: 'David Thompson', role: 'Consultor Independiente', company: 'Freelance', image: 'DT', content: 'Como consultor solo, esta plataforma cubre todo lo que necesito. Fácil de usar, presupuestos hermosos y el soporte al cliente es increíblemente rápido.', rating: 5 },
]

export const faqs = [
  { question: '¿Qué métodos de pago aceptan?', answer: 'Aceptamos todas las tarjetas de crédito principales (Visa, Mastercard, American Express), PayPal y transferencias bancarias para planes anuales. Los pagos se procesan de forma segura a través de Stripe.' },
  { question: '¿Puedo cambiar de plan en cualquier momento?', answer: 'Sí. Podés subir o bajar de plan cuando quieras. Los cambios se aplican de inmediato y ajustamos el cobro de forma proporcional.' },
  { question: '¿Hay límite de usuarios?', answer: 'El plan Starter incluye 1 usuario, Team hasta 5 usuarios, y Business usuarios ilimitados. En el plan Team, cada usuario adicional tiene un costo de $10/mes.' },
  { question: '¿Ofrecen acceso a API?', answer: 'Sí, el acceso a API está disponible en los planes Team y Business, permitiéndote integrar WebiBudgets con tus herramientas y flujos de trabajo existentes.' },
  { question: '¿Qué pasa con mis datos si cancelo?', answer: 'Tus datos son tuyos. Si cancelás, podés exportar todo en formatos estándar. Los conservamos 30 días por si querés reactivar.' },
  { question: '¿Se requiere contrato o compromiso?', answer: 'No. Sin contratos a largo plazo ni penalidades. Ofrecemos facturación mensual y anual, con 20% de descuento en planes anuales.' },
]

export const brandSwatches = ['#000000', '#FCC107', '#3B82F6', '#10B981', '#EF4444']

export const brandStats = [
  { label: 'Clientes satisfechos', value: '2.847' },
  { label: 'Presupuestos generados', value: '+500K' },
  { label: 'Facturación gestionada', value: '+$125M' },
]