'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import BrandingUploadSection from './branding-upload-section'
import ColorSystemSection from './color-system-section'
import LivePreviewSection from './live-preview-section'

type Branding = {
  id?: string
  name?: string | null
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
}

export default function CompanyInfoForm({ initialBranding }: { initialBranding?: Branding }) {
  const [form, setForm] = useState<Branding>({
    name: initialBranding?.name ?? '',
    logoUrl: initialBranding?.logoUrl ?? '',
    primaryColor: initialBranding?.primaryColor ?? '',
    secondaryColor: initialBranding?.secondaryColor ?? '',
    accentColor: initialBranding?.accentColor ?? '',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/tenants', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.error || 'Error al guardar')
      }

      setMessage('Guardado correctamente. Refresca la página para aplicar el branding.')
    } catch (err: any) {
      setError(err?.message ?? 'Error desconocido')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={onSave} className="max-w-xl">
      <div className="grid gap-3">
        <label className="flex flex-col">
          <span className="text-sm font-medium">Nombre de la empresa</span>
          <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>

        <BrandingUploadSection logoUrl={form.logoUrl ?? ''} onChange={(logoUrl) => setForm({ ...form, logoUrl })} />

        <ColorSystemSection
          primary={form.primaryColor}
          secondary={form.secondaryColor}
          accent={form.accentColor}
          onChange={(primary: string | null | undefined, secondary: string | null | undefined, accent: string | null | undefined) =>
            setForm({ ...form, primaryColor: primary ?? '', secondaryColor: secondary ?? '', accentColor: accent ?? '' })
          }
        />

        <LivePreviewSection branding={form} />

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <button type="button" className="text-sm text-muted-foreground" onClick={() => location.reload()}>
            Refrescar
          </button>
        </div>

        {message && <div className="text-sm text-success-foreground">{message}</div>}
        {error && <div className="text-sm text-destructive-foreground">{error}</div>}
      </div>
    </form>
  )
}
