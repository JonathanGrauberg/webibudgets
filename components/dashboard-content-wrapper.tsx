'use client'

import { useBranding } from '@/components/branding-provider'

export function DashboardContentWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { branding } = useBranding()

  return (
    <div
      className="flex-1 p-3"
      style={{
        backgroundColor:
          branding?.primaryColor || '#0a0a0a',
      }}
    >
      <main className="h-full overflow-y-auto rounded-[24px] bg-white shadow-sm">
        {children}
      </main>
    </div>
  )
}