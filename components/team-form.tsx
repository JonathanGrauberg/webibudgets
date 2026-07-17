'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MIN_PASSWORD_LENGTH = 8

// 🛡️ Filtro de Robustez: 8 caracteres, Mayúscula, Minúscula, Número y Símbolo
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&!#$])[A-Za-z\d@$!%*?&!#$]{8,}$/

// 🛡️ Filtro Anti-Obviedades: Evita patrones consecutivos como '12345678', 'abcdefgh', o repetidos como 'aaaaAAAA1!'
function isPasswordTooObvious(pass: string): boolean {
  const lower = pass.toLowerCase()
  // Comprobar si son caracteres idénticos repetidos
  if (/^(.)\1+$/.test(pass)) return true
  
  // Comprobar secuencias ascendentes comunes
  const sequentialNumbers = "01234567890"
  const sequentialLetters = "abcdefghijklmnopqrstuvwxyz"
  
  if (sequentialNumbers.includes(lower) || sequentialLetters.includes(lower)) return true
  
  return false
}

type User = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
}

function generatePassword(length = 12): string {
  // Garantizamos un set de caracteres seguro que cumpla con la Regex obligatoriamente
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const nums = '23456789'
  const syms = '!@#$*'
  const all = upper + lower + nums + syms
  
  let result = ''
  result += upper.charAt(Math.floor(Math.random() * upper.length))
  result += lower.charAt(Math.floor(Math.random() * lower.length))
  result += nums.charAt(Math.floor(Math.random() * nums.length))
  result += syms.charAt(Math.floor(Math.random() * syms.length))
  
  for (let i = 4; i < length; i++) {
    result += all.charAt(Math.floor(Math.random() * all.length))
  }
  return result
}

export function CreateUserForm({
  onUserCreated,
  isAtLimit = false,
}: {
  onUserCreated?: () => void
  isAtLimit?: boolean
}) {
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleGeneratePassword() {
    const generated = generatePassword()
    setForm((prev) => ({ ...prev, password: generated }))
    setShowPassword(true) // Forzamos mostrarla para que el Admin la vea y la copie
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isAtLimit) return
    setIsSubmitting(true)
    setMessage(null)
    setError(null)

    // 1. Validar longitud básica
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      setIsSubmitting(false)
      return
    }

    // 2. Validar complejidad criptográfica
    if (!PASSWORD_REGEX.test(form.password)) {
      setError("La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un símbolo especial (ej: !@#$).")
      setIsSubmitting(false)
      return
    }

    // 3. Validar patrones obvios o consecutivos
    if (isPasswordTooObvious(form.password)) {
      setError("Por seguridad, la contraseña no puede ser una secuencia simple (ej: '12345678') ni caracteres idénticos repetidos.")
      setIsSubmitting(false)
      return
    }

    try {
      // 🇦🇷 Forzamos consistencia: Pasamos el correo estrictamente a minúsculas antes de viajar al backend
      const normalizedForm = {
        ...form,
        email: form.email.trim().toLowerCase()
      }

      const res = await fetch('/api/tenants/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(normalizedForm),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        if (payload?.error === 'plan_limit_reached') {
          throw new Error('plan_limit_reached')
        }
        throw new Error(payload?.error || 'Error al crear usuario')
      }

      setMessage('Usuario creado correctamente.')
      setForm({ name: '', email: '', role: 'viewer', password: '' })
      setShowPassword(false)
      onUserCreated?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg === 'plan_limit_reached' ? 'plan_limit_reached' : msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAtLimit) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center space-y-4">
        <div className="text-3xl">🔒</div>
        <div>
          <p className="text-sm font-semibold text-amber-900">Límite de usuarios alcanzado</p>
          <p className="mt-1 text-xs text-amber-700 leading-relaxed">
            Tu plan actual no permite más usuarios activos. Actualizá tu plan para seguir agregando miembros al equipo.
          </p>
        </div>
        <a
          href="/pricing"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-900 text-white text-xs font-semibold hover:bg-amber-800 transition"
        >
          Ver planes disponibles →
        </a>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md p-6 bg-card rounded-lg border"
      autoComplete="off"
    >
      <h3 className="text-lg font-semibold mb-4">Crear nuevo usuario</h3>

      <div className="grid gap-4">
        <label className="flex flex-col">
          <span className="text-sm font-medium mb-1">Nombre completo *</span>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Juan Pérez"
            autoComplete="off"
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
            autoComplete="off"
            name="new-user-email-field"
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
              placeholder="Escribí una clave segura"
              className="flex-1"
              autoComplete="new-password"
              name="new-user-password-field"
            />
            <Button type="button" variant="outline" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? 'Ocultar' : 'Ver'}
            </Button>
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-1 self-start px-0 text-amber-700 hover:text-amber-800" onClick={handleGeneratePassword}>
            ⚡ Generar contraseña segura
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
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-sm text-slate-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            {error === 'plan_limit_reached' ? (
              <p className="text-sm text-red-800">
                Límite de plan alcanzado.{' '}
                <a href="/pricing" className="underline font-medium">
                  Actualizá tu plan
                </a>{' '}
                para agregar más usuarios.
              </p>
            ) : (
              <p className="text-sm text-red-800">{error}</p>
            )}
          </div>
        )}
      </div>
    </form>
  )
}

export function UserCard({
  user,
  onUpdate,
  onDelete, // 👈 Recibimos la nueva función encargada de eliminar
  isAtLimit = false,
}: {
  user: User
  onUpdate?: (userId: string, updates: Record<string, unknown>) => Promise<void>
  onDelete: (userId: string) => Promise<void> // 👈 Tipamos de forma explícita para que TypeScript no tire error
  isAtLimit?: boolean
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [currentRole, setCurrentRole] = useState(user.role)

  async function handleToggleActive() {
    if (!onUpdate) return
    setIsUpdating(true)
    try {
      await onUpdate(user.id, { active: !user.active })
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleChangeRole(newRole: string) {
  if (!onUpdate) return
  setIsUpdating(true)
  try {
    // Le enviamos al handleUpdateUser de la página el nuevo rol
    await onUpdate(user.id, { role: newRole })
    setCurrentRole(newRole) // Actualizamos el estado local si sale todo OK
  } catch (err) {
    alert('❌ No se pudo cambiar el rol del usuario.')
  } finally {
    setIsUpdating(false)
  }
}

  // 🌟 FLUJO DE CONFIRMACIÓN INTERACTIVO "A PRUEBA DE BALAS"
  async function handleResetPassword() {
    if (!onUpdate) return

    // 1. Solicitud interactiva de la clave al Admin de turno
    const newPassword = prompt(
      `Vas a cambiar la contraseña de acceso para: ${user.name}.\n\nEscribí la NUEVA contraseña (mínimo 8 caracteres, incluye mayúsculas, números y símbolos):`
    )

    // Si le dio a Cancelar o lo dejó vacío, frenamos en seco de inmediato sin tocar el servidor
    if (newPassword === null) return
    const trimmedPass = newPassword.trim()
    if (trimmedPass === '') {
      alert('❌ Operación cancelada: La contraseña no puede estar vacía.')
      return
    }

    // 2. Validaciones locales en caliente
    if (trimmedPass.length < MIN_PASSWORD_LENGTH) {
      alert(`❌ Error: La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }

    if (!PASSWORD_REGEX.test(trimmedPass)) {
      alert('❌ Error: La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial (ej: !@#$).')
      return
    }

    if (isPasswordTooObvious(trimmedPass)) {
      alert("❌ Error de seguridad: No uses contraseñas obvias o caracteres consecutivos.")
      return
    }

    // 3. Ventana de Re-Confirmación explícita
    const isConfirmed = confirm(
      `¿Estás 100% seguro de cambiar la contraseña de ${user.name} a:\n"${trimmedPass}"?\n\nNota: Si perdés la conexión a internet en este preciso instante, el cambio simplemente se descartará y se mantendrá la contraseña vieja.`
    )

    if (!isConfirmed) return

    // 4. Ejecución del envío
    setIsUpdating(true)
    try {
      // Pasamos la contraseña escrita manualmente directamente al onUpdate de tu TeamPage
      await onUpdate(user.id, { newPassword: trimmedPass })
      alert(`✅ Contraseña de ${user.name} cambiada exitosamente. ¡Ya puede iniciar sesión!`)
      setShowActions(false)
    } catch (err) {
      alert('❌ Error de comunicación: No se pudo actualizar la contraseña. Revisá tu conexión a internet e intentalo de nuevo.')
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleEditName() {
  if (!onUpdate) return

  const newName = prompt(`Nombre actual: ${user.name}\n\nEscribí el nuevo nombre:`, user.name)
  if (newName === null) return
  const trimmed = newName.trim()
  if (trimmed === '') {
    alert('❌ El nombre no puede estar vacío.')
    return
  }
  if (trimmed === user.name) return

  setIsUpdating(true)
  try {
    await onUpdate(user.id, { name: trimmed })
    setShowActions(false)
  } catch (err) {
    alert('❌ No se pudo actualizar el nombre.')
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
                user.active ? 'bg-slate-50 text-slate-700' : 'bg-gray-50 text-gray-700'
              }`}
            >
              {user.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowActions(!showActions)}
          className="text-muted-foreground hover:text-foreground transition text-lg font-bold px-1"
        >
          ⋮
        </button>
      </div>

      {showActions && (
        <div className="mt-4 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150">

        {/* 👑 NUEVO: SELECTOR DE ROL DIRECTO */}
            <div className="flex flex-col gap-1 px-1 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Rol del usuario</span>
              <Select 
                disabled={isUpdating} 
                value={currentRole} 
                onValueChange={handleChangeRole}
              >
                <SelectTrigger className="h-9 text-sm bg-transparent">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                  <SelectItem value="seller">Vendedor</SelectItem>
                  <SelectItem value="installer">Instalador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

          {!user.active && isAtLimit ? (
            <div className="px-3 py-2 text-xs rounded border border-amber-200 bg-amber-50 text-amber-800 leading-relaxed">
              No podés activar este usuario — límite del plan alcanzado.{' '}
              <a href="/pricing" className="underline font-medium">
                Actualizá tu plan
              </a>{' '}
              para agregar más usuarios.
            </div>
          ) : (
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleToggleActive}
              className="px-3 py-1.5 text-sm rounded border hover:bg-accent text-left transition disabled:opacity-50"
            >
              {isUpdating ? '...' : user.active ? '🚫 Desactivar usuario' : '✅ Activar usuario'}
            </button>
          )}

          <button
            type="button"
            disabled={isUpdating}
            onClick={handleEditName}
            className="px-3 py-1.5 text-sm rounded border border-zinc-200 text-zinc-700 hover:bg-accent text-left transition disabled:opacity-50"
          >
            {isUpdating ? '...' : '✏️ Editar nombre'}
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={handleResetPassword}
            className="px-3 py-1.5 text-sm rounded border border-zinc-200 text-zinc-700 hover:bg-accent text-left transition disabled:opacity-50"
          >
            {isUpdating ? 'Modificando...' : '🔑 Cambiar contraseña'}
          </button>

          {/* ❌ BOTÓN DE ELIMINACIÓN DE MIEMBRO */}
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onDelete(user.id)}
            className="px-3 py-1.5 text-sm rounded border border-red-100 bg-red-50/30 text-red-700 hover:bg-red-50 text-left transition disabled:opacity-50 font-medium"
          >
            🗑️ Eliminar permanentemente
          </button>
        </div>
      )}
    </div>
  )
}