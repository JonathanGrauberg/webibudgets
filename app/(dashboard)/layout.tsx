//app\(dashboard)\layout.tsx  
import React from 'react'
import { SidebarWrapper } from '@/components/sidebar-wrapper'
import { BrandingProvider } from '@/components/branding-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { headers } from 'next/headers'
import { getTenantBranding, TENANT_HEADER } from '@/lib/tenant'
import { effectiveBranding } from '@/lib/branding'
import { DashboardContentWrapper } from '@/components/dashboard-content-wrapper'
import { ModalPagoPendiente } from '@/components/modal-pago-pendiente'

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
        {/* 📱 Celular: Fondo blanco puro para coincidir con la app móvil.
          💻 Escritorio (lg:): Conserva el fondo gris claro de marco (bg-neutral-100).
        */}
        <div className="min-h-screen bg-white dark:bg-zinc-950 lg:bg-neutral-100 lg:p-4 transition-colors">
          
          {/* 📱 Celular: h-auto (deja que el contenido dicte el alto y scrollee nativo) 
              💻 Escritorio (lg:): h-[calc(100vh-2rem)] fijo y rígido para el look de tarjeta */}
          <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-2rem)] overflow-visible lg:overflow-hidden rounded-none lg:rounded-[32px] border-0 lg:border lg:border-neutral-200 bg-white dark:bg-zinc-900 shadow-none lg:shadow-sm">
            {/* Este wrapper se encargará de ser barra superior fija en celular o barra lateral en escritorio */}
            <SidebarWrapper />

            {/* Contenedor del contenido:
              📱 Celular: flex-1 e h-full para tomar el resto de la pantalla abajo del navbar.
            */}
            <DashboardContentWrapper>
              {/* 🚀 El modal vigilando globalmente */}
               <ModalPagoPendiente />
              {children}
            </DashboardContentWrapper>

          </div>
        </div>
      </BrandingProvider>
    </ThemeProvider>
  )
}