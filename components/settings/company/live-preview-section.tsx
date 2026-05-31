'use client'

import React from 'react'
import MobilePreview from './mobile-preview'
import DashboardPreview from './dashboard-preview'
import SidebarPreview from './sidebar-preview'

export default function LivePreviewSection({ branding }: { branding: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-1">
        <MobilePreview branding={branding} />
      </div>

      <div className="md:col-span-2 grid grid-cols-1 gap-4">
        <DashboardPreview branding={branding} />
        <SidebarPreview branding={branding} />
      </div>
    </div>
  )
}
