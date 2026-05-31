'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import FileUploadZone from './file-upload-zone'

export default function BrandingUploadSection({ logoUrl, onChange }: { logoUrl?: string; onChange: (url: string) => void }) {
  const [local, setLocal] = useState(logoUrl ?? '')

  return (
    <div>
      <label className="flex flex-col">
        <span className="text-sm font-medium">URL del logo</span>
        <Input value={local} onChange={(e) => setLocal(e.target.value)} onBlur={() => onChange(local)} />
      </label>

      <div className="mt-3">
        <FileUploadZone onUpload={(url) => { setLocal(url); onChange(url) }} />
      </div>
    </div>
  )
}
