import React from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { headers } from 'next/headers'
import { getTenantBranding, TENANT_HEADER } from '@/lib/tenant'
import { effectiveBranding } from '@/lib/branding'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const h = await headers()
  const tenantId = h.get(TENANT_HEADER) ?? process.env.DEFAULT_TENANT_ID ?? null

  let tenantBranding = null
  if (tenantId) {
    try {
      tenantBranding = await getTenantBranding(tenantId)
    } catch (err) {
      tenantBranding = null
    }
  }

  const branding = effectiveBranding(tenantBranding ?? undefined)

  const cssVars = {
    '--primary': branding.primaryColor ?? undefined,
    '--secondary': branding.secondaryColor ?? undefined,
    '--accent': branding.accentColor ?? undefined,
    '--sidebar-primary': branding.primaryColor ?? undefined,
    '--sidebar-accent': branding.accentColor ?? undefined,
  } as React.CSSProperties

  return (
    <div className="min-h-screen bg-background" style={cssVars}>
      <AppSidebar branding={branding} />
      <main className="min-h-screen lg:ml-64">
        {children}
      </main>
    </div>
  )
}