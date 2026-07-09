# WebiBudgets - AI Context

## 📌 Descripción General

**WebiBudgets** es una **plataforma SaaS multi-tenant** diseñada para gestionar presupuestos, clientes, productos, inventario e instaladores. Permite que empresas de servicios e instalaciones creen presupuestos, gestionen clientes, controlen stock y administren equipos de vendedores e instaladores.

**Stack Tecnológico:**
- **Frontend:** Next.js 16 (App Router), TypeScript, TailwindCSS v4, Shadcn/UI (estilo New York)
- **Backend:** Next.js API Routes, Prisma ORM
- **Base de Datos:** PostgreSQL
- **Autenticación:** NextAuth.js (Credentials + OAuth)
- **Animaciones:** Framer Motion
- **Gráficos:** Recharts
- **Pagos:** MercadoPago (suscripciones)
- **PDF:** Puppeteer + Chromium
- **Stack:** TypeScript (strict mode), ESLint, PostCSS

---

## 🏗️ Arquitectura General

### Estructura de Carpetas

```
app/
├── layout.tsx              # Root + providers
├── providers.tsx           # SessionProvider
├── (dashboard)/            # Dashboard layout
│   ├── budgets/           # Presupuestos
│   ├── clients/           # Clientes
│   ├── products/          # Productos/Servicios
│   ├── stock/             # Inventario
│   ├── sellers/           # Vendedores
│   ├── installers/        # Instaladores
│   └── settings/          # Configuración empresa
├── (public)/              # Páginas públicas
│   ├── pricing/           # Planes de precio
│   └── register/          # Registro
├── admin/                 # Panel admin
│   ├── tenants/          # Gestión de tenants
│   └── create-tenant/    # Crear tenant
└── auth/login/           # Login

api/
├── admin/tenants/        # CRUD tenants
├── auth/                 # NextAuth
├── budgets/              # CRUD presupuestos
├── clients/              # CRUD clientes
├── dashboard/            # Analítica
├── installers/           # CRUD instaladores
├── products/             # CRUD productos
├── sellers/              # CRUD vendedores
├── stock/                # Movimientos inventario
├── subscriptions/        # Planes MercadoPago
├── tenants/              # Operaciones tenant
├── user/                 # Perfil usuario
└── webhooks/             # MercadoPago webhooks

components/
├── branding-provider.tsx       # Proveedor colores/logos
├── theme-provider.tsx          # Tema (mínimo)
├── app-sidebar.tsx             # Sidebar
├── app-sidebar-with-roles.tsx  # Sidebar con control roles
├── page-header.tsx             # Encabezado página
├── page-breadcrumbs.tsx        # Breadcrumbs
├── page-access-guard.tsx       # Guard acceso
├── stat-card.tsx               # Card métricas
├── client-form.tsx             # Formulario clientes
├── product-form.tsx            # Formulario productos
├── team-form.tsx               # Gestión equipo
├── company-settings-form.tsx   # Config empresa
├── modal-pago-pendiente.tsx    # Modal pago pendiente
├── WhatsNewModal.tsx           # Modal novedades
├── PresenceMap.tsx             # Mapa presencias
├── admin/                      # Componentes admin
├── settings/                   # Componentes configuración
├── ui/                         # Componentes Shadcn/UI
└── landing/                    # Componentes landing

lib/
├── auth.ts                 # Configuración NextAuth
├── permissions.ts          # Control acceso por roles
├── branding.ts             # Lógica branding tenant
├── tenant.ts               # Utilidades tenant
├── admin.ts                # Utilidades admin
├── plan.ts                 # Planes y límites
├── budget-engine.ts        # Motor cálculos presupuestos
├── budget-calculator.ts    # Cálculos precios
├── budget-validators.ts    # Validación presupuestos
├── format.ts               # Formato datos
├── utils.ts                # Utilidades
├── types.ts                # Tipos compartidos
├── currencies.ts           # Soporte monedas
├── contrast.ts             # Contraste colores
├── dashboard-store.ts      # Store dashboard
├── data-store.ts           # Store datos
├── user-profile-sync.ts    # Sync perfil usuario
└── pdf/                    # Lógica PDF

prisma/
├── schema.prisma           # Definición BD
├── seed.ts                 # Script seed
└── migrations/             # Migraciones

types/
├── next-auth.d.ts          # Extensión NextAuth
└── framer-motion.d.ts      # Extensión Framer Motion

docs/
├── ARCHITECTURE.md         # Arquitectura sistema
├── ROADMAP.md              # Roadmap features
├── KNOWN_ISSUES.md         # Problemas conocidos
├── CURRENT_STATE.md        # Estado actual
├── project-overview.md     # Resumen proyecto
└── coding-rules.md         # Reglas código
```

---

## 👥 Modelos de Base de Datos

### Entidades Principales

| Modelo | Descripción |
|--------|-------------|
| **Tenant** | Empresa/organización. Posee: nombre, slug, plan, límite usuarios, moneda, colores, logos, datos MercadoPago |
| **User** | Usuario autenticado. email, contraseña (hash), rol, tenantId, estado onboarding |
| **Client** | Cliente/contacto. nombre, empresa, DNI/CUIT, teléfono, email, dirección, tipo, coordenadas, vendedor asignado |
| **ProductService** | Producto/servicio. nombre, categoría, precio, stock, descripción, moneda |
| **Budget** | Presupuesto/cotización. número, cliente, vendedor, instalador, items, estado, totales, descuento, impuesto, validez |
| **BudgetItem** | Línea de presupuesto. referencia producto, cantidad, precio unitario, descuento |
| **BudgetStatusHistory** | Auditoría cambios. estado anterior → nuevo, timestamp |
| **Seller** | Vendedor. nombre, teléfono, email, DNI, dirección, sector, link usuario opcional |
| **Installer** | Instalador. nombre, teléfono, email, ciudad, link usuario opcional |
| **StockMovement** | Movimiento inventario. producto, delta, tipo (entrada/salida/ajuste), motivo |
| **Account** | OAuth (NextAuth). provider, tokens |
| **Session** | Sesión autenticación. token, usuario, expiración |

### Enumeraciones

- **BudgetStatus:** `draft | sent | approved | rejected | completed | expired`
- **ProductCategory:** `biodigesters | grease_traps | maintenance | other`
- **UserRole:** `owner | admin | seller | installer | viewer`
- **StockMovementType:** `in | out | adjust`
- **ClientType:** `home | home_modular | cabin | hall | sanitary | company`

---

## 🔐 Autenticación y Autorización

### Sistema de Roles

| Ruta | Owner | Admin | Seller | Installer | Viewer |
|------|-------|-------|--------|-----------|--------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Clientes | ✓ | ✓ | ✓ | ✓ | ✗ |
| Productos | ✓ | ✓ | ✓ | ✓ | ✗ |
| Inventario | ✓ | ✓ | ✓ | ✓ | ✗ |
| Presupuestos | ✓ | ✓ | ✓ | ✓ | ✗ |
| Crear Presupuesto | ✓ | ✓ | ✓ | ✗ | ✗ |
| Vendedores | ✓ | ✓ | ✗ | ✗ | ✗ |
| Instaladores | ✓ | ✓ | ✓ | ✗ | ✗ |
| Configuración | ✓ | ✓ | ✗ | ✗ | ✗ |
| Panel Admin | ✓ | ✗ | ✗ | ✗ | ✗ |

### Permisos de Edición

- **Clientes:** owner, admin, seller
- **Productos:** owner, admin (solo)
- **Inventario:** owner, admin (solo)
- **Presupuestos:** owner, admin, seller
- **Estado presupuesto:** owner, admin, seller
- **Instaladores:** ver solo presupuestos draft/sent/approved (no crear/editar)

### Token JWT

```javascript
{
  id: string,                    // UUID usuario
  email: string,                 // Email
  name: string,                  // Nombre
  tenantId: string,              // ID tenant
  role: UserRole,                // Rol usuario
  tenantActive: boolean,         // Tenant activo
  plan: PlanKey,                 // Plan actual
  trialEndsAt: ISO string | null // Fin trial
}
```

### Validaciones Multi-tenant

- Todos los queries filtran por `tenantId`
- Contexto tenant inyectado vía middleware
- Cascada de eliminación en tenant delete
- Validación trial expiration, tenant activo

---

## 🎨 Sistema de Branding

### Características

Cada tenant puede personalizar:
- **Logo completo** (`logoUrl`) - usado en PDF
- **Logo sidebar** (`sidebarIconUrl`) - usado en sidebar compacto
- **Favicon** (`faviconUrl`) - icono navegador
- **Watermark** (`watermarkUrl`) - marca de agua PDF
- **Colores primario, secundario y acentuado**
- **Configuraciones PDF:** opacidad watermark, números página, website en footer, branding footer

### Variables CSS Disponibles

```css
--color-primary        /* Color primario tenant */
--color-secondary      /* Color secundario tenant */
--color-accent         /* Color acentuado tenant */
--sidebar-primary      /* Color primario sidebar */
--sidebar-accent       /* Color acentuado sidebar */
--sidebar-border       /* Border color sidebar */
```

### Archivos Clave

- [lib/branding.ts](lib/branding.ts) - Lógica branding
- [components/branding-provider.tsx](components/branding-provider.tsx) - Proveedor CSS variables
- [components/app-sidebar-with-roles.tsx](components/app-sidebar-with-roles.tsx) - Sidebar con branding
- [lib/contrast.ts](lib/contrast.ts) - Cálculo contraste colores

### Reglas Importantes

1. **Nunca reutilizar automáticamente un asset** (logo vs sidebar logo vs watermark vs favicon)
2. Cada asset tiene función específica
3. Extender variables CSS solo si es necesario
4. No reemplazar variables existentes
5. `brandingToCssVars()` convierte branding → CSS variables

---

## 📊 Funcionalidades por Módulo

### Dashboard
- Analítica y visión general
- KPIs: tendencias ventas, estadísticas presupuestos
- **Archivos:** `app/api/dashboard/*`

### Presupuestos (Budgets)
- Crear, editar, enviar presupuestos
- Estados: draft → sent → approved/rejected → completed/expired
- Cálculo automático totales, impuestos, descuentos
- Historial cambios de estado
- Exportación a PDF
- **Archivos:** `app/(dashboard)/budgets/`, `app/api/budgets/*`, `lib/budget-*`

### Clientes (Clients)
- CRUD clientes/contactos
- Información: nombre, empresa, DNI/CUIT, teléfono, email, dirección, coordenadas
- Tipos: home, home_modular, cabin, hall, sanitary, company
- Asignación a vendedores
- **Archivos:** `app/(dashboard)/clients/`, `app/api/clients/*`

### Productos/Servicios (Products)
- CRUD productos en catálogo
- Categorías: biodigesters, grease_traps, maintenance, other
- Precio, stock, descripción
- Soporte moneda configurable
- **Archivos:** `app/(dashboard)/products/`, `app/api/products/*`

### Inventario (Stock)
- Control stock productos
- Movimientos: entrada, salida, ajuste
- Razones movimiento
- Historial completo
- **Archivos:** `app/(dashboard)/stock/`, `app/api/stock/*`

### Vendedores (Sellers)
- Gestión equipo vendedores
- Información: nombre, teléfono, email, DNI, dirección, sector
- Link opcional a usuario (si es usable en sistema)
- Asignación a presupuestos
- **Archivos:** `app/(dashboard)/sellers/`, `app/api/sellers/*`

### Instaladores (Installers)
- Gestión equipo técnicos/instaladores
- Información: nombre, teléfono, email, ciudad
- Link opcional a usuario
- Visibilidad restringida presupuestos (draft, sent, approved solo)
- **Archivos:** `app/(dashboard)/installers/`, `app/api/installers/*`

### Configuración (Settings)
- Branding empresa: logo, colors, assets
- Gestión equipo y usuarios
- Preferencias tenant
- **Archivos:** `app/(dashboard)/settings/`

### Admin
- **Solo Owner**
- Gestión tenants: crear, editar, eliminar
- Información de planes y suscripciones
- **Archivos:** `app/admin/`, `app/api/admin/*`

---

## 💳 Integración MercadoPago

### Planes Actuales

| Plan | Precio | Usuarios | Presupuestos/mes | Trial | MP Plan ID |
|------|--------|----------|-----------------|-------|-----------|
| Free | $0 ARS | 0 (bloqueado) | 0 | N/A | N/A |
| Starter | $990 ARS | 3 | 30 | 7 días | `mp_starter_id` |
| Team | N/A | N/A | N/A | N/A | N/A |
| Business | N/A | N/A | N/A | N/A | N/A |
| VIP | Unlimited | Unlimited | Unlimited | Sin trial | `mp_vip_id` |

### Webhook MercadoPago

- **Endpoint:** `/api/webhooks/mercadopago`
- Eventos: subscription aprobada, cancelada, suspendida
- Scripts útiles: `create-mp-plans.js`, `update-mp-plan-prices.js`

### Límites por Plan

Almacenados en [lib/plan.ts](lib/plan.ts):
- Máximo usuarios permitidos
- Máximo presupuestos/mes
- Acceso a features
- **Estado actual:** Mostrados en UI (no enforced en API aún)

---

## 🛠️ Componentes Clave

### Componentes de Layout

| Componente | Función |
|-----------|---------|
| `BrandingProvider` | Inyecta variables CSS del branding |
| `ThemeProvider` | Mínimo, evita hydration mismatches |
| `AppSidebar` | Navegación principal |
| `AppSidebarWithRoles` | Navigación con control roles |
| `PageHeader` | Encabezado página + acción principal |
| `PageBreadcrumbs` | Navegación breadcrumbs |
| `DashboardContentWrapper` | Container dashboard |
| `SidebarWrapper` | Wrapper sidebar dinámico |

### Componentes de Funcionalidad

| Componente | Función |
|-----------|---------|
| `ClientForm` | Crear/editar cliente |
| `ProductForm` | Crear/editar producto |
| `TeamForm` | Gestión usuarios/equipo |
| `CompanySettingsForm` | Configuración branding empresa |
| `ModalPagoPendiente` | Modal alerta pago pendiente |
| `PageAccessGuard` | HOC protección rutas |
| `StatCard` | Card métrica dashboard |
| `WhatsNewModal` | Modal novedades/anuncios |
| `PresenceMap` | Mapa presencias |

### Componentes Admin

- `AdminTenantsTable` - Tabla gestión tenants
- `CreateTenantForm` - Formulario crear tenant

### Librerías UI

- **Shadcn/UI:** Dropdowns, dialogs, forms, tables, cards, modals, toasts
- **Lucide React:** 450+ iconos
- **React Hook Form:** Gestión estado formularios
- **Zod:** Validación esquemas
- **Date-fns:** Manejo fechas
- **SWR:** Fetching/caching datos
- **Recharts:** Gráficos dashboard

---

## 🎯 Utilidades y Funciones Clave

### Autenticación y Permisos

- `lib/auth.ts` - Configuración NextAuth, callbacks JWT
- `lib/permissions.ts` - Control acceso por roles
  - `canAccessRoute()` - Verificar acceso ruta
  - `canEdit()` - Verificar permiso edición
  - `canEditBudget()` - Verificar edición presupuesto
  - `filterBudgetsByRole()` - Filtrar presupuestos por rol

### Branding y Tema

- `lib/branding.ts`
  - `brandingToCssVars()` - Convertir branding → CSS variables
  - `effectiveBranding()` - Aplicar fallback branding
- `lib/contrast.ts` - Calcular contraste colores
- `components/branding-provider.tsx` - Aplicar CSS dinámico
- Favicon dinámico vía `applyFavicon()`

### Presupuestos

- `lib/budget-engine.ts` - Motor cálculos presupuestos
- `lib/budget-calculator.ts` - Cálculos precios/descuentos
- `lib/budget-validators.ts` - Validación esquemas presupuesto

### Datos y Tipos

- `lib/types.ts` - Interfaces TypeScript compartidas
- `lib/format.ts` - Formateo datos (moneda, fecha, etc.)
- `lib/utils.ts` - `cn()` para merge clases Tailwind
- `lib/currencies.ts` - Soporte monedas

### Tenant y Admin

- `lib/tenant.ts` - Utilidades tenant
- `lib/admin.ts` - Utilidades owner/admin
- `lib/plan.ts` - Definición planes y límites

### Middleware

- [middleware.ts](middleware.ts) - Protección rutas, inyección contexto tenant

---

## 📋 Estado Actual del Sistema

### ✅ Implementado

- ✓ Arquitectura multi-tenant completa
- ✓ Autenticación (NextAuth) y autorización roles
- ✓ Branding dinámico por tenant (colores, logos, assets)
- ✓ CRUD completo: clientes, productos, presupuestos, vendedores, instaladores
- ✓ Gestión inventario (stock movements)
- ✓ Dashboard scaffolding
- ✓ Generación PDF
- ✓ Panel admin (gestión tenants)
- ✓ Integración MercadoPago (suscripciones)
- ✓ Validación permisos multi-tenant

### ⚠️ En Progreso / Problemas Conocidos

- ⚠ Inconsistencias CSS branding (colores hardcodeados en algunos componentes)
- ⚠ Sidebar visual inconsistencias según branding
- ⚠ Plan limits mostrados en UI pero no enforced en API
- ⚠ Componentes duplicados (migración Bolt)
- ⚠ Dark mode no implementado
- ⚠ Algunos instaladores no ven presupuestos correctamente

### 📅 Pendiente

- Auditoría y eliminación componentes duplicados Bolt
- Enforcement plan limits en API responses
- Validación completa estados presupuesto
- Mejora separación assets PDF (logo vs watermark vs favicon)
- Refinamiento tour onboarding
- Sellers: filtro presupuestos solo propios (TODO: no implementado)
- Temas claro/oscuro por tenant (opcional)

---

## 📝 Reglas Importantes

### Antes de Modificar Código

1. **Explicar** qué archivos serán modificados
2. **Justificar** por qué
3. **Mostrar** plan detallado
4. **Esperar confirmación** si afecta >3 archivos

### Convenciones de Código

❌ **No usar:**
- `any` (TypeScript laxo)
- Hacks / soluciones temporales
- Componentes sin tipado

✅ **Preferir:**
- TypeScript estricto
- Componentes reutilizables
- Código fuertemente tipado
- Validación Zod/TypeScript

### Multi-tenant

- TODO: Todos los queries deben filtrar por `tenantId`
- Contexto tenant inyectado via middleware
- Cascada delete al eliminar tenant
- Validación permisos siempre antes de operación

### Branding

- **Nunca** reutilizar automáticamente assets
- Cada asset (logo/favicon/watermark/sidebarIcon) tiene función específica
- Extender CSS variables solo si necesario
- Previews deben coincidir con UI real

---

## 📂 Archivos de Referencia

| Archivo | Propósito |
|---------|-----------|
| [prisma/schema.prisma](prisma/schema.prisma) | Esquema BD |
| [lib/auth.ts](lib/auth.ts) | NextAuth config |
| [lib/permissions.ts](lib/permissions.ts) | Control acceso |
| [lib/plan.ts](lib/plan.ts) | Planes y límites |
| [middleware.ts](middleware.ts) | Protección rutas |
| [AI_RULES.md](AI_RULES.md) | Reglas específicas proyecto |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura detallada |
| [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) | Problemas conocidos |

---

**Última actualización:** Julio 2026

Implementar límites reales:

- usuarios
- almacenamiento
- clientes
- presupuestos

No solo indicadores visuales.

## Presupuestos

Mejorar flujo de cambio de estado:

- borrador
- enviado
- aprobado
- rechazado

Mostrar confirmaciones y errores amigables.

---

# Importante

Este proyecto ya tiene mucho código funcionando.

Prioridad:

1. No romper funcionalidades existentes.
2. Hacer cambios pequeños y verificables.
3. Mantener compatibilidad con multi-tenant.