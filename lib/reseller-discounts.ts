interface DiscountTier {
  monthlyPlanId: string | undefined
  annualPlanId: string | undefined
}

// 👇 agregar acá cuando exista un nuevo nivel (ej: 40 para Black Friday)
const DISCOUNT_TIERS: Record<number, DiscountTier> = {
  10: {
    monthlyPlanId: process.env.MP_PLAN_PRO_MONTHLY_10,
    annualPlanId: process.env.MP_PLAN_PRO_ANNUAL_10,
  },
}

export function getDiscountedPlanId(discountPercent: number, interval: 'monthly' | 'annual'): string | null {
  const tier = DISCOUNT_TIERS[discountPercent]
  if (!tier) return null
  return (interval === 'monthly' ? tier.monthlyPlanId : tier.annualPlanId) ?? null
}