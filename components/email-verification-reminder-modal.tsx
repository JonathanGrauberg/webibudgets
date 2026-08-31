'use client'
//components\email-verification-reminder-modal.tsx
//
// Recordatorio NO bloqueante: se muestra cuando el usuario crea un
// presupuesto con el email todavía sin confirmar. A diferencia del
// bloqueo que existía antes en la API, esto nunca impide la creación —
// solo ofrece reenviar el link o corregir el email, igual que el cartel
// de arriba (components/email-verification-banner.tsx).

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEmail: string
}

export function EmailVerificationReminderModal({ open, onOpenChange, currentEmail }: Props) {
  const [editing, setEditing] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleResend = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error ?? 'No pudimos reenviar el email')
      } else {
        setMessage('Listo, te reenviamos el email de confirmación.')
      }
    } catch {
      setError('No pudimos reenviar el email. Probá de nuevo en un rato.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/auth/update-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim().toLowerCase() }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error ?? 'No pudimos actualizar el email')
        return
      }
      setEditing(false)
      setNewEmail('')
      setMessage('Listo, te mandamos un nuevo link de confirmación a la dirección corregida.')
    } catch {
      setError('No pudimos actualizar el email. Probá de nuevo en un rato.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmá tu email</DialogTitle>
          <DialogDescription>
            Tranquilo, el presupuesto se crea igual. Esto es solo un recordatorio: tu email
            {currentEmail ? ` (${currentEmail})` : ''} todavía no está confirmado. Si más adelante
            necesitás recuperar tu contraseña, te la mandamos a esa dirección — asegurate de que
            esté bien escrita.
          </DialogDescription>
        </DialogHeader>

        {!editing ? (
          <div className="flex flex-col gap-2">
            <Button type="button" onClick={handleResend} disabled={saving}>
              {saving ? 'Enviando...' : 'Reenviar email de confirmación'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              ¿Es incorrecto? Corregilo
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSaveEmail} className="flex flex-col gap-2">
            <Input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email-correcto@ejemplo.com"
              disabled={saving}
            />
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar y reenviar'}
            </Button>
          </form>
        )}

        {message && <p className="text-sm text-emerald-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
