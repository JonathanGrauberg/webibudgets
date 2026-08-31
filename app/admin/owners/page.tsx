'use client'
// app/admin/owners/page.tsx
//
// Cuentas "owner del sistema" (isSystemOwner) — acceso total, nunca
// bloqueado por plan/trial/estado de ningún tenant. Pensado como
// respaldo: poder crearte otro acceso mientras todavía tenés uno andando,
// en vez de depender de un solo usuario y quedar afuera si algo pasa.

import { useEffect, useState } from 'react'

type Owner = {
  id: string
  name: string
  email: string
  active: boolean
  lastLoginAt: string | null
  createdAt: string
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function fetchOwners() {
    try {
      setIsLoading(true)
      const res = await fetch('/api/admin/owners')
      if (!res.ok) throw new Error('No se pudo cargar la lista')
      const data = await res.json()
      setOwners(data.owners)
    } catch (err: any) {
      setError(err?.message ?? 'Error cargando owners')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOwners()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/owners', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || 'Error creando el owner')
      setMessage(`Listo — "${payload.owner.name}" ya tiene acceso total al sistema.`)
      setName('')
      setEmail('')
      setPassword('')
      await fetchOwners()
    } catch (err: any) {
      setError(err?.message ?? 'Error desconocido')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[-0.5] text-primary">Sistema</p>
        <h2 className="text-3xl font-semibold tracking-[-1]">Owners del sistema</h2>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
          Estas cuentas tienen acceso total: nunca se bloquean por plan, trial vencido o tenant
          inactivo. Usalo como respaldo — creá otro acceso ahora, mientras tenés uno andando, en vez
          de depender de un solo usuario.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-3"
      >
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400">Nombre</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400">Contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950"
          >
            {isSaving ? 'Creando...' : 'Crear owner del sistema'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Último login</th>
              <th className="px-6 py-4">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">Cargando...</td></tr>
            ) : owners.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">No hay owners todavía.</td></tr>
            ) : (
              owners.map((o) => (
                <tr key={o.id}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{o.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{o.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`font-medium ${o.active ? 'text-emerald-600' : 'text-zinc-400'}`}>
                      {o.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td suppressHydrationWarning className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {o.lastLoginAt ? new Date(o.lastLoginAt).toLocaleString('es-AR') : 'Nunca'}
                  </td>
                  <td suppressHydrationWarning className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(o.createdAt).toLocaleDateString('es-AR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
