import React from 'react'
import { SidebarWrapper } from '@/components/sidebar-wrapper'
import { BrandingProvider } from '@/components/branding-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { headers } from 'next/headers'
import { getTenantBranding, TENANT_HEADER } from '@/lib/tenant'
import { effectiveBranding } from '@/lib/branding'
import { DashboardContentWrapper } from '@/components/dashboard-content-wrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const h = await headers()

  const tenantId =
    h.get(TENANT_HEADER) ??
    process.env.DEFAULT_TENANT_ID ??
    null

  let tenantBranding = null

  if (tenantId) {
    try {
      tenantBranding = await getTenantBranding(tenantId)
    } catch {
      tenantBranding = null
    }
  }

  const branding = effectiveBranding(
    tenantBranding ?? undefined
  )

  return (
    <ThemeProvider>
      <BrandingProvider initialBranding={branding}>
        <div className="min-h-screen bg-neutral-100 p-4">
          <div className="flex h-[calc(100vh-2rem)] overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm">

            <SidebarWrapper />

            <DashboardContentWrapper>
              {children}
            </DashboardContentWrapper>

          </div>
        </div>
      </BrandingProvider>
    </ThemeProvider>
  )
}