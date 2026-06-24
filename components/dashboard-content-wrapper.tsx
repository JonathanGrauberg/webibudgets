'use client'
//components\dashboard-content-wrapper.tsx
import { useBranding } from '@/components/branding-provider'

export function DashboardContentWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { branding } = useBranding()

  return (
    <div
      /* 📱 Celular: p-0 (sin márgenes extras en los bordes)
         💻 Escritorio (lg:): p-3 para mantener el efecto marco 
      */
      className="flex-1 p-0 lg:p-3 transition-all"
      style={{
        backgroundColor:
          branding?.primaryColor || '#0a0a0a',
      }}
    >
      {/* 📱 Celular: rounded-none (esquinas rectas pegadas al borde del teléfono)
          💻 Escritorio (lg:): rounded-[24px] e h-full para el look flotante de tarjeta
      */}
      <main className="h-full min-h-screen lg:min-h-0 overflow-y-auto rounded-none lg:rounded-[24px] bg-white dark:bg-zinc-900 shadow-sm">
        {children}
      </main>
    </div>
  )
}