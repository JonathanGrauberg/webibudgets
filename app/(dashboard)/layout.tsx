import React from 'react'
import { SidebarWrapper } from '@/components/sidebar-wrapper'
import { BrandingProvider } from '@/components/branding-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { headers } from 'next/headers'
import { getTenantBranding, TENANT_HEADER } from '@/lib/tenant'
import { effectiveBranding } from '@/lib/branding'
import { DashboardContentWrapper } from '@/components/dashboard-content-wrapper'
import { ModalPagoPendiente } from '@/components/modal-pago-pendiente'
import { EmailVerificationBanner } from '@/components/email-verification-banner'
import { DynamicIslandHeader } from '@/components/dynamic-island-header' // 👈 Componente de la Solapa flotante

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
  } else if (process.env.NODE_ENV !== 'production') {
    // 👈 fallback SOLO en dev, y solo si de verdad no hay header — nunca en producción
    const fallbackId = process.env.DEFAULT_TENANT_ID
    if (fallbackId) {
      try {
        tenantBranding = await getTenantBranding(fallbackId)
      } catch {
        tenantBranding = null
      }
    }
  }

  const branding = effectiveBranding(
    tenantBranding ?? undefined
  )

  return (
    <ThemeProvider>
      <BrandingProvider initialBranding={branding}>
        {/* 1. Fondo suave global sin cascarón negro alrededor */}
        <div className="relative min-h-screen bg-neutral-100 dark:bg-zinc-950 lg:p-3 transition-colors overflow-hidden">
          
          {/* 🏝️ Solapa flotante estilo Dynamic Island */}
          <DynamicIslandHeader />

          <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-1.5rem)] gap-3">
            
            {/* 💊 Sidebar en formato Cápsula */}
            <SidebarWrapper />

            {/* 📄 Panel Blanco Principal Libre y Limpio */}
            <div className="flex-1 h-full rounded-none lg:rounded-[28px] border border-neutral-200/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
              <DashboardContentWrapper>
                <ModalPagoPendiente />
                <EmailVerificationBanner />
                {children}
              </DashboardContentWrapper>
            </div>

          </div>
        </div>
      </BrandingProvider>
    </ThemeProvider>
  )
}