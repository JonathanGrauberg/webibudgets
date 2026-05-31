'use client'

import React from 'react'

export default function DashboardPreview({ branding }: { branding: any }) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <h4 className="text-lg font-semibold">Dashboard Preview</h4>
      <div className="mt-3">
        <div className="h-24 rounded bg-gradient-to-r" style={{ background: `linear-gradient(90deg, ${branding?.primaryColor ?? '#0F172A'}, ${branding?.secondaryColor ?? '#334155'})` }} />
      </div>
    </div>
  )
}
