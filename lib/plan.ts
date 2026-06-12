export type PlanKey = 'free' | 'starter' | 'team' | 'business'

export interface PlanLimits {
  label: string
  maxUsers: number | null // null = ilimitado
  maxBudgetsPerMonth: number | null // null = ilimitado (no implementado aún)
  trialDays: number | null // null = sin trial
}

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  free: {
    label: 'Free',
    maxUsers: 1,
    maxBudgetsPerMonth: null,
    trialDays: 14,
  },
  starter: {
    label: 'Starter',
    maxUsers: 1,
    maxBudgetsPerMonth: 30,
    trialDays: null,
  },
  team: {
    label: 'Team',
    maxUsers: 5,
    maxBudgetsPerMonth: null,
    trialDays: null,
  },
  business: {
    label: 'Business',
    maxUsers: null,
    maxBudgetsPerMonth: null,
    trialDays: null,
  },
}

export const PLAN_OPTIONS: { value: PlanKey; label: string }[] = (
  Object.keys(PLAN_LIMITS) as PlanKey[]
).map((value) => ({ value, label: PLAN_LIMITS[value].label }))

export function isValidPlan(plan: unknown): plan is PlanKey {
  return typeof plan === 'string' && plan in PLAN_LIMITS

}

export function getPlanLimits(plan: unknown): PlanLimits {
  if (isValidPlan(plan)) return PLAN_LIMITS[plan]
  return PLAN_LIMITS.free
}

// Devuelve el maxUsers a guardar en DB según el plan.
// Si el plan es ilimitado (null), usamos un número grande para no romper
// columnas Int no-nullable / comparaciones existentes.
export function resolveMaxUsers(plan: unknown): number {
  const limits = getPlanLimits(plan)
  return limits.maxUsers ?? 999999
}

// Calcula la fecha de fin de trial si corresponde al plan, o null si no aplica.
export function resolveTrialEndsAt(plan: unknown, from: Date = new Date()): Date | null {
  const limits = getPlanLimits(plan)
  if (!limits.trialDays) return null
  const end = new Date(from)
  end.setDate(end.getDate() + limits.trialDays)
  return end
}

// Indica si un tenant en plan free con trial venció
export function isTrialExpired(plan: unknown, trialEndsAt: Date | null | undefined): boolean {
  const limits = getPlanLimits(plan)
  if (!limits.trialDays) return false
  if (!trialEndsAt) return false
  return new Date() > trialEndsAt
}