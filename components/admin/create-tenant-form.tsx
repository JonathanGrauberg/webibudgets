//components\admin\create-tenant-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PLAN_OPTIONS, PLAN_LIMITS, type PlanKey } from '@/lib/plan'

const MIN_PASSWORD_LENGTH = 8

export default function CreateTenantForm() {
  const [companyName, setCompanyName] = useState('')
  const [slug, setSlug] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [plan, setPlan] = useState<PlanKey>('free')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const planLimits = PLAN_LIMITS[plan]
  const maxUsersDisplay = planLimits.maxUsers != null ? String(planLimits.maxUsers) : 'Ilimitado'

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ companyName, slug, adminEmail, password, plan }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Error creando tenant')
      }

      const data = await response.json()
      setMessage(`Tenant creado: ${data.tenant.name} (${data.tenant.slug})`)
      setCompanyName('')
      setSlug('')
      setAdminEmail('')
      setPassword('')
      setPlan('free')
      setShowPassword(false)
    } catch (err: any) {
      setError(err?.message ?? 'Error desconocido')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
            Admin
          </p>
          <h1 className="text-4xl font-black tracking-tighter text-black leading-none">
            Nuevo tenant
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Creá una empresa cliente con su usuario administrador inicial.
          </p>
        </div>

        <div className="h-px bg-zinc-200 mb-8" />

        {/* Form card */}
        <form
          onSubmit={onSubmit}
          autoComplete="off"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6"
        >

          {/* Empresa */}
          <fieldset className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              Empresa
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Nombre *</span>
                <Input
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme S.A."
                  autoComplete="off"
                  className="rounded-xl border-zinc-200 bg-zinc-50 focus:bg-white"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Slug público *</span>
                <Input
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="acme-sa"
                  autoComplete="off"
                  className="rounded-xl border-zinc-200 bg-zinc-50 font-mono text-sm focus:bg-white"
                />
              </label>
            </div>
          </fieldset>

          <div className="h-px bg-zinc-100" />

          {/* Admin */}
          <fieldset className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              Usuario administrador
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Email *</span>
                <Input
                  required
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@acme.com"
                  autoComplete="off"
                  name="new-tenant-admin-email"
                  className="rounded-xl border-zinc-200 bg-zinc-50 focus:bg-white"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Contraseña temporal *</span>
                <div className="flex gap-2">
                  <Input
                    required
                    type={showPassword ? 'text' : 'password'}
                    minLength={MIN_PASSWORD_LENGTH}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={`Mín. ${MIN_PASSWORD_LENGTH} caracteres`}
                    autoComplete="new-password"
                    name="new-tenant-admin-password"
                    className="rounded-xl border-zinc-200 bg-zinc-50 focus:bg-white flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-500 hover:bg-zinc-100 transition shrink-0"
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </label>
            </div>
          </fieldset>

          <div className="h-px bg-zinc-100" />

          {/* Plan */}
          <fieldset className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              Plan
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Tipo de plan</span>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as PlanKey)}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-black focus:bg-white"
                >
                  {PLAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Usuarios máximos</span>
                <Input
                  type="text"
                  value={maxUsersDisplay}
                  readOnly
                  disabled
                  className="rounded-xl border-zinc-200 bg-zinc-100 text-zinc-500 cursor-not-allowed"
                />
              </label>
            </div>

            {planLimits.trialDays && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-800">
                  Este plan incluye un periodo de prueba de <strong>{planLimits.trialDays} días</strong> desde la creación del tenant.
                </p>
              </div>
            )}
            {planLimits.maxBudgetsPerMonth && (
              <p className="text-xs text-zinc-400">
                Límite de {planLimits.maxBudgetsPerMonth} presupuestos por mes (aplicado próximamente).
              </p>
            )}
          </fieldset>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-full bg-black py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSaving ? 'Creando tenant...' : 'Crear tenant'}
            </button>
          </div>

          {/* Feedback */}
          {message && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="font-mono text-xs text-zinc-700">{message}</p>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}