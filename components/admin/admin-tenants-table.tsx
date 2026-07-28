// components/admin/admin-tenants-table.tsx  
'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import { PLAN_OPTIONS, PLAN_LIMITS, normalizePlan, type PlanKey } from '@/lib/plan'
import { Crown, Gem, Trash2, Search, X } from 'lucide-react'
import TenantFeaturesForm from '@/components/admin/tenant-features-form' // 👈 nuevo

interface TenantRow {
  id: string
  name: string
  slug: string
  plan: string | null
  maxUsers: number | null
  trialEndsAt: string | null
  active: boolean
  createdAt: string
  features: Record<string, boolean> | null // 👈 nuevo
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

function planHasTrial(plan: PlanKey): boolean {
  return (PLAN_LIMITS[plan]?.trialDays ?? 0) > 0
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

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterTrial, setFilterTrial] = useState<'all' | 'expired' | 'active'>('all')

  const filteredTenants = useMemo(() => {
    const now = new Date()
    return tenants.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!t.name.toLowerCase().includes(q) && !t.slug.toLowerCase().includes(q)) return false
      }
      if (filterPlan !== 'all' && normalizePlan(t.plan) !== filterPlan) return false
      if (filterStatus === 'active' && !t.active) return false
      if (filterStatus === 'inactive' && t.active) return false
      if (filterTrial === 'expired' && (!t.trialEndsAt || new Date(t.trialEndsAt) > now)) return false
      if (filterTrial === 'active' && (!t.trialEndsAt || new Date(t.trialEndsAt) <= now)) return false
      return true
    })
  }, [tenants, search, filterPlan, filterStatus, filterTrial])

  const hasActiveFilters = search || filterPlan !== 'all' || filterStatus !== 'all' || filterTrial !== 'all'

  function clearFilters() {
    setSearch('')
    setFilterPlan('all')
    setFilterStatus('all')
    setFilterTrial('all')
  }

  function startEdit(t: TenantRow) {
  const plan = normalizePlan(t.plan)
  setEditingId(t.id)
  setConfirmDeleteId(null)
  setConfirmHardDeleteId(null)
  setEdit({
    plan,
    originalPlan: plan,
    maxUsers: t.maxUsers != null ? String(t.maxUsers) : String(PLAN_LIMITS[plan]?.maxUsers ?? 9999),
    trialEndsAt: planHasTrial(plan) ? toDateInputValue(t.trialEndsAt) : '', // 👈
    active: t.active,
  })
  setError(null)
}

  function cancelEdit() {
    setEditingId(null)
    setEdit(null)
    setError(null)
  }

  function handleFeaturesSaved(tenantId: string, features: Record<string, boolean>) {
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, features } : t))
    )
    cancelEdit()
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
      setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, active: false } : t)))
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

  if (!mounted) return null

  function EditFields({ compact = false }: { compact?: boolean }) {
    if (!edit) return null
    return (
      <div className={compact ? 'space-y-3' : 'contents'}>
        <div className={compact ? '' : 'px-6 py-4 text-sm text-slate-600 dark:text-slate-400'}>
          {compact && <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Plan</p>}
          <select
            value={edit.plan}
            onChange={(e) => {
            const newPlan = e.target.value as PlanKey
            const limits = PLAN_LIMITS[newPlan]
            setEdit((prev) => prev ? {
              ...prev,
              plan: newPlan,
              maxUsers: newPlan === 'vip' ? '9999' : (limits?.maxUsers != null ? String(limits.maxUsers) : '9999'),
              trialEndsAt: planHasTrial(newPlan) ? prev.trialEndsAt : '', // 👈
            } : prev)
          }}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-sm outline-none focus:border-black focus:bg-white dark:border-slate-700 dark:bg-slate-900"
          >
            {PLAN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className={compact ? '' : 'px-6 py-4 text-sm text-slate-600 dark:text-slate-400'}>
          {compact && <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Max usuarios</p>}
          <input
            type="number"
            min={0}
            disabled={edit.plan === 'vip'}
            value={edit.plan === 'vip' ? '9999' : edit.maxUsers}
            onChange={(e) => setEdit((prev) => (prev ? { ...prev, maxUsers: e.target.value } : prev))}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-sm outline-none focus:border-black focus:bg-white dark:border-slate-700 dark:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className={compact ? '' : 'px-6 py-4 text-sm text-slate-600 dark:text-slate-400'}>
          {compact && <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Trial hasta</p>}
          {edit.plan === 'vip' ? (
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Bonificado (Eterno)</span>
          ) : !planHasTrial(edit.plan) ? (
            <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">Sin trial (plan {planLabel(edit.plan)})</span>
          ) : (
            <input
              type="date"
              value={edit.trialEndsAt}
              onChange={(e) => setEdit((prev) => (prev ? { ...prev, trialEndsAt: e.target.value } : prev))}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-sm outline-none focus:border-black focus:bg-white dark:border-slate-700 dark:bg-slate-900"
            />
          )}
        </div>

        <div className={compact ? '' : 'px-6 py-4 text-sm'}>
          {compact && <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Estado</p>}
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={edit.active}
              onChange={(e) => setEdit((prev) => (prev ? { ...prev, active: e.target.checked } : prev))}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-600">{edit.active ? 'Activo' : 'Inactivo'}</span>
          </label>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {/* ── Barra de filtros ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Plan */}
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="all">Todos los planes</option>
          {PLAN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Estado */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="all">Activos e inactivos</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>

        {/* Trial */}
        <select
          value={filterTrial}
          onChange={(e) => setFilterTrial(e.target.value as any)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="all">Cualquier trial</option>
          <option value="active">Trial activo</option>
          <option value="expired">Trial vencido</option>
        </select>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Contador */}
      <p className="text-xs text-slate-400 px-1">
        {filteredTenants.length === tenants.length
          ? `${tenants.length} tenant${tenants.length !== 1 ? 's' : ''}`
          : `${filteredTenants.length} de ${tenants.length} tenants`
        }
      </p>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
        {error && (
          <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {filteredTenants.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            No se encontraron tenants con los filtros aplicados.
          </div>
        )}

        {/* ── MOBILE: cards ──────────────────────────────────────────────────── */}
        {filteredTenants.length > 0 && (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 lg:hidden">
            {filteredTenants.map((tenant) => {
              const isEditing = editingId === tenant.id
              const isConfirmingDelete = confirmDeleteId === tenant.id
              const isConfirmingHardDelete = confirmHardDeleteId === tenant.id
              const isCurrentVip = tenant.plan === 'vip'
              const isCurrentCustom = tenant.plan === 'custom'

              return (
                <div key={tenant.id} className={`p-4 transition ${tenant.active ? '' : 'bg-slate-50/40 opacity-75'}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{tenant.name}</p>
                        {isCurrentVip && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                        {isCurrentCustom && <Gem className="w-3.5 h-3.5 text-violet-500 fill-violet-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{tenant.slug}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      tenant.active
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500'
                    }`}>
                      {tenant.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {!isEditing && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Plan</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{planLabel(tenant.plan)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Max usuarios</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{maxUsersDisplay(tenant.maxUsers, tenant.plan)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Trial hasta</p>
                        <p suppressHydrationWarning className="text-sm text-slate-700 dark:text-slate-300">
                          {isCurrentVip
                            ? <span className="text-amber-600 dark:text-amber-400 font-semibold">Ilimitado (VIP)</span>
                            : tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString('es-AR') : '—'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Creado</p>
                        <p suppressHydrationWarning className="text-sm text-slate-700 dark:text-slate-300">
                          {new Date(tenant.createdAt).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                  )}

                  {isEditing && edit && (
                    <div className="mb-4 space-y-3 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900">
                      <EditFields compact />
                      {edit.plan === 'custom' && (
                        <TenantFeaturesForm
                          tenantId={tenant.id}
                          plan={edit.plan}
                          planPersisted={tenant.plan === 'custom'}
                          initialFeatures={tenant.features}
                          onSaved={(features) => handleFeaturesSaved(tenant.id, features)}
                        />
                      )}
                    </div>
                  )}

                  {isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={saveEdit} disabled={isSaving} className="flex-1 rounded-full bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50">
                        {isSaving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button onClick={cancelEdit} disabled={isSaving} className="flex-1 rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50">
                        Cancelar
                      </button>
                    </div>
                  ) : isConfirmingDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 font-medium flex-1">¿Desactivar este tenant?</span>
                      <button onClick={() => softDelete(tenant.id)} disabled={isDeleting} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                        {isDeleting ? '...' : 'Sí'}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                        No
                      </button>
                    </div>
                  ) : isConfirmingHardDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-700 font-bold flex-1">¿Eliminar de la DB?</span>
                      <button onClick={() => hardDelete(tenant.id)} disabled={isDeleting} className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800">
                        {isDeleting ? '...' : 'ELIMINAR'}
                      </button>
                      <button onClick={() => setConfirmHardDeleteId(null)} className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(tenant)} className="flex-1 rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50">
                        Editar
                      </button>
                      {tenant.active ? (
                        <button
                          onClick={() => { setConfirmDeleteId(tenant.id); setConfirmHardDeleteId(null); setEditingId(null); setEdit(null) }}
                          className="flex-1 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => { setConfirmHardDeleteId(tenant.id); setConfirmDeleteId(null); setEditingId(null); setEdit(null) }}
                          className="rounded-full bg-red-50 text-red-600 px-3 py-2 transition hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── DESKTOP: tabla ─────────────────────────────────────────────────── */}
        {filteredTenants.length > 0 && (
          <table className="hidden lg:table min-w-full divide-y divide-slate-200 dark:divide-slate-800">
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
              {filteredTenants.map((tenant) => {
                const isEditing = editingId === tenant.id
                const isConfirmingDelete = confirmDeleteId === tenant.id
                const isConfirmingHardDelete = confirmHardDeleteId === tenant.id
                const isCurrentVip = tenant.plan === 'vip'
                const isCurrentCustom = tenant.plan === 'custom'

                return (
                  <Fragment key={tenant.id}>
                    <tr className={`transition ${tenant.active ? 'hover:bg-slate-50 dark:hover:bg-slate-900' : 'bg-slate-50/40 opacity-75'}`}>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          {tenant.name}
                          {isCurrentVip && <Crown className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                          {isCurrentCustom && <Gem className="w-4 h-4 text-violet-500 fill-violet-500 shrink-0" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{tenant.slug}</td>

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
                                trialEndsAt: newPlan === 'vip' ? '' : prev.trialEndsAt,
                              } : prev)
                            }}
                            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm outline-none focus:border-black focus:bg-white dark:border-slate-700 dark:bg-slate-900"
                          >
                            {PLAN_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={!tenant.plan ? 'italic text-zinc-400' : ''}>{planLabel(tenant.plan)}</span>
                        )}
                      </td>

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
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">Ilimitado (VIP)</span>
                        ) : tenant.trialEndsAt ? (
                          new Date(tenant.trialEndsAt).toLocaleDateString('es-AR')
                        ) : '—'}
                      </td>

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

                      <td suppressHydrationWarning className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(tenant.createdAt).toLocaleDateString('es-AR')}
                      </td>

                      <td className="px-6 py-4 text-right text-sm">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={saveEdit} disabled={isSaving} className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50">
                              {isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button onClick={cancelEdit} disabled={isSaving} className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50">
                              Cancelar
                            </button>
                          </div>
                        ) : isConfirmingDelete ? (
                          <div className="flex justify-end items-center gap-2">
                            <span className="text-xs text-red-600 font-medium">¿Desactivar?</span>
                            <button onClick={() => softDelete(tenant.id)} disabled={isDeleting} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
                              {isDeleting ? '...' : 'Sí'}
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} disabled={isDeleting} className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50">
                              No
                            </button>
                          </div>
                        ) : isConfirmingHardDelete ? (
                          <div className="flex justify-end items-center gap-2">
                            <span className="text-xs text-red-700 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded">¿Eliminar de la DB?</span>
                            <button onClick={() => hardDelete(tenant.id)} disabled={isDeleting} className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800 shadow">
                              {isDeleting ? '...' : 'ELIMINAR'}
                            </button>
                            <button onClick={() => setConfirmHardDeleteId(null)} disabled={isDeleting} className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50">
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => startEdit(tenant)} className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50">
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

                    {/* Fila extra: módulos Custom, solo mientras se edita un tenant con plan "custom" */}
                    {isEditing && edit && edit.plan === 'custom' && (
                      <tr key={`${tenant.id}-features`}>
                        <td colSpan={8} className="px-6 py-4 bg-slate-50 dark:bg-slate-900">
                          <TenantFeaturesForm
                            tenantId={tenant.id}
                            plan={edit.plan}
                            planPersisted={tenant.plan === 'custom'}
                            initialFeatures={tenant.features}
                            onSaved={(features) => handleFeaturesSaved(tenant.id, features)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}