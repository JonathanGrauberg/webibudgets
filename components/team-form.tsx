'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MIN_PASSWORD_LENGTH = 8

type User = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
}

function generatePassword(length = 12): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function CreateUserForm({ onUserCreated }: { onUserCreated?: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleGeneratePassword() {
    const generated = generatePassword()
    setForm((prev) => ({ ...prev, password: generated }))
    setShowPassword(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    setError(null)

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/tenants/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.error || 'Error al crear usuario')
      }

      setMessage('Usuario creado correctamente.')
      setForm({ name: '', email: '', role: 'viewer', password: '' })
      setShowPassword(false)
      onUserCreated?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md p-6 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Crear nuevo usuario</h3>

      <div className="grid gap-4">
        <label className="flex flex-col">
          <span className="text-sm font-medium mb-1">Nombre completo *</span>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Juan Pérez"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium mb-1">Email *</span>
          <Input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="juan@ejemplo.com"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium mb-1">Contraseña *</span>
          <div className="flex gap-2">
            <Input
              required
              type={showPassword ? 'text' : 'password'}
              minLength={MIN_PASSWORD_LENGTH}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? 'Ocultar' : 'Ver'}
            </Button>
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-1 self-start px-0" onClick={handleGeneratePassword}>
            Generar contraseña
          </Button>
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium mb-1">Rol</span>
          <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Visualizador</SelectItem>
              <SelectItem value="seller">Vendedor</SelectItem>
              <SelectItem value="installer">Instalador</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear usuario'}
          </Button>
        </div>

        {message && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-800">{message}</p>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>
    </form>
  )
}

export function UserCard({
  user,
  onUpdate,
}: {
  user: User
  onUpdate?: (userId: string, updates: Record<string, unknown>) => Promise<void>
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showActions, setShowActions] = useState(false)

  async function handleToggleActive() {
    if (!onUpdate) return
    setIsUpdating(true)
    try {
      await onUpdate(user.id, { active: !user.active })
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleResetPassword() {
    if (!onUpdate) return
    setIsUpdating(true)
    try {
      await onUpdate(user.id, { resetPassword: true })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-card hover:shadow-sm transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{user.name}</h4>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="inline-block px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                color: 'var(--color-primary)',
              }}
            >
              {user.role === 'admin' && 'Administrador'}
              {user.role === 'viewer' && 'Visualizador'}
              {user.role === 'seller' && 'Vendedor'}
              {user.role === 'installer' && 'Instalador'}
              {!['admin', 'viewer', 'seller', 'installer'].includes(user.role) && user.role}
            </span>
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                user.active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
              }`}
            >
              {user.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowActions(!showActions)}
          className="text-muted-foreground hover:text-foreground transition"
        >
          ⋮
        </button>
      </div>

      {showActions && (
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleToggleActive}
            className="px-3 py-1.5 text-sm rounded border hover:bg-accent transition disabled:opacity-50"
          >
            {isUpdating ? '...' : user.active ? 'Desactivar' : 'Activar'}
          </button>
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleResetPassword}
            className="px-3 py-1.5 text-sm rounded border hover:bg-accent transition disabled:opacity-50"
          >
            {isUpdating ? '...' : 'Resetear contraseña'}
          </button>
        </div>
      )}
    </div>
  )
}
