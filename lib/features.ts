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
  | "kiosk"
  | "pdfTemplates" // 👈 nuevo — elegir plantilla de diseño para el PDF de presupuesto

// 👇 nuevo — evita repetir las 14 claves dos veces (vip y custom deben ser
// siempre idénticos: los dos son "PRO completo", solo cambia si pagan o no)
const ALL_PRO_FEATURES: Record<FeatureKey, boolean> = {
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
  kiosk: true,
  pdfTemplates: true, // 👈 nuevo
}

const PLAN_FEATURE_DEFAULTS: Record<string, Partial<Record<FeatureKey, boolean>>> = {
  free: { vouchers: true },
  vip: ALL_PRO_FEATURES,    // 👈 antes: { vouchers: true } — el bug real
  custom: ALL_PRO_FEATURES, // 👈 mismo objeto que vip, a propósito
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
  return plan === 'custom' || plan === 'vip' // 👈 antes: solo 'custom'
}