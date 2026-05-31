'use client'

import React from 'react'
import ColorPicker from './color-picker'

export default function ColorSystemSection({ primary, secondary, accent, onChange }: { primary?: string | null; secondary?: string | null; accent?: string | null; onChange: (p?: string | null, s?: string | null, a?: string | null) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="text-sm font-medium">Primary</label>
        <ColorPicker value={primary ?? ''} onChange={(v) => onChange(v, secondary ?? null, accent ?? null)} />
      </div>

      <div>
        <label className="text-sm font-medium">Secondary</label>
        <ColorPicker value={secondary ?? ''} onChange={(v) => onChange(primary ?? null, v, accent ?? null)} />
      </div>

      <div>
        <label className="text-sm font-medium">Accent</label>
        <ColorPicker value={accent ?? ''} onChange={(v) => onChange(primary ?? null, secondary ?? null, v)} />
      </div>
    </div>
  )
}
