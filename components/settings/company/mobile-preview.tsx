'use client'

import React from 'react'
import { getContrastColor } from '@/lib/contrast'

export default function MobilePreview({ branding }: { branding: any }) {
  const bg = branding?.primaryColor || '#0F172A'
  const fg = getContrastColor(bg)

  return (
    <div className="p-4 rounded-lg border bg-gradient-to-br from-white/70 to-white/50">
      <div className="rounded-md overflow-hidden h-96 shadow" style={{ border: '1px solid #e6e6e6' }}>
        <div className="p-3" style={{ background: bg, color: fg }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-md" />
            <div>
              <div className="h-4 w-32 bg-white/40 rounded mb-1" />
              <div className="h-3 w-20 bg-white/30 rounded" />
            </div>
          </div>
        </div>
        <div className="p-4">Preview móvil</div>
      </div>
    </div>
  )
}
