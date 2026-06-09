'use client'

import React from 'react'
import { getContrastColor } from '@/lib/contrast'

export default function SidebarPreview({ branding }: { branding: any }) {
  const bg = branding?.primaryColor ?? '#0F172A'
  const fg = getContrastColor(bg)

  return (
    <div className="p-4 rounded-lg border bg-card">
      <h4 className="text-lg font-semibold">Sidebar Preview</h4>
      <div className="mt-3 h-40 rounded flex items-center justify-center" style={{ background: bg, color: fg }}>
        <div className="text-sm font-bold">WB</div>
      </div>
    </div>
  )
}
