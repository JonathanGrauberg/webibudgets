// lib/plan.ts — fuente única de verdad para límites, trials e IDs de MercadoPago

export type PlanKey = 'free' | 'starter' | 'team' | 'business' | 'vip' | 'custom'

export type PlanLimit = {
  label: string
  description: string
  price: string
  priceARS: number
  maxUsers: number | null // null = ilimitado — usuarios que loguean en "Equipo"
  maxSellers: number | null // 👈 nuevo — vendedores (tabla Seller, sin login)
  maxInstallers: number | null // 👈 nuevo — instaladores (tabla Installer, sin login)
  maxBudgetsPerMonth: number | null // null = ilimitado
  trialDays: number // 0 = sin trial
  mpPlanId: string | null
  featured?: boolean
  isPublic: boolean // false = solo interno
  features: string[]
}

export const PLAN_LIMITS: Record<PlanKey, PlanLimit> = {
  free: {
    label: 'Sin plan',
    description: 'Tenant sin plan asignado o con acceso bloqueado.',
    price: 'Gratis',
    priceARS: 0,
    maxUsers: 0, // bloqueado
    maxSellers: 0, // 👈 nuevo
    maxInstallers: 0, // 👈 nuevo
    maxBudgetsPerMonth: null,
    trialDays: 0,
    mpPlanId: null,
    isPublic: false,
    features: [],
    
  },
  // 🌟 AGREGAMOS EL NUEVO PLAN VIP AQUÍ
  vip: {
    label: 'VIP / Tester',
    description: 'Acceso total e ilimitado para owners, amigos y beta testers.',
    price: 'Bonificado',
    priceARS: 0,
    maxUsers: null,           // Ilimitado
    maxSellers: null, // 👈 nuevo
    maxInstallers: null, // 👈 nuevo
    maxBudgetsPerMonth: null, // Ilimitado
    trialDays: 0,             // Sin trial (no vence nunca)
    mpPlanId: null,
    isPublic: false,          // Oculto del público general
    features: [
      'Acceso total ilimitado',
      'Soporte directo de desarrollo',
    ],
  },
  // 🌟 NUEVO — plan a medida, se asigna manualmente desde el panel admin,
  // no se contrata desde /pricing ni tiene mpPlanId todavía.
  custom: {
    label: 'Custom',
    description: 'Plan a medida con módulos habilitados manualmente por tenant.',
    price: 'A convenir',
    priceARS: 0, // el cobro real se maneja fuera de MercadoPago por ahora
    maxUsers: null,           // se puede ajustar manualmente por tenant desde "Max usuarios"
    maxSellers: null,
    maxInstallers: null,
    maxBudgetsPerMonth: null,
    trialDays: 0,
    mpPlanId: null,
    isPublic: false,          // no aparece en /pricing, solo se asigna desde admin
    features: [
      'Módulos a medida (calculadora, comisiones, vouchers, stock avanzado, dashboard)',
      'Configuración manual por tenant',
    ],
  },
  starter: {
    label: 'Básico',
    description: 'Ideal para emprendedores y profesionales independientes.',
    price: '$0.990',
    priceARS: 990,
    maxUsers: 3, // 👈 antes: 1 — ahora admin + vendedor + instalador
    maxSellers: 1, // 👈 nuevo
    maxInstallers: 1, // 👈 nuevo
    maxBudgetsPerMonth: 30,
    trialDays: 7, // 👈 antes: 14
    mpPlanId: process.env.MP_PLAN_STARTER ?? null,
    isPublic: true,
    features: [
      '7 días de prueba gratis, con acceso completo', // 👈 actualizado
      'Hasta 3 usuarios (admin, vendedor e instalador)', // 👈 actualizado
      'Hasta 30 presupuestos por mes',
      'Gestión de clientes',
      'Gestión de vendedores e instaladores',
      'Control de stock',
      'Exportación PDF',
      'Branding personalizado',
      'Soporte por email',
    ],
  },
  team: {
    label: 'Negocio',
    description: 'Para equipos en crecimiento.',
    price: '$5.990',
    priceARS: 5990,
    maxUsers: 5,
    maxSellers: null, // 👈 nuevo — ilimitado
    maxInstallers: null, // 👈 nuevo — ilimitado
    maxBudgetsPerMonth: null,
    trialDays: 7, // 👈 antes: 14
    mpPlanId: process.env.MP_PLAN_TEAM ?? null,
    isPublic: true,
    featured: true,
    features: [
      '7 días de prueba gratis, con acceso completo', // 👈 actualizado
      'Hasta 5 usuarios',
      'Presupuestos ilimitados',
      'Gestión completa del sistema',
      'Control de stock',
      'Branding personalizado',
      'Roles y permisos',
      'Soporte prioritario',
      'Asistencia personalizada',
    ],
  },
  business: {
    label: 'Empresa',
    description: 'Pensado para empresas con múltiples usuarios y alto volumen.',
    price: '$19.990',
    priceARS: 19990,
    maxUsers: null, // ilimitado
    maxSellers: null, // 👈 nuevo
    maxInstallers: null, // 👈 nuevo
    maxBudgetsPerMonth: null,
    trialDays: 0,
    mpPlanId: process.env.MP_PLAN_BUSINESS ?? null,
    isPublic: true,
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
}

// Solo los planes que se muestran al público en /pricing
export const PUBLIC_PLANS = (Object.entries(PLAN_LIMITS) as [PlanKey, PlanLimit][])
  .filter(([, config]) => config.isPublic)
  .map(([value, config]) => ({ value, ...config }))

// Todos los planes para selects internos (admin)
export const PLAN_OPTIONS = (Object.entries(PLAN_LIMITS) as [PlanKey, PlanLimit][]).map(
  ([value, config]) => ({ value, label: config.label, description: config.description })
)

export function isValidPlan(plan: unknown): plan is PlanKey {
  return typeof plan === 'string' && plan in PLAN_LIMITS
}

export function normalizePlan(plan: string | null | undefined): PlanKey {
  if (!plan) return 'free'
  if (plan in PLAN_LIMITS) return plan as PlanKey
  return 'free'
}

export function getPlanConfig(plan: string | null | undefined): PlanLimit {
  return PLAN_LIMITS[normalizePlan(plan)]
}

/** maxUsers para Prisma: null → 9999 (ilimitado), free/0 → 0 (bloqueado) */
export function resolveMaxUsers(plan: string): number {
  const config = getPlanConfig(plan)
  if (config.maxUsers === null) return 9999
  return config.maxUsers
}

/**
 * 👈 NUEVO: igual que resolveMaxUsers, pero si el tenant está en trial activo
 * devuelve "ilimitado" sin importar el plan elegido. El segundo argumento es
 * opcional a propósito: si no lo pasás, se comporta exactamente igual que
 * resolveMaxUsers de toda la vida — no rompe ningún lugar existente que la use.
 */
export function resolveMaxUsersForTenant(
  plan: string,
  trialEndsAt?: Date | string | null
): number {
  if (trialEndsAt !== undefined && isInTrial(plan, trialEndsAt)) return 9999
  return resolveMaxUsers(plan)
}

/** 👈 NUEVO: mismo criterio que resolveMaxUsersForTenant, para vendedores (tabla Seller) */
export function resolveMaxSellersForTenant(
  plan: string,
  trialEndsAt?: Date | string | null
): number | null {
  if (trialEndsAt !== undefined && isInTrial(plan, trialEndsAt)) return null
  return getPlanConfig(plan).maxSellers
}

/** 👈 NUEVO: mismo criterio, para instaladores (tabla Installer) */
export function resolveMaxInstallersForTenant(
  plan: string,
  trialEndsAt?: Date | string | null
): number | null {
  if (trialEndsAt !== undefined && isInTrial(plan, trialEndsAt)) return null
  return getPlanConfig(plan).maxInstallers
}

/** 👈 NUEVO: mismo criterio que resolveMaxUsersForTenant, para presupuestos por mes */
export function resolveMaxBudgetsForTenant(
  plan: string,
  trialEndsAt?: Date | string | null
): number | null {
  if (trialEndsAt !== undefined && isInTrial(plan, trialEndsAt)) return null
  return getPlanConfig(plan).maxBudgetsPerMonth
}

/** trialEndsAt: solo para planes con trialDays > 0 */
export function resolveTrialEndsAt(plan: string, from: Date = new Date()): Date | null {
  const config = getPlanConfig(plan)
  if (config.trialDays === 0) return null
  const d = new Date(from)
  d.setDate(d.getDate() + config.trialDays)
  return d
}

/** Días restantes de trial (null si no aplica) */
export function trialDaysRemaining(trialEndsAt: Date | string | null | undefined): number | null {
  if (!trialEndsAt) return null
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/** ¿El tenant está en trial activo? */
export function isInTrial(plan: string | null, trialEndsAt: Date | string | null | undefined): boolean {
  const config = getPlanConfig(plan)
  if (config.trialDays === 0) return false
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) > new Date()
}

/** ¿El trial expiró? */
export function isTrialExpired(plan: string | null, trialEndsAt: Date | string | null | undefined): boolean {
  const config = getPlanConfig(plan)
  if (config.trialDays === 0) return false
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) <= new Date()
}

/** ¿El tenant tiene acceso activo? */
export function isTenantActive(tenant: {
  plan: string | null
  trialEndsAt: Date | string | null
  active: boolean
}): boolean {
  if (!tenant.active) return false
  
  // 🌟 SI ES VIP, TIENE ACCESO DIRECTO SIEMPRE
  if (tenant.plan === 'vip') return true

  // 🌟 SI ES CUSTOM, TIENE ACCESO DIRECTO SIEMPRE (se gestiona manualmente desde admin)
  if (tenant.plan === 'custom') return true

  const config = getPlanConfig(tenant.plan)
  if (tenant.plan === 'free' || !tenant.plan) return false
  if (config.trialDays === 0) return true
  if (!tenant.trialEndsAt) return false
  return new Date(tenant.trialEndsAt) > new Date()
}