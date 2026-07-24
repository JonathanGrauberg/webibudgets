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
  useOnboardingTour()   // 👈 nuevo

  return (
    <div className="flex-1 min-h-0 p-0 transition-all">
      <main className="h-full min-h-screen lg:min-h-0 overflow-y-auto rounded-none lg:rounded-[24px] bg-white dark:bg-zinc-900 shadow-sm">
        {children}
      </main>
    </div>
  )
}