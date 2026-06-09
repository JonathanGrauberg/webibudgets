import type { CSSProperties } from 'react'

export type Branding = {
  id?: string
  name?: string | null
  logoUrl?: string | null
  faviconUrl?: string | null
  watermarkUrl?: string | null
  sidebarIconUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
}

export const SYSTEM_BRANDING: Branding = {
  name: 'WebiBudgets',
  logoUrl: '/placeholder-logo.png',
  faviconUrl: null,
  watermarkUrl: null,
  sidebarIconUrl: null,
  primaryColor: '#0ea5e9',
  secondaryColor: '#64748b',
  accentColor: '#10b981',
}

export function effectiveBranding(tenant?: Branding): Branding {
  if (!tenant) return SYSTEM_BRANDING

  return {
    id: tenant.id,
    name: tenant.name ?? SYSTEM_BRANDING.name,
    logoUrl: tenant.logoUrl ?? SYSTEM_BRANDING.logoUrl,
    faviconUrl: tenant.faviconUrl ?? SYSTEM_BRANDING.faviconUrl,
      watermarkUrl: tenant.watermarkUrl ?? SYSTEM_BRANDING.watermarkUrl,
      sidebarIconUrl: tenant.sidebarIconUrl ?? SYSTEM_BRANDING.sidebarIconUrl,
    primaryColor: tenant.primaryColor ?? SYSTEM_BRANDING.primaryColor,
    secondaryColor: tenant.secondaryColor ?? SYSTEM_BRANDING.secondaryColor,
    accentColor: tenant.accentColor ?? SYSTEM_BRANDING.accentColor,
  }
}

export function brandingToCssVars(branding: Branding): CSSProperties {
  const b = effectiveBranding(branding)

  return {
    /* Branding general */
    '--color-primary': b.primaryColor ?? undefined,
    '--color-secondary': b.secondaryColor ?? undefined,
    '--color-accent': b.accentColor ?? undefined,

    /* Shadcn / Theme */
    '--primary': b.primaryColor ?? undefined,
    '--secondary': b.secondaryColor ?? undefined,
    '--accent': b.accentColor ?? undefined,

    /*
     * Sidebar
     * Estas son las variables que realmente consume AppSidebar
     */
    '--sidebar': b.primaryColor ?? undefined,
    '--sidebar-primary': b.primaryColor ?? undefined,
    '--sidebar-accent': b.accentColor ?? undefined,

    /* Opcional para bordes y textos */
    '--sidebar-border': b.primaryColor ?? undefined,
  } as CSSProperties
}

export function applyFavicon(faviconUrl: string | null | undefined) {
  if (typeof document === 'undefined' || !faviconUrl) return

  let link = document.querySelector(
    "link[rel='icon']"
  ) as HTMLLinkElement | null

  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  link.href = faviconUrl
}

export default effectiveBranding