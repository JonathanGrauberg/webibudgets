// components/admin/admin-tenants-table.tsx
'use client'

import { useState, useEffect } from 'react'
import { PLAN_OPTIONS, PLAN_LIMITS, normalizePlan, type PlanKey } from '@/lib/plan'
import { Crown, Trash2 } from 'lucide-react'

interface TenantRow {
  id: string
  name: string
  slug: string
  plan: string | null
  maxUsers: number | null
  trialEndsAt: string | null
  active: boolean
  createdAt: string
}

interface EditState {
  plan: PlanKey
  originalPlan: PlanKey
  maxUsers: string
  trialEndsAt: string
  active: boolean
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function planLabel(plan: string | null) {
  return PLAN_LIMITS[normalizePlan(plan)]?.label || plan || 'Sin Plan'
}

function maxUsersDisplay(n: number | null, plan: string | null) {
  if (plan === 'vip' || n === null || n === 9999) return 'Ilimitado'
  if (n === 0) return 'Bloqueado'
  return String(n)
}

export default function AdminTenantsTable({ initialTenants }: { initialTenants: TenantRow[] }) {
  const [tenants, setTenants] = useState(initialTenants)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmHardDeleteId, setConfirmHardDeleteId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 🚀 Escudo anti-desfase: Esperamos a que el cliente esté montado para evitar inconsistencias de SSR
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  function startEdit(t: TenantRow) {
    const plan = normalizePlan(t.plan)
    setEditingId(t.id)
    setConfirmDeleteId(null)
    setConfirmHardDeleteId(null)
    setEdit({
      plan,
      originalPlan: plan,
      maxUsers: t.maxUsers != null ? String(t.maxUsers) : String(PLAN_LIMITS[plan]?.maxUsers ?? 9999),
      trialEndsAt: plan === 'vip' ? '' : toDateInputValue(t.trialEndsAt),
      active: t.active,
    })
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEdit(null)
    setError(null)
  }

  async function saveEdit() {
    if (!editingId || !edit) return
    setIsSaving(true)
    setError(null)

    const planChanged = edit.plan !== edit.originalPlan

    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          ...(planChanged ? { plan: edit.plan } : {}),
          maxUsers: edit.plan === 'vip' ? null : (edit.maxUsers === '' ? undefined : Number(edit.maxUsers)),
          trialEndsAt: edit.plan === 'vip' ? null : (edit.trialEndsAt === '' ? null : edit.trialEndsAt),
          active: edit.active,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Error actualizando tenant')
      }

      const { tenant: updated } = await response.json()

      setTenants((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? { ...t, plan: updated.plan, maxUsers: updated.maxUsers, trialEndsAt: updated.trialEndsAt, active: updated.active }
            : t
        )
      )
      cancelEdit()
    } catch (err: any) {
      setError(err?.message ?? 'Error desconocido')
    } finally {
      setIsSaving(false)
    }
  }

  async function softDelete(id: string) {
    setIsDeleting(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, permanent: false }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Error desactivando tenant')
      }
      setTenants((prev) =>
        prev.map((t) => (t.id === id ? { ...t, active: false } : t))
      )
      setConfirmDeleteId(null)
    } catch (err: any) {
      setError(err?.message ?? 'Error desconocido')
    } finally {
      setIsDeleting(false)
    }
  }

  async function hardDelete(id: string) {
    setIsDeleting(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, permanent: true }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Error eliminando permanentemente el tenant')
      }
      
      setTenants((prev) => prev.filter((t) => t.id !== id))
      setConfirmHardDeleteId(null)
    } catch (err: any) {
      setError(err?.message ?? 'Error desconocido')
    } finally {
      setIsDeleting(false)
    }
  }

  // Si no está montado en el cliente todavía, no renderizamos para evitar que React compare fechas de servidores remotos
  if (!mounted) return null

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            <th className="px-6 py-4">Nombre</th>
            <th className="px-6 py-4">Slug</th>
            <th className="px-6 py-4">Plan</th>
            <th className="px-6 py-4">Max usuarios</th>
            <th className="px-6 py-4">Trial hasta</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4">Creado</th>
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
          {tenants.map((tenant) => {
            const isEditing = editingId === tenant.id
            const isConfirmingDelete = confirmDeleteId === tenant.id
            const isConfirmingHardDelete = confirmHardDeleteId === tenant.id
            const isCurrentVip = tenant.plan === 'vip'

            return (
              <tr key={tenant.id} className={`transition ${tenant.active ? 'hover:bg-slate-50 dark:hover:bg-slate-900' : 'bg-slate-50/40 opacity-75'}`}>
                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                  {tenant.name}
                  {isCurrentVip && (
                    <span title="Cuenta Creador / VIP" className="inline-flex shrink-0">
                      <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{tenant.slug}</td>

                {/* Plan */}
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {isEditing && edit ? (
                    <select
                      value={edit.plan}
                      onChange={(e) => {
                        const newPlan = e.target.value as PlanKey
                        const limits = PLAN_LIMITS[newPlan]
                        setEdit((prev) => prev ? {
                          ...prev,
                          plan: newPlan,
                          maxUsers: newPlan === 'vip' ? '9999' : (limits?.maxUsers != null ? String(limits.maxUsers) : '9999'),
                          trialEndsAt: newPlan === 'vip' ? '' : prev.trialEndsAt
                        } : prev)
                      }}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm outline-none focus:border-black focus:bg-white dark:border-slate-700 dark:bg-slate-900"
                    >
                      {PLAN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={!tenant.plan ? 'italic text-zinc-400' : ''}>
                      {planLabel(tenant.plan)}
                    </span>
                  )}
                </td>

                {/* Max usuarios */}
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {isEditing && edit ? (
                    <input
                      type="number"
                      min={0}
                      disabled={edit.plan === 'vip'}
                      value={edit.plan === 'vip' ? '9999' : edit.maxUsers}
                      onChange={(e) => setEdit((prev) => (prev ? { ...prev, maxUsers: e.target.value } : prev))}
                      className="w-20 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm outline-none focus:border-black focus:bg-white dark:border-slate-700 dark:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  ) : (
                    maxUsersDisplay(tenant.maxUsers, tenant.plan)
                  )}
                </td>

                {/* Trial hasta */}
                {/* 🌟 Agregamos suppressHydrationWarning aquí */}
                <td suppressHydrationWarning className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {isEditing && edit ? (
                    edit.plan === 'vip' ? (
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Bonificado (Eterno)</span>
                    ) : (
                      <input
                        type="date"
                        value={edit.trialEndsAt}
                        onChange={(e) => setEdit((prev) => (prev ? { ...prev, trialEndsAt: e.target.value } : prev))}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm outline-none focus:border-black focus:bg-white dark:border-slate-700 dark:bg-slate-900"
                      />
                    )
                  ) : isCurrentVip ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                      Ilimitado (VIP)
                    </span>
                  ) : tenant.trialEndsAt ? (
                    new Date(tenant.trialEndsAt).toLocaleDateString('es-AR')
                  ) : (
                    '—'
                  )}
                </td>

                {/* Estado */}
                <td className="px-6 py-4 text-sm">
                  {isEditing && edit ? (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={edit.active}
                        onChange={(e) => setEdit((prev) => (prev ? { ...prev, active: e.target.checked } : prev))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-600">{edit.active ? 'Activo' : 'Inactivo'}</span>
                    </label>
                  ) : (
                    <span className={`font-medium ${tenant.active ? 'text-emerald-600' : 'text-zinc-400'}`}>
                      {tenant.active ? 'Activo' : 'Inactivo'}
                    </span>
                  )}
                </td>

                {/* Creado */}
                {/* 🌟 Agregamos suppressHydrationWarning aquí también */}
                <td suppressHydrationWarning className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {new Date(tenant.createdAt).toLocaleDateString('es-AR')}
                </td>

                {/* Acciones */}
                <td className="px-6 py-4 text-right text-sm">
                  {isEditing ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={isSaving}
                        className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                      >
                        {isSaving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={isSaving}
                        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : isConfirmingDelete ? (
                    <div className="flex justify-end items-center gap-2">
                      <span className="text-xs text-red-600 font-medium">¿Desactivar?</span>
                      <button
                        onClick={() => softDelete(tenant.id)}
                        disabled={isDeleting}
                        className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        {isDeleting ? '...' : 'Sí'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                      >
                        No
                      </button>
                    </div>
                  ) : isConfirmingHardDelete ? (
                    <div className="flex justify-end items-center gap-2">
                      <span className="text-xs text-red-700 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded">¿Eliminar de la DB?</span>
                      <button
                        onClick={() => hardDelete(tenant.id)}
                        disabled={isDeleting}
                        className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800 shadow"
                      >
                        {isDeleting ? '...' : 'ELIMINAR'}
                      </button>
                      <button
                        onClick={() => setConfirmHardDeleteId(null)}
                        disabled={isDeleting}
                        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(tenant)}
                        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                      >
                        Editar
                      </button>
                      
                      {tenant.active ? (
                        <button
                          onClick={() => { setConfirmDeleteId(tenant.id); setConfirmHardDeleteId(null); setEditingId(null); setEdit(null) }}
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => { setConfirmHardDeleteId(tenant.id); setConfirmDeleteId(null); setEditingId(null); setEdit(null) }}
                          className="rounded-full bg-red-50 text-red-600 p-1.5 transition hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/50"
                          title="Eliminar permanentemente de la base de datos"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}