// lib/features.ts
export type FeatureKey =
  | "calculator"
  | "commissions"
  | "vouchers"
  | "dashboardMetrics"
  | "stockAnalytics"
  | "bulkPriceUpdate"
  | "editBudgets"
  | "productVariants"
  | "workOrders"
  | "whiteLabel"
  | "exportData"    
  | "auditHistory"  
  | "customCategories"
  | "kiosk" // 👈 nuevo

const PLAN_FEATURE_DEFAULTS: Record<string, Partial<Record<FeatureKey, boolean>>> = {
  free: { vouchers: true },
  vip: { vouchers: true },
  custom: {
    calculator: true,
    commissions: true,
    vouchers: true,
    dashboardMetrics: true,
    stockAnalytics: true,
    bulkPriceUpdate: true,
    editBudgets: true,
    productVariants: true,
    workOrders: true,
    whiteLabel: true,
    exportData: true,   
    auditHistory: true, 
    customCategories: true,
    kiosk: true, // 👈 nuevo
  },
}

export function hasFeature(
  tenant: { plan?: string | null; features: unknown } | null | undefined,
  key: FeatureKey
): boolean {
  // 🔒 Mientras el tenant no haya cargado (SWR aún resolviendo, SSR, etc.),
  // no se asume ninguna feature habilitada.
  if (!tenant) return false

  const plan = tenant.plan ?? "free"

  // 🔒 Los overrides individuales de `features` solo tienen sentido para el
  // plan "custom" (es el único que expone la UI para activarlos/desactivarlos).
  // Si un tenant fue "custom" y luego se le bajó el plan a free/vip, el JSON
  // de features puede haber quedado con overrides viejos: los ignoramos acá
  // para que no se filtren beneficios de un plan superior.
  if (plan === "custom") {
    const overrides = (tenant.features as Record<string, boolean> | null) ?? {}
    if (typeof overrides[key] === "boolean") return overrides[key]
  }

  // Si no aplica override, cae al preset del plan
  const planDefaults = PLAN_FEATURE_DEFAULTS[plan] ?? {}
  return planDefaults[key] === true
}

export function isProPlan(plan: string | null | undefined): boolean {
  return plan === 'custom'
}