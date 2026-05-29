'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const plans = [
  { value: 'free', label: 'Free' },
  { value: 'starter', label: 'Starter' },
  { value: 'team', label: 'Team' },
  { value: 'business', label: 'Business' },
]

export default function CreateTenantForm() {
  const [companyName, setCompanyName] = useState('')
  const [slug, setSlug] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [password, setPassword] = useState('')
  const [plan, setPlan] = useState('free')
  const [maxUsers, setMaxUsers] = useState(5)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          companyName,
          slug,
          adminEmail,
          password,
          plan,
          maxUsers,
        }),
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
      setMaxUsers(5)
    } catch (err: any) {
      setError(err?.message ?? 'Error desconocido')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Nuevo tenant</p>
        <h2 className="mt-2 text-3xl font-semibold">Crear tenant y usuario admin</h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Completa los datos básicos para crear una nueva empresa cliente con usuario administrativo.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Nombre de la empresa</span>
          <Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Slug público</span>
          <Input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="tenant-slug" required />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email admin</span>
          <Input type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} required />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Password temporal</span>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Plan</span>
          <select value={plan} onChange={(event) => setPlan(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-500 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            {plans.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Usuarios máximos</span>
          <Input type="number" min={1} max={100} value={maxUsers} onChange={(event) => setMaxUsers(Number(event.target.value))} required />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={isSaving} className="rounded-full">
          {isSaving ? 'Creando tenant...' : 'Crear tenant'}
        </Button>
        <p className="text-sm text-slate-600 dark:text-slate-400">Este usuario administrador podrá ingresar al tenant recién creado.</p>
      </div>

      {message && <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">{message}</div>}
      {error && <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/20 dark:text-rose-300">{error}</div>}
    </form>
  )
}
