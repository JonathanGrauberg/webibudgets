//components\admin\admin-tenants-table.tsx
'use client'

import { useState } from 'react'
import { PLAN_OPTIONS, PLAN_LIMITS, type PlanKey } from '@/lib/plan'

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
  plan: string
  maxUsers: string
  trialEndsAt: string // yyyy-MM-dd para <input type="date">, "" si null
  active: boolean
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function planLabel(plan: string | null) {
  if (!plan) return 'free'
  const opt = PLAN_OPTIONS.find((p) => p.value === plan)
  return opt?.label ?? plan
}

export default function AdminTenantsTable({ initialTenants }: { initialTenants: TenantRow[] }) {
  const [tenants, setTenants] = useState(initialTenants)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit(t: TenantRow) {
    setEditingId(t.id)
    setEdit({
      plan: t.plan || 'free',
      maxUsers: t.maxUsers != null ? String(t.maxUsers) : '',
      trialEndsAt: toDateInputValue(t.trialEndsAt),
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

    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          plan: edit.plan,
          maxUsers: edit.maxUsers === '' ? undefined : Number(edit.maxUsers),
          trialEndsAt: edit.trialEndsAt === '' ? null : edit.trialEndsAt,
          active: edit.active,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Error actualizando tenant')
      }

      const data = await response.json()
      const updated = data.tenant

      setTenants((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                plan: updated.plan,
                maxUsers: updated.maxUsers,
                trialEndsAt: updated.trialEndsAt,
                active: updated.active,
              }
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

            return (
              <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{tenant.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{tenant.slug}</td>

                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {isEditing && edit ? (
                    <select
                      value={edit.plan}
                      onChange={(e) => {
                        const newPlan = e.target.value as PlanKey
                        const limits = PLAN_LIMITS[newPlan]
                        setEdit((prev) =>
                          prev
                            ? {
                                ...prev,
                                plan: newPlan,
                                maxUsers: limits.maxUsers != null ? String(limits.maxUsers) : prev.maxUsers,
                              }
                            : prev
                        )
                      }}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm outline-none focus:border-black focus:bg-white dark:border-slate-700 dark:bg-slate-900"
                    >
                      {PLAN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    planLabel(tenant.plan)
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {isEditing && edit ? (
                    <input
                      type="number"
                      min={0}
                      value={edit.maxUsers}
                      onChange={(e) => setEdit((prev) => (prev ? { ...prev, maxUsers: e.target.value } : prev))}
                      className="w-20 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm outline-none focus:border-black focus:bg-white dark:border-slate-700 dark:bg-slate-900"
                    />
                  ) : (
                    tenant.maxUsers ?? '—'
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {isEditing && edit ? (
                    <input
                      type="date"
                      value={edit.trialEndsAt}
                      onChange={(e) => setEdit((prev) => (prev ? { ...prev, trialEndsAt: e.target.value } : prev))}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm outline-none focus:border-black focus:bg-white dark:border-slate-700 dark:bg-slate-900"
                    />
                  ) : tenant.trialEndsAt ? (
                    new Date(tenant.trialEndsAt).toLocaleDateString()
                  ) : (
                    '—'
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {isEditing && edit ? (
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={edit.active}
                        onChange={(e) => setEdit((prev) => (prev ? { ...prev, active: e.target.checked } : prev))}
                      />
                      Activo
                    </label>
                  ) : tenant.active ? (
                    'Activo'
                  ) : (
                    'Inactivo'
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </td>

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
                        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-slate-700 dark:text-slate-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(tenant)}
                      className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      Editar
                    </button>
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