# WebiBudgets

WebiBudgets es un SaaS multi-tenant desarrollado para la gestión comercial y operativa de empresas.

Stack principal:

* Next.js 15 (App Router)
* TypeScript
* Prisma ORM
* PostgreSQL
* NextAuth
* TailwindCSS
* Shadcn/UI

Características principales:

* Multi-tenancy por empresa
* Branding personalizado por tenant
* Gestión de clientes
* Gestión de presupuestos
* Gestión de productos
* Gestión de stock
* Gestión de vendedores
* Gestión de instaladores
* Sistema de roles y permisos
* Sistema de planes y límites

Cada empresa posee:

* Nombre
* Logo
* Sidebar logo
* Favicon
* PDF watermark
* Colores de branding

El branding debe afectar toda la aplicación utilizando variables CSS globales y no colores hardcodeados.

Objetivo actual:

* Unificar el sistema de branding.
* Eliminar componentes duplicados heredados de Bolt.
* Mejorar consistencia visual.
* Completar sistema de planes.
* Completar validaciones multi-tenant.
