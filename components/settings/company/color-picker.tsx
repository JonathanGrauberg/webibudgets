'use client'

import React from 'react'
import { Input } from '@/components/ui/input'

export default function ColorPicker({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="#0F172A" />
      <div style={{ width: 36, height: 36, background: value || '#e5e7eb' }} className="rounded" />
    </div>
  )
}
