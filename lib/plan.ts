// lib/plan.ts
// Fuente única de verdad para límites, lógica y IDs de MercadoPago

export type PlanKey = 'free' | 'starter' | 'team' | 'business'

export type PlanLimit = {
  label: string
  description: string
  price: string           // display
  priceARS: number        // número para mostrar
  maxUsers: number | null // null = ilimitado
  maxBudgetsPerMonth: number | null // null = ilimitado
  trialDays: number       // 0 = no tiene trial
  mpPlanId: string | null // ID del plan en MercadoPago
  featured?: boolean
  features: string[]
}

export const PLAN_LIMITS: Record<PlanKey, PlanLimit> = {
  free: {
    label: 'Prueba gratuita',
    description: '14 días para explorar WebiBudgets sin costo.',
    price: 'Gratis',
    priceARS: 0,
    maxUsers: 1,
    maxBudgetsPerMonth: null,
    trialDays: 14,
    mpPlanId: null,
    features: [
      '14 días de prueba',
      '1 usuario',
      'Gestión de clientes',
      'Exportación PDF',
      'Branding personalizado',
    ],
  },
  starter: {
    label: 'Básico',
    description: 'Ideal para emprendedores y profesionales.',
    price: '$6.990',
    priceARS: 6990,
    maxUsers: 1,
    maxBudgetsPerMonth: 30,
    trialDays: 0,
    mpPlanId: process.env.MP_PLAN_STARTER ?? '4fe9b94e2950460cad39bb3453f92f07',
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
  team: {
    label: 'Negocio',
    description: 'Para equipos en crecimiento.',
    price: '$19.990',
    priceARS: 19990,
    maxUsers: 5,
    maxBudgetsPerMonth: null,
    trialDays: 0,
    mpPlanId: process.env.MP_PLAN_TEAM ?? '420a7c88098f4ae8b18ab84849821e9e',
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
  business: {
    label: 'Empresa',
    description: 'Pensado para empresas con múltiples usuarios.',
    price: '$49.990',
    priceARS: 49990,
    maxUsers: null,
    maxBudgetsPerMonth: null,
    trialDays: 0,
    mpPlanId: process.env.MP_PLAN_BUSINESS ?? '793353f2bc564fa39bfe259daccb4231',
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

export const PLAN_OPTIONS = (Object.entries(PLAN_LIMITS) as [PlanKey, PlanLimit][]).map(
  ([value, config]) => ({ value, label: config.label, description: config.description })
)

export function isValidPlan(plan: unknown): plan is PlanKey {
  return typeof plan === 'string' && plan in PLAN_LIMITS
}

export function getPlanConfig(plan: string | null | undefined): PlanLimit {
  return PLAN_LIMITS[(plan as PlanKey) ?? 'free'] ?? PLAN_LIMITS.free
}

/** maxUsers para Prisma: null → 9999 (ilimitado) */
export function resolveMaxUsers(plan: string): number {
  const config = getPlanConfig(plan)
  return config.maxUsers ?? 9999
}

/** trialEndsAt: solo para free */
export function resolveTrialEndsAt(plan: string, from: Date = new Date()): Date | null {
  const config = getPlanConfig(plan)
  if (config.trialDays === 0) return null
  const d = new Date(from)
  d.setDate(d.getDate() + config.trialDays)
  return d
}

/** ¿El tenant tiene acceso activo? */
export function isTenantActive(tenant: {
  plan: string | null
  trialEndsAt: Date | null
  active: boolean
}): boolean {
  if (!tenant.active) return false
  const config = getPlanConfig(tenant.plan)
  if (config.trialDays === 0) return true
  if (!tenant.trialEndsAt) return false
  return new Date() < new Date(tenant.trialEndsAt)
}

/** Días restantes de trial */
export function trialDaysRemaining(trialEndsAt: Date | null): number | null {
  if (!trialEndsAt) return null
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}