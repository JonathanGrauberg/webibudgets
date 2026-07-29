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
  | "exportData"    // 👈 nueva
  | "auditHistory"  // 👈 nueva

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
    exportData: true,   // 👈
    auditHistory: true, // 👈
  },
}

export function hasFeature(
  tenant: { plan?: string | null; features: unknown },
  key: FeatureKey
): boolean {
  const overrides = (tenant.features as Record<string, boolean> | null) ?? {}

  // 1. Si el tenant tiene un override explícito para esta key, gana ese valor
  if (typeof overrides[key] === "boolean") return overrides[key]

  // 2. Si no, cae al preset del plan
  const planDefaults = PLAN_FEATURE_DEFAULTS[tenant.plan ?? "free"] ?? {}
  return planDefaults[key] === true
}

export function isProPlan(plan: string | null | undefined): boolean {
  return plan === 'custom'
}