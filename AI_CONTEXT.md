# WebiBudgets - AI Context

## Proyecto

WebiBudgets es una plataforma SaaS multi-tenant desarrollada para empresas de servicios, instalaciones, stock y presupuestos.

Stack principal:

- Next.js 15 App Router
- TypeScript
- Prisma
- PostgreSQL
- NextAuth
- TailwindCSS
- Shadcn/UI
- Framer Motion

---

# Estado actual

La aplicación ya funciona en producción local.

NO generar nuevamente:

- autenticación
- tenants
- branding
- sidebar
- sistema de roles

salvo que se solicite explícitamente.

---

# Arquitectura Multi Tenant

Cada empresa posee:

- branding propio
- colores propios
- logo propio
- favicon propio
- watermark propio
- usuarios propios

El branding se carga mediante:

lib/branding.ts

y es distribuido mediante:

components/branding-provider.tsx

---

# Branding

Actualmente existen:

- primaryColor
- secondaryColor
- accentColor

Disponibles como variables CSS:

--color-primary
--color-secondary
--color-accent

y también:

--sidebar-primary
--sidebar-accent

No reemplazar estas variables.

Extender únicamente si es necesario.

---

# Sidebar

Archivos principales:

components/app-sidebar-with-roles.tsx
components/sidebar-wrapper.tsx

Objetivo:

- el sidebar debe reflejar el branding de cada empresa
- colores activos
- hover
- fondo
- logo

Todo debe reaccionar al branding dinámico.

---

# Preview System

Ubicación:

components/settings/company/

Actualmente existen:

- SidebarPreview
- DashboardPreview
- PDFPreview
- MobilePreview

Objetivo:

Los previews deben parecerse lo máximo posible a la UI real.

Si se modifica la UI real:

actualizar previews.

Si se modifica preview:

no modificar lógica real.

---

# PDF

Brand assets independientes:

logo
sidebarLogo
favicon
watermark

Cada uno cumple una función distinta.

Nunca reutilizar automáticamente un asset para otro.

Mapeo correcto:

logo:
logo completo de empresa
se usa en PDF

sidebarLogo:
logo compacto
se usa en sidebar

favicon:
icono navegador

watermark:
marca de agua PDF

---

# Reglas importantes

Antes de modificar:

1. Explicar qué archivos serán modificados.
2. Explicar por qué.
3. Mostrar plan.
4. Esperar confirmación si afecta más de 3 archivos.

---

# Convenciones

No usar:

- any
- hacks
- soluciones temporales

Preferir:

- TypeScript estricto
- componentes reutilizables
- código tipado

---

# Funcionalidades pendientes

## Branding

- Sidebar dinámico completo
- Dashboard dinámico completo
- Watermark preview

## UX

- modo claro / oscuro por tenant
- tipografía moderna

## Planes

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