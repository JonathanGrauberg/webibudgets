'use client'

import React from 'react'
import { getContrastColor } from '@/lib/contrast'

export default function DashboardPreview({ branding }: { branding: any }) {
  const primary = branding?.primaryColor ?? '#0F172A'
  const secondary = branding?.secondaryColor ?? '#334155'
  const fg = getContrastColor(primary)

  return (
    <div className="p-4 rounded-lg border bg-card">
      <h4 className="text-lg font-semibold">Dashboard Preview</h4>
      <div className="mt-3">
        <div className="h-24 rounded" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})`, color: fg }}>
          <div className="p-3"> 
            <div style={{ color: fg }}>Panel header</div>
          </div>
        </div>
      </div>
    </div>
  )
}
