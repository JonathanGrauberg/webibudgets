//lib\permissions.ts
import type { BudgetStatus } from '@/lib/types'

export type AppRole = 'owner' | 'admin' | 'seller' | 'installer' | 'viewer'

export type RouteKey =
  | 'dashboard'
  | 'clients'
  | 'products'
  | 'stock'
  | 'budgets'
  | 'budgets_new'
  | 'sellers'
  | 'installers'
  | 'settings_company'
  | 'settings_team'

export type EditScope =
  | 'clients'
  | 'products'
  | 'stock'
  | 'installers'
  | 'sellers'
  | 'budgets'
  | 'budget_status'

/** Budget statuses visible to installer (approved + pending workflow). */
export const INSTALLER_VISIBLE_BUDGET_STATUSES: BudgetStatus[] = [
  'approved',
  'sent',
  'draft',
]

const ROUTE_ACCESS: Record<RouteKey, AppRole[]> = {
  dashboard: ['owner', 'admin', 'seller', 'installer', 'viewer'],
  clients: ['owner', 'admin', 'seller', 'installer'],
  products: ['owner', 'admin', 'seller', 'installer'],
  stock: ['owner', 'admin', 'seller', 'installer'],
  budgets: ['owner', 'admin', 'seller', 'installer'],
  budgets_new: ['owner', 'admin', 'seller'],
  sellers: ['owner', 'admin'],
  installers: ['owner', 'admin', 'seller'],
  settings_company: ['owner', 'admin'],
  settings_team: ['owner', 'admin'],
}

const EDIT_ACCESS: Record<EditScope, AppRole[]> = {
  clients: ['owner', 'admin', 'seller'],
  products: ['owner', 'admin'],
  stock: ['owner', 'admin'],
  installers: ['owner', 'admin'],
  sellers: ['owner', 'admin'],
  budgets: ['owner', 'admin', 'seller'],
  budget_status: ['owner', 'admin', 'seller'],
}

export function isAppRole(role: string | null | undefined): role is AppRole {
  return (
    role === 'owner' ||
    role === 'admin' ||
    role === 'seller' ||
    role === 'installer' ||
    role === 'viewer'
  )
}

export function canAccessRoute(role: string | null | undefined, route: RouteKey): boolean {
  if (!role || !isAppRole(role)) return false
  return ROUTE_ACCESS[route].includes(role)
}

export function canEdit(role: string | null | undefined, scope: EditScope): boolean {
  if (!role || !isAppRole(role)) return false
  return EDIT_ACCESS[scope].includes(role)
}

/**
 * TODO: Budget.sellerId references the Seller entity, not User.id.
 * Once User↔Seller is linked, restrict sellers to their own budgets only.
 */
export function canEditBudget(
  role: string | null | undefined,
  _userId?: string,
  _budgetSellerId?: string | null
): boolean {
  return canEdit(role, 'budgets')
}

export function canViewBudgetStatus(role: string | null | undefined, status: string): boolean {
  if (!canAccessRoute(role, 'budgets')) return false
  if (role === 'installer') {
    return INSTALLER_VISIBLE_BUDGET_STATUSES.includes(status as BudgetStatus)
  }
  return true
}

export function filterBudgetsByRole<T extends { status: string }>(
  role: string | null | undefined,
  budgets: T[]
): T[] {
  if (role === 'installer') {
    return budgets.filter((b) =>
      INSTALLER_VISIBLE_BUDGET_STATUSES.includes(b.status as BudgetStatus)
    )
  }
  return budgets
}

export function routeFromPathname(pathname: string): RouteKey | null {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'dashboard'
  if (pathname === '/clients' || pathname.startsWith('/clients/')) return 'clients'
  if (pathname === '/products' || pathname.startsWith('/products/')) return 'products'
  if (pathname === '/stock' || pathname.startsWith('/stock/')) return 'stock'
  if (pathname === '/budgets/new') return 'budgets_new'
  if (pathname === '/budgets' || pathname.startsWith('/budgets/')) return 'budgets'
  if (pathname === '/sellers' || pathname.startsWith('/sellers/')) return 'sellers'
  if (pathname === '/installers' || pathname.startsWith('/installers/')) return 'installers'
  if (pathname === '/settings/company' || pathname.startsWith('/settings/company/')) {
    return 'settings_company'
  }
  if (pathname === '/settings/team' || pathname.startsWith('/settings/team/')) {
    return 'settings_team'
  }
  return null
}

export const NAV_ROUTES: { route: RouteKey; name: string; href: string; tooltip: string }[] = [
  { route: 'dashboard', name: 'Dashboard', href: '/dashboard', tooltip: 'Vista general del sistema' },
  { route: 'clients', name: 'Clientes', href: '/clients', tooltip: 'Gestionar clientes' },
  { route: 'products', name: 'Productos y Servicios', href: '/products', tooltip: 'Lista de precios y servicios' },
  { route: 'budgets', name: 'Presupuestos', href: '/budgets', tooltip: 'Crear y gestionar cotizaciones' },
  { route: 'sellers', name: 'Vendedores', href: '/sellers', tooltip: 'Crear y gestionar vendedores' },
  { route: 'stock', name: 'Stock', href: '/stock', tooltip: 'Consultar stock disponible' },
  { route: 'installers', name: 'Personal', href: '/installers', tooltip: 'Gestionar Personal de trabajo' },
]

export const SETTINGS_ROUTES: { route: RouteKey; name: string; href: string; tooltip: string }[] = [
  { route: 'settings_company', name: 'Configuración', href: '/settings/company', tooltip: 'Configuración de la empresa' },
  { route: 'settings_team', name: 'Equipo', href: '/settings/team', tooltip: 'Gestionar usuarios del equipo' },
]

export function getVisibleNavItems(role: string | undefined) {
  if (!role) return []
  return NAV_ROUTES.filter((item) => canAccessRoute(role, item.route))
}

export function getVisibleSettingsItems(role: string | undefined) {
  if (!role) return []
  return SETTINGS_ROUTES.filter((item) => canAccessRoute(role, item.route))
}
