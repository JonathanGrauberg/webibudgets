//lib\features.ts
export type FeatureKey =
  | "calculator"
  | "commissions"
  | "vouchers"
  | "dashboardMetrics"
  | "stockAnalytics";

export function hasFeature(tenant: { features: unknown }, key: FeatureKey): boolean {
  const features = (tenant.features as Record<string, boolean> | null) ?? {};
  return features[key] === true;
}