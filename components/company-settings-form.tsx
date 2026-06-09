'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Branding = {
  id?: string
  name?: string | null
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
}

export default function CompanySettingsForm({ initialBranding }: { initialBranding?: Branding }) {
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

        <label className="flex flex-col">
          <span className="text-sm font-medium">URL del logo</span>
          <Input value={form.logoUrl ?? ''} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col">
            <span className="text-sm font-medium">Primary</span>
            <Input type="text" value={form.primaryColor ?? ''} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} placeholder="#0ea5a4 or rgb(...)" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium">Secondary</span>
            <Input type="text" value={form.secondaryColor ?? ''} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} placeholder="#fde68a" />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium">Accent</span>
            <Input type="text" value={form.accentColor ?? ''} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} placeholder="#f97316" />
          </label>
        </div>

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
