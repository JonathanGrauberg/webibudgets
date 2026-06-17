// lib/plan.ts — fuente única de verdad para límites, trials e IDs de MercadoPago

export type PlanKey = 'free' | 'starter' | 'team' | 'business'

export type PlanLimit = {
  label: string
  description: string
  price: string
  priceARS: number
  maxUsers: number | null // null = ilimitado
  maxBudgetsPerMonth: number | null // null = ilimitado
  trialDays: number // 0 = sin trial
  mpPlanId: string | null
  featured?: boolean
  isPublic: boolean // false = solo interno (free)
  features: string[]
}

export const PLAN_LIMITS: Record<PlanKey, PlanLimit> = {
  free: {
    label: 'Sin plan',
    description: 'Tenant sin plan asignado o con acceso bloqueado.',
    price: 'Gratis',
    priceARS: 0,
    maxUsers: 0, // bloqueado
    maxBudgetsPerMonth: null,
    trialDays: 0,
    mpPlanId: null,
    isPublic: false,
    features: [],
  },
  starter: {
    label: 'Básico',
    description: 'Ideal para emprendedores y profesionales independientes.',
    price: '$6.990',
    priceARS: 6990,
    maxUsers: 1,
    maxBudgetsPerMonth: 30,
    trialDays: 14,
    mpPlanId: process.env.MP_PLAN_STARTER ?? null,
    isPublic: true,
    features: [
      '14 días de prueba gratis',
      '1 usuario',
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
    price: '$19.990',
    priceARS: 19990,
    maxUsers: 5,
    maxBudgetsPerMonth: null,
    trialDays: 14,
    mpPlanId: process.env.MP_PLAN_TEAM ?? null,
    isPublic: true,
    featured: true,
    features: [
      '14 días de prueba gratis',
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
    price: '$49.990',
    priceARS: 49990,
    maxUsers: null, // ilimitado
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
  const config = getPlanConfig(tenant.plan)
  // free = siempre bloqueado (sin plan asignado)
  if (tenant.plan === 'free' || !tenant.plan) return false
  // sin trial → acceso directo (pagó)
  if (config.trialDays === 0) return true
  // con trial → verificar que no expiró
  if (!tenant.trialEndsAt) return false
  return new Date(tenant.trialEndsAt) > new Date()
}