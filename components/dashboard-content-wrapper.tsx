'use client'
//components\dashboard-content-wrapper.tsx
import { useBranding } from '@/components/branding-provider'
import { useOnboardingTour } from '@/hooks/use-onboarding-tour'

export function DashboardContentWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { branding } = useBranding()
  useOnboardingTour()

  return (
    <div className="flex-1 min-h-0 p-0 transition-all">
      <main className="h-full min-h-screen overflow-y-auto rounded-none bg-white pt-[88px] pb-24 dark:bg-zinc-900 shadow-sm lg:min-h-0 lg:rounded-[24px] lg:pb-0 lg:pt-0">
        {/* 👆 pt-[88px] en mobile — el alto exacto de la píldora flotante (h-14 + top-4) + aire.
            pb-24 en mobile — para que el pill nav de abajo tampoco tape botones al final de la página.
            lg:pt-0 lg:pb-0 — en desktop no hace falta nada de esto, el sidebar no flota arriba del contenido. */}
        {children}
      </main>
    </div>
  )
}