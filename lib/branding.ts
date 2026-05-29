export type Branding = {
  id?: string
  name?: string | null
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
}

export const SYSTEM_BRANDING: Branding = {
  name: 'WebiBudgets',
  logoUrl: '/placeholder-logo.png',
  primaryColor: '#0ea5e9',
  secondaryColor: '#64748b',
  accentColor: '#10b981',
}

export function effectiveBranding(tenant?: Branding) {
  if (!tenant) return SYSTEM_BRANDING

  return {
    id: tenant.id,
    name: tenant.name ?? SYSTEM_BRANDING.name,
    logoUrl: tenant.logoUrl ?? SYSTEM_BRANDING.logoUrl,
    primaryColor: tenant.primaryColor ?? SYSTEM_BRANDING.primaryColor,
    secondaryColor: tenant.secondaryColor ?? SYSTEM_BRANDING.secondaryColor,
    accentColor: tenant.accentColor ?? SYSTEM_BRANDING.accentColor,
  }
}

export default effectiveBranding
