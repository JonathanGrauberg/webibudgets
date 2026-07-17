'use client'
//components\sidebar-wrapper.tsx
import { useSession } from 'next-auth/react'
import { AppSidebar as AppSidebarWithRoles } from './app-sidebar-with-roles'
import { useBranding } from './branding-provider'

export function SidebarWrapper() {
  const { data: session } = useSession()
  const { branding } = useBranding()

  return (
    <AppSidebarWithRoles branding={branding} userRole={session?.user?.role as string | undefined} />
  )
}
