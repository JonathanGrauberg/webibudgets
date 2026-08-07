'use client'

import { useState } from 'react'
import { Plus, Copy, Check, X, ChevronDown, ChevronRight, Crown } from 'lucide-react'

interface TenantRef {
  id: string
  name: string
  plan: string | null
  proBillingInterval: string | null
}

interface ResellerCodeRow {
  id: string
  code: string
  resellerName: string
  resellerContact: string | null
  discountPercent: number
  active: boolean
  createdAt: string
  tenants: TenantRef[]
}

const AVAILABLE_TIERS = [10] // 👈 mantener sincronizado con lib/reseller-discounts.ts

// Reglas de comisión propias — ajustables acá si cambian
function estimateCommission(tenant: TenantRef): number {
  if (tenant.plan !== 'custom') return 0
  if (tenant.proBillingInterval === 'monthly') return 40000 // se queda el primer mes completo
  if (tenant.proBillingInterval === 'annual') return Math.round(432000 * 0.3) // 30% del anual
  return 0
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export function ResellersTable({ initialCodes }: { initialCodes: ResellerCodeRow[] }) {
  const [codes, setCodes] = useState(initialCodes)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const [form, setForm] = useState({ code: '', resellerName: '', resellerContact: '', discountPercent: AVAILABLE_TIERS[0] })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/resellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear el código')

      setCodes((prev) => [data, ...prev])
      setForm({ code: '', resellerName: '', resellerContact: '', discountPercent: AVAILABLE_TIERS[0] })
      setShowForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    const res = await fetch(`/api/admin/resellers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    if (res.ok) {
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)))
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  return (
    <div className="space-y-4">
      {/* Botón crear */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" /> Nuevo código
        </button>
      </div>

      {/* Formulario de alta */}
      {showForm && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Código</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="GUALEGUAYCHU10"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm uppercase"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Descuento</label>
              <select
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              >
                {AVAILABLE_TIERS.map((t) => (
                  <option key={t} value={t}>{t}%</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Nombre del revendedor</label>
              <input
                value={form.resellerName}
                onChange={(e) => setForm({ ...form, resellerName: e.target.value })}
                placeholder="Juan Pérez"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Contacto (opcional)</label>
              <input
                value={form.resellerContact}
                onChange={(e) => setForm({ ...form, resellerContact: e.target.value })}
                placeholder="Email o teléfono"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowForm(false)} className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={isSaving || !form.code || !form.resellerName}
              className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSaving ? 'Creando...' : 'Crear código'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {codes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center text-sm text-zinc-400">
          No hay códigos de revendedor todavía.
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {codes.map((c) => {
            const isOpen = expandedId === c.id
            const payingTenants = c.tenants.filter((t) => t.plan === 'custom')
            const totalOwed = payingTenants.reduce((acc, t) => acc + estimateCommission(t), 0)

            return (
              <div key={c.id} className={!c.active ? 'opacity-60' : ''}>
                <button
                  onClick={() => setExpandedId(isOpen ? null : c.id)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-zinc-900">{c.code}</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {c.discountPercent}%
                        </span>
                        {!c.active && (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">Inactivo</span>
                        )}
                      </div>
                      <p className="truncate text-xs text-zinc-400">{c.resellerName}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-zinc-400">{payingTenants.length} pagando</p>
                      <p className="text-sm font-semibold text-emerald-600">{formatCurrency(totalOwed)}</p>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(c.code) }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
                      >
                        {copiedCode === c.code ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        Copiar código
                      </button>
                      {c.resellerContact && (
                        <span className="text-xs text-zinc-500">📞 {c.resellerContact}</span>
                      )}
                      <button
                        onClick={() => handleToggleActive(c.id, !c.active)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                          c.active ? 'border border-red-200 text-red-600 hover:bg-red-50' : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {c.active ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                        {c.active ? 'Desactivar código' : 'Reactivar código'}
                      </button>
                    </div>

                    {c.tenants.length === 0 ? (
                      <p className="text-xs text-zinc-400">Nadie usó este código todavía.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {c.tenants.map((t) => (
                          <div key={t.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs">
                            <div className="flex items-center gap-2">
                              {t.plan === 'custom' && <Crown className="h-3 w-3 text-amber-500" />}
                              <span className="font-medium text-zinc-800">{t.name}</span>
                              <span className="text-zinc-400">
                                {t.plan === 'custom' ? `PRO · ${t.proBillingInterval === 'annual' ? 'Anual' : 'Mensual'}` : 'Free (no pagó todavía)'}
                              </span>
                            </div>
                            {t.plan === 'custom' && (
                              <span className="font-semibold text-emerald-600">{formatCurrency(estimateCommission(t))}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-zinc-400">
                      * Comisión estimada según tu regla (mensual = primer mes completo, anual = 30%). Verificá pagos reales antes de transferir.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}