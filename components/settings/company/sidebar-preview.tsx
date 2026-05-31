'use client'

import React from 'react'

export default function SidebarPreview({ branding }: { branding: any }) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <h4 className="text-lg font-semibold">Sidebar Preview</h4>
      <div className="mt-3 h-40 rounded" style={{ background: branding?.primaryColor ?? '#0F172A' }} />
    </div>
  )
}
