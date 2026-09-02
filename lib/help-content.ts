// lib/help-content.ts
//
// Fuente única del manual de ayuda — se usa tanto en la página pública
// (app/(public)/manual) como en la del dashboard (app/(dashboard)/help).
// Es un primer borrador: el contenido lo termina de ajustar el equipo,
// esto solo arma la estructura y un texto base por sección.

export type HelpArticle = {
  slug: string
  title: string
  body: string[] // un párrafo por elemento
  keywords?: string[] // términos extra para que el buscador los encuentre
}

export type HelpCategory = {
  slug: string
  title: string
  description: string
  articles: HelpArticle[]
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: 'primeros-pasos',
    title: 'Primeros pasos',
    description: 'Lo esencial para arrancar a usar el sistema.',
    articles: [
      {
        slug: 'que-es',
        title: '¿Qué es .budgets?',
        body: [
          'Es un sistema de gestión pensado para negocios que arman presupuestos: cotizás, hacés seguimiento del cliente, generás la documentación (recibos, remitos, órdenes de trabajo) y controlás cómo va tu facturación, todo en un solo lugar.',
          'No hace falta instalar nada — funciona desde el navegador, en la compu o el celular.',
        ],
        keywords: ['inicio', 'bienvenida', 'sistema'],
      },
      {
        slug: 'verificar-email',
        title: 'Confirmar tu email',
        body: [
          'Al registrarte te mandamos un link de confirmación. Hasta que no lo confirmes vas a ver un cartel amarillo arriba de todo recordándotelo, y no vas a poder crear presupuestos.',
          'Si el link no te llegó o escribiste mal tu email al registrarte, tocá "¿Es incorrecto? Corregilo" en ese mismo cartel — te deja escribir el email correcto y te reenvía la confirmación ahí.',
        ],
        keywords: ['confirmar', 'verificar', 'mail', 'correo'],
      },
      {
        slug: 'recuperar-contrasena',
        title: 'Recuperar tu contraseña',
        body: [
          'Desde la pantalla de login, "¿Olvidaste tu contraseña?" te manda un link para elegir una nueva — solo funciona si el email que tenés cargado es real y accesible por vos.',
          'Si te registraste con Google, no tenés contraseña propia — iniciá sesión con el botón "Iniciar sesión con Google".',
        ],
        keywords: ['contraseña', 'password', 'olvide', 'login'],
      },
    ],
  },
  {
    slug: 'presupuestos',
    title: 'Presupuestos',
    description: 'Cómo se crean, qué estados tienen y cómo se filtran.',
    articles: [
      {
        slug: 'crear-presupuesto',
        title: 'Crear un presupuesto',
        body: [
          'Desde Presupuestos → "Nuevo Presupuesto" elegís el cliente, agregás ítems del catálogo (o ítems libres, escritos a mano), y el sistema calcula subtotal, descuento, impuestos y envío automáticamente.',
          'También podés dejar notas, condiciones de pago, y hasta adjuntar el PDF de tus condiciones comerciales si lo tenés cargado en Configuración.',
        ],
        keywords: ['nuevo', 'cotización', 'crear'],
      },
      {
        slug: 'estados',
        title: 'Estados de un presupuesto',
        body: [
          'Un presupuesto pasa por: Borrador (recién creado), Enviado, Aprobado (el cliente dijo que sí), Completado (el trabajo ya se hizo), Rechazado o Vencido.',
          'Al entrar a la lista de Presupuestos, por defecto solo se ven los Aprobados y Completados — son los que después se usan en Rendiciones. Para ver todos, cambiá el filtro de estado por "Todos los estados".',
        ],
        keywords: ['aprobado', 'rechazado', 'borrador', 'completado', 'filtro'],
      },
      {
        slug: 'informacion-adicional',
        title: 'Agregar datos extra (ej: plazo de entrega)',
        body: [
          'En la sección "Información adicional" del formulario podés agregar filas libres de Título + Contenido — por ejemplo "Plazo de entrega: 15 días hábiles". Esos datos se imprimen en el PDF que recibe el cliente.',
          'Es el lugar indicado para cualquier dato que no tenga un campo propio en el formulario.',
        ],
        keywords: ['plazo', 'entrega', 'dias', 'condiciones', 'notas'],
      },
      {
        slug: 'limite-mensual',
        title: '¿Hay límite de presupuestos por mes?',
        body: [
          'No. En Free no hay tope de cantidad de presupuestos — las diferencias entre Free y Pro son de acceso a funciones, no de volumen.',
        ],
        keywords: ['limite', 'tope', 'plan', 'mensual'],
      },
      {
        slug: 'items-on-the-fly',
        title: 'Ítems "al vuelo" (sin cargarlos antes al catálogo)',
        body: [
          'No hace falta tener todo precargado en Productos y Servicios. Al armar un presupuesto podés escribir un ítem libre en el momento — nombre, precio y, si querés, el costo — sin haberlo dado de alta antes.',
          'Es útil para cosas puntuales que no se repiten, o cuando estás recién arrancando y todavía no cargaste tu catálogo completo.',
        ],
        keywords: ['al vuelo', 'libre', 'personalizado', 'sin catalogo', 'custom'],
      },
      {
        slug: 'medidas-calculadora',
        title: 'Calculadora por medidas (m², m³, horas, metros lineales)',
        body: [
          'Es una función PRO. Si un producto o servicio tiene una unidad como m², m³, kg, hs o metros lineales, el sistema detecta automáticamente el tipo de medida y te muestra los campos correspondientes en vez de pedirte una cantidad a mano.',
          'Ejemplos: para un producto en m², cargás ancho × alto y calcula la superficie sola; para un servicio por horas, cargás desde/hasta y calcula las horas trabajadas; para volumen o peso, cargás el valor directo (litros, kg, m³). El precio final sale de multiplicar esa cantidad calculada por el precio unitario del producto.',
          'Ahorra la cuenta a mano y evita errores de tipeo en presupuestos con medidas — pensado sobre todo para rubros como construcción, textiles, o cualquiera que cobre por superficie, volumen o tiempo.',
        ],
        keywords: ['calculadora', 'm2', 'm3', 'metros cuadrados', 'metros cubicos', 'horas', 'longitud', 'medidas', 'superficie'],
      },
    ],
  },
  {
    slug: 'clientes',
    title: 'Clientes',
    description: 'Alta de clientes, duplicados y el ranking de mejores clientes.',
    articles: [
      {
        slug: 'evitar-duplicados',
        title: 'Evitar clientes duplicados',
        body: [
          'Mientras escribís el nombre, la empresa, el teléfono o la dirección de un cliente nuevo, el sistema busca en vivo si ya existe alguien parecido y te lo muestra en un aviso amarillo.',
          'Si tocás esa sugerencia, el formulario cambia automáticamente a editar ese cliente existente, en vez de crear uno repetido.',
        ],
        keywords: ['duplicado', 'repetido', 'existente'],
      },
      {
        slug: 'telefono-opcional',
        title: 'El teléfono no es obligatorio',
        body: [
          'Podés guardar un cliente sin teléfono si en el momento no lo tenés — el sistema te va a preguntar si estás seguro antes de guardar, como recordatorio, pero no te bloquea.',
        ],
        keywords: ['telefono', 'obligatorio', 'contacto'],
      },
      {
        slug: 'ranking-clientes',
        title: 'Ranking de mejores clientes',
        body: [
          'En el Dashboard, dentro de "Business Intelligence", está el cuadro "Top 5 Clientes" — ordena a tus clientes por lo que facturaste con ellos en presupuestos Aprobados y Completados.',
        ],
        keywords: ['ranking', 'top', 'mejores', 'business intelligence'],
      },
    ],
  },
  {
    slug: 'personal',
    title: 'Personal e instaladores',
    description: 'La diferencia entre un perfil de instalador y una cuenta con acceso.',
    articles: [
      {
        slug: 'installer-vs-user',
        title: '¿Por qué no veo a un instalador en "Personal asignado"?',
        body: [
          'Hay dos formas de cargar un instalador: como perfil simple (desde Personal → "+ Nuevo personal"), que es solo un dato de agenda y no tiene acceso a la app; o como cuenta de usuario con login real (rol "Instalador", creada desde Configuración → Equipo).',
          'Solo los que tienen cuenta con login aparecen para asignar en una Orden de Trabajo, porque el QR de la orden requiere iniciar sesión para ver el mapa, el checklist y los materiales.',
        ],
        keywords: ['instalador', 'personal', 'asignado', 'orden de trabajo', 'qr'],
      },
    ],
  },
  {
    slug: 'stock',
    title: 'Stock',
    description: 'Control de inventario y alertas de stock bajo.',
    articles: [
      {
        slug: 'como-funciona',
        title: 'El stock se maneja aparte, no se descuenta solo',
        body: [
          '.budgets no es un sistema puramente de inventario, así que el stock no se descuenta automáticamente cuando un presupuesto se aprueba o se completa — vos lo manejás con movimientos manuales (entradas o salidas), por ejemplo al recibir mercadería de un proveedor o al hacer un ajuste por inventario físico.',
          'Donde sí interviene el stock es al armar un presupuesto: si un producto no tiene cantidad suficiente, el sistema te avisa en el momento — es una alerta, no un bloqueo, para que decidas vos si igual lo incluís.',
        ],
        keywords: ['inventario', 'movimiento', 'descuento', 'cantidad', 'alerta stock', 'insuficiente'],
      },
      {
        slug: 'stock-bajo',
        title: 'Alerta de stock bajo',
        body: [
          'Los productos con menos de 10 unidades disponibles se marcan como "Stock bajo" en el resumen de la página — así los ves de un vistazo sin tener que revisar producto por producto.',
        ],
        keywords: ['bajo', 'alerta', 'reponer', 'poco stock'],
      },
      {
        slug: 'actualizacion-masiva',
        title: 'Actualización masiva de precios (función PRO)',
        body: [
          'Si un proveedor te avisa que todo subió (o bajó) un porcentaje parejo, no hace falta editar producto por producto: con el botón de "Actualización masiva" aplicás ese % a todo el catálogo, o solo a los productos de una categoría puntual si el aumento fue parcial.',
        ],
        keywords: ['masiva', 'aumento', 'porcentaje', 'precios', 'actualizar todo', 'proveedor'],
      },
    ],
  },
  {
    slug: 'documentos',
    title: 'Documentos (Recibos, Remitos, Órdenes de trabajo)',
    description: 'Generación de documentos a partir de un presupuesto.',
    articles: [
      {
        slug: 'que-son',
        title: 'Qué documentos se pueden generar',
        body: [
          'Desde un presupuesto aprobado podés generar Recibos (registrar cobros), Remitos (entrega de mercadería) y Órdenes de Trabajo (para coordinar la instalación/ejecución con tu equipo).',
        ],
        keywords: ['recibo', 'remito', 'orden de trabajo'],
      },
      {
        slug: 'orden-trabajo-qr',
        title: 'El QR de la Orden de Trabajo',
        body: [
          'Cada Orden de Trabajo trae un QR en el PDF impreso. Al escanearlo, lleva a una página que pide iniciar sesión antes de mostrar la ubicación, el checklist y los materiales — así que solo sirve si la persona que lo escanea tiene una cuenta real en el sistema.',
        ],
        keywords: ['qr', 'escaneo', 'orden de trabajo'],
      },
    ],
  },
  {
    slug: 'gastos',
    title: 'Gastos',
    description: 'Gastos generales del negocio y gastos de trabajos puntuales.',
    articles: [
      {
        slug: 'que-es',
        title: 'Para qué sirve',
        body: [
          'Registrá gastos generales del negocio (alquiler, sueldos, insumos) o gastos asociados a un trabajo puntual (viáticos de una instalación, por ejemplo) — con categoría, monto, medio de pago y fecha.',
          'Es información sensible: solo la ven roles Admin y Owner, ni vendedores ni instaladores tienen acceso.',
        ],
        keywords: ['gasto', 'costo', 'egreso'],
      },
    ],
  },
  {
    slug: 'tareas',
    title: 'Tareas',
    description: 'Tablero organizador del equipo.',
    articles: [
      {
        slug: 'que-es',
        title: 'El tablero de Tareas',
        body: [
          'Un tablero tipo Kanban (columnas por estado) para organizar el trabajo del equipo — pendientes, en curso, hechas. Se puede vincular una tarea a un presupuesto o cliente puntual.',
        ],
        keywords: ['kanban', 'tablero', 'pendiente', 'organizador'],
      },
      {
        slug: 'kiosco',
        title: 'Modo Kiosco (función PRO)',
        body: [
          'Es una pantalla pensada para dejar fija en una tablet, colgada en la pared del taller — muestra tableros de tareas organizados por solapas, con letra grande para leer a distancia. Ideal para que el equipo vea qué hay que hacer sin tener que entrar al sistema desde su celular.',
        ],
        keywords: ['kiosco', 'tablet', 'pared', 'taller', 'pantalla'],
      },
    ],
  },
  {
    slug: 'rendiciones',
    title: 'Rendiciones',
    description: 'Cierre de cuentas y reparto de ganancias entre vendedores.',
    articles: [
      {
        slug: 'que-es-rendicion',
        title: 'Qué es una rendición',
        body: [
          'Una rendición junta los presupuestos de un período y calcula cuánto se facturó, cuánto costó y cuánto quedó de ganancia — y permite repartir esa ganancia entre los vendedores que participaron, con un porcentaje editable por cada uno.',
          'Mientras está en borrador, todavía se puede editar. Una vez cerrada, los valores quedan fijos.',
        ],
        keywords: ['rendicion', 'reparto', 'ganancia', 'comisiones', 'cierre'],
      },
    ],
  },
  {
    slug: 'equipo-planes',
    title: 'Equipo y planes',
    description: 'Usuarios, roles y qué incluye cada plan.',
    articles: [
      {
        slug: 'agregar-usuario',
        title: 'Agregar un usuario al equipo',
        body: [
          'Desde Configuración → Equipo, un administrador puede crear cuentas nuevas con distintos roles (admin, vendedor, instalador, viewer), siempre dentro del límite de usuarios de tu plan.',
        ],
        keywords: ['usuario', 'equipo', 'rol', 'agregar'],
      },
      {
        slug: 'planes',
        title: 'Planes disponibles',
        body: [
          'Free es el plan de entrada, sin costo, con presupuestos ilimitados, gestión de clientes/productos, tablero de tareas y equipo base — pensado para arrancar sin fricción.',
          'Pro cuesta $40.000/mes, o $36.000/mes facturado anual ($432.000/año — 10% de descuento respecto del mensual). Desbloquea calculadora por medidas, reparto de comisiones entre vendedores, control de stock avanzado, actualización masiva de precios, variantes de producto, órdenes de trabajo con QR, Modo Kiosco y más.',
          'Si tenés un código de descuento (de un revendedor autorizado), sumás un 10% extra sobre el precio de Pro al registrarte o suscribirte.',
        ],
        keywords: ['plan', 'free', 'pro', 'precio', 'costo', 'mensual', 'anual', 'descuento', 'codigo'],
      },
    ],
  },
  {
    slug: 'configuracion',
    title: 'Configuración y marca',
    description: 'Datos de la empresa, logo, colores y diseño del PDF.',
    articles: [
      {
        slug: 'branding',
        title: 'Personalizar tu marca',
        body: [
          'Desde Configuración → Empresa podés cargar el logo, favicon y colores de tu marca, que se usan tanto en el sistema como en los PDF que le mandás a tus clientes.',
          'También podés elegir entre varias plantillas de diseño para el PDF de presupuesto, y ajustar detalles como si se muestra el número de página o tu web en el pie del documento.',
        ],
        keywords: ['logo', 'colores', 'marca', 'branding', 'plantilla', 'pdf', 'diseño'],
      },
    ],
  },
  {
    slug: 'revendedores',
    title: 'Revendedores y equipo',
    description: 'Cómo sumarte como revendedor o formar parte del equipo de .budgets.',
    articles: [
      {
        slug: 'ser-revendedor',
        title: '¿Querés ser revendedor de .budgets?',
        body: [
          'Si vendés servicios o productos a negocios que podrían necesitar un sistema de gestión (contadores, consultores, diseñadores web, etc.), podés convertirte en revendedor: te damos un código propio que tus referidos usan al suscribirse, con un descuento para ellos, y vos generás una comisión por cada cliente que sume.',
          'Escribinos para coordinarlo — no es un alta automática, lo armamos a medida con cada revendedor.',
        ],
        keywords: ['revendedor', 'reseller', 'comision', 'codigo de descuento', 'referido'],
      },
      {
        slug: 'sumate-al-equipo',
        title: '¿Querés formar parte del equipo de .budgets?',
        body: [
          'Si te interesa colaborar con el desarrollo o la atención a clientes de .budgets, contactanos — siempre estamos abiertos a sumar gente que entienda el producto y a los negocios que lo usan.',
        ],
        keywords: ['trabajar', 'equipo', 'sumarse', 'unirse', 'empleo'],
      },
    ],
  },
]

export function searchHelp(query: string): { category: HelpCategory; article: HelpArticle }[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const results: { category: HelpCategory; article: HelpArticle }[] = []
  for (const category of HELP_CATEGORIES) {
    for (const article of category.articles) {
      const haystack = [
        article.title,
        ...article.body,
        ...(article.keywords ?? []),
        category.title,
      ]
        .join(' ')
        .toLowerCase()

      if (haystack.includes(q)) {
        results.push({ category, article })
      }
    }
  }
  return results
}
