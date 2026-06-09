'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { calculateContrastRatio, getContrastColor, isAccessibleContrast } from '@/lib/contrast'

export default function ColorPicker({ value, onChange, label }: { value?: string; onChange: (v: string) => void; label?: string }) {
  const bg = value || '#e5e7eb'
  const suggestedText = getContrastColor(bg)
  const ratio = calculateContrastRatio(bg, suggestedText)
  const accessible = isAccessibleContrast(bg, suggestedText)

  const status = ratio >= 7 ? { icon: '✅', text: 'Contraste excelente', tone: 'text-emerald-600' } : ratio >= 4.5 ? { icon: '⚠️', text: 'Contraste aceptable', tone: 'text-amber-600' } : { icon: '❌', text: 'Contraste insuficiente', tone: 'text-red-600' }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="#0F172A" aria-label={label ?? 'Color'} />
        <div className="text-xs text-muted-foreground mt-1">Texto recomendado: <span style={{ color: suggestedText }}>{suggestedText}</span> — Ratio: {ratio}</div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div style={{ width: 36, height: 36, background: bg }} className="rounded" />
        <div className="text-[11px] flex items-center gap-1">
          <span className={status.tone}>{status.icon}</span>
          <span className="text-xs">{status.text}</span>
        </div>
      </div>
    </div>
  )
}
