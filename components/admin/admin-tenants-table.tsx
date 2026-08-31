// components/admin/admin-tenants-table.tsx
'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import { PLAN_OPTIONS, PLAN_LIMITS, normalizePlan, type PlanKey } from '@/lib/plan'
import { Crown, Gem, Trash2, Search, X, Info } from 'lucide-react'
import TenantFeaturesForm from '@/components/admin/tenant-features-form'

interface TenantRow {
  id: string
  name: string
  slug: string
  plan: string | null
  maxUsers: number | null
  active: boolean
  createdAt: string
  features: Record<string, boolean> | null
  userCount: number
  budgetCount: number
  signupCountry: string | null
  signupReferrer: string | null
  signupUserAgent: string | null
  lastLoginAt: string | null
  lastBudgetAt: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Nunca'
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Recién'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `Hace ${days} d`
  return new Date(iso).toLocaleDateString('es-AR')
}

// Referer suele venir como URL completa — mostramos solo el origen (ej. "google.com")
function referrerLabel(referrer: string | null): string {
  if (!referrer) return 'Directo / desconocido'
  try {
    return new URL(referrer).hostname.replace(/^www\./, '')
  } catch {
    return referrer
  }
}

interface EditState {
  plan: PlanKey
  originalPlan: PlanKey
  maxUsers: string
  active: boolean
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
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

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!t.name.toLowerCase().includes(q) && !t.slug.toLowerCase().includes(q)) return false
      }
      if (filterPlan !== 'all' && normalizePlan(t.plan) !== filterPlan) return false
      if (filterStatus === 'active' && !t.active) return false
      if (filterStatus === 'inactive' && t.active) return false
      return true
    })
  }, [tenants, search, filterPlan, filterStatus])

  const hasActiveFilters = search || filterPlan !== 'all' || filterStatus !== 'all'

  function clearFilters() {
    setSearch('')
    setFilterPlan('all')
    setFilterStatus('all')
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
            ? { ...t, plan: updated.plan, maxUsers: updated.maxUsers, active: updated.active }
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

  // ── Panel de detalle: metadata de alta + actividad, soporte/seguridad ──
  function TenantDetailPanel({ tenant }: { tenant: TenantRow }) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">País de alta</p>
          <p className="text-slate-700 dark:text-slate-300">{tenant.signupCountry || 'Desconocido'}</p>
        </div>
        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Cómo llegó</p>
          <p className="text-slate-700 dark:text-slate-300">{referrerLabel(tenant.signupReferrer)}</p>
        </div>
        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Último login</p>
          <p className="text-slate-700 dark:text-slate-300">{timeAgo(tenant.lastLoginAt)}</p>
        </div>
        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Último presupuesto</p>
          <p className="text-slate-700 dark:text-slate-300">{timeAgo(tenant.lastBudgetAt)}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Navegador/dispositivo al registrarse</p>
          <p className="truncate text-slate-500 dark:text-slate-400" title={tenant.signupUserAgent || ''}>
            {tenant.signupUserAgent || 'Desconocido'}
          </p>
        </div>
        {(!tenant.signupCountry && !tenant.signupReferrer && !tenant.signupUserAgent) && (
          <p className="col-span-2 sm:col-span-3 text-xs text-amber-600">
            Sin datos de alta — esta cuenta se creó antes de que empezáramos a registrar esto.
          </p>
        )}
      </div>
    )
  }

  // ── EditFields: campos compartidos entre la card mobile (compact) y la fila desktop (<td> reales) ──
  function EditFields({ compact = false }: { compact?: boolean }) {
    if (!edit) return null

    const planField = (
      <select
        value={edit.plan}
        onChange={(e) => {
          const newPlan = e.target.value as PlanKey
          const limits = PLAN_LIMITS[newPlan]
          setEdit((prev) => prev ? {
            ...prev,
            plan: newPlan,
            maxUsers: newPlan === 'vip' ? '9999' : (limits?.maxUsers != null ? String(limits.maxUsers) : '9999'),
          } : prev)
        }}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-sm outline-none focus:border-black focus:bg-white dark:border-slate-700 dark:bg-slate-900"
      >
        {PLAN_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )

    const maxUsersField = (
      <input
        type="number"
        min={0}
        disabled={edit.plan === 'vip'}
        value={edit.plan === 'vip' ? '9999' : edit.maxUsers}
        onChange={(e) => setEdit((prev) => (prev ? { ...prev, maxUsers: e.target.value } : prev))}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-sm outline-none focus:border-black focus:bg-white dark:border-slate-700 dark:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    )

    const activeField = (
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={edit.active}
          onChange={(e) => setEdit((prev) => (prev ? { ...prev, active: e.target.checked } : prev))}
          className="w-4 h-4"
        />
        <span className="text-sm text-slate-600">{edit.active ? 'Activo' : 'Inactivo'}</span>
      </label>
    )

    if (compact) {
      return (
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Plan</p>
            {planField}
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Max usuarios</p>
            {maxUsersField}
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Estado</p>
            {activeField}
          </div>
        </div>
      )
    }

    // Desktop: 3 <td> reales, hijos directos de la <tr> que la usa — nunca un <div>
    return (
      <>
        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{planField}</td>
        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{maxUsersField}</td>
        <td className="px-6 py-4 text-sm">{activeField}</td>
      </>
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
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Creado</p>
                        <p suppressHydrationWarning className="text-sm text-slate-700 dark:text-slate-300">
                          {new Date(tenant.createdAt).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Usuarios</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{tenant.userCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Presupuestos</p>
                        <p className={`text-sm font-medium ${tenant.budgetCount === 0 ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {tenant.budgetCount}
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

                  {!isEditing && expandedId === tenant.id && (
                    <div className="mb-4">
                      <TenantDetailPanel tenant={tenant} />
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
                      <button
                        onClick={() => setExpandedId((prev) => (prev === tenant.id ? null : tenant.id))}
                        className="rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                        title="Ver detalles de alta y actividad"
                      >
                        <Info className="w-4 h-4" />
                      </button>
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
          <div className="hidden w-full overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Max usuarios</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Creado</th>
                  <th className="px-6 py-4 text-center" title="Usuarios creados">Usuarios</th>
                  <th className="px-6 py-4 text-center" title="Presupuestos creados — mide uso real">Presup.</th>
                  <th className="sticky right-0 whitespace-nowrap bg-slate-50 px-6 py-4 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.1)] dark:bg-slate-900">
                    Acciones
                  </th>
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

                        {isEditing && edit ? (
                          <EditFields />
                        ) : (
                          <>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              <span className={!tenant.plan ? 'italic text-zinc-400' : ''}>{planLabel(tenant.plan)}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {maxUsersDisplay(tenant.maxUsers, tenant.plan)}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`font-medium ${tenant.active ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                {tenant.active ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                          </>
                        )}

                        <td suppressHydrationWarning className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(tenant.createdAt).toLocaleDateString('es-AR')}
                        </td>

                        <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400">
                          {tenant.userCount}
                        </td>
                        <td className={`px-6 py-4 text-center text-sm font-medium ${tenant.budgetCount === 0 ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400'}`}>
                          {tenant.budgetCount}
                        </td>

                        <td className="sticky right-0 whitespace-nowrap bg-white px-6 py-4 text-right text-sm shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.1)] dark:bg-slate-950">
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
                              <button
                                onClick={() => setExpandedId((prev) => (prev === tenant.id ? null : tenant.id))}
                                className={`rounded-full border px-2 py-1.5 transition ${
                                  expandedId === tenant.id
                                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                                }`}
                                title="Ver detalles de alta y actividad"
                              >
                                <Info className="w-4 h-4" />
                              </button>
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

                      {/* Fila extra: detalle de alta/actividad — toggle con el botón Info */}
                      {!isEditing && expandedId === tenant.id && (
                        <tr key={`${tenant.id}-detail`}>
                          <td colSpan={9} className="px-6 py-4 bg-slate-50 dark:bg-slate-900">
                            <TenantDetailPanel tenant={tenant} />
                          </td>
                        </tr>
                      )}

                      {/* Fila extra: módulos Custom, solo mientras se edita un tenant con plan "custom" */}
                      {isEditing && edit && edit.plan === 'custom' && (
                        <tr key={`${tenant.id}-features`}>
                          <td colSpan={9} className="px-6 py-4 bg-slate-50 dark:bg-slate-900">
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
          </div>
        )}
      </div>
    </div>
  )
}