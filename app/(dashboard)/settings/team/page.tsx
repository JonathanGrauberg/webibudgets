//app\(dashboard)\settings\team\page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CreateUserForm, UserCard } from '@/components/team-form'
import { PageBreadcrumbs } from '@/components/page-breadcrumbs'
import { Spinner } from '@/components/ui/spinner'
import { useBranding } from '@/components/branding-provider'

type User = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
}

type PlanInfo = {
  plan: string
  maxUsers: number
  activeUsers: number
}

// Role badge — neutral pill, black for owner/admin
function RoleBadge({ role }: { role: string }) {
  const isPrivileged = role === 'owner' || role === 'admin'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
        isPrivileged
          ? 'bg-black text-white'
          : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
      }`}
    >
      {role}
    </span>
  )
}

// Status dot
function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-zinc-300'}`}
      />
      <span className={`text-xs ${active ? 'text-zinc-600' : 'text-zinc-400'}`}>
        {active ? 'Activo' : 'Inactivo'}
      </span>
    </span>
  )
}

// User initials avatar
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold shrink-0 select-none">
      {initials}
    </div>
  )
}

// Plan limit banner — se muestra arriba de la lista cuando está cerca del límite
function PlanLimitBanner({ planInfo }: { planInfo: PlanInfo }) {
  const { activeUsers, maxUsers, plan } = planInfo
  const atLimit = activeUsers >= maxUsers
  const nearLimit = activeUsers >= maxUsers - 1 && !atLimit

  if (!atLimit && !nearLimit) return null

  return (
    <div
      className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        atLimit
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-amber-200 bg-amber-50 text-amber-800'
      }`}
    >
      <span className="text-base mt-0.5">{atLimit ? '🔒' : '⚠️'}</span>
      <div className="flex-1">
        {atLimit ? (
          <>
            <span className="font-semibold">Límite alcanzado.</span>{' '}
            Tu plan <span className="font-medium capitalize">{plan}</span> permite hasta{' '}
            <span className="font-medium">{maxUsers} usuarios activos</span>.{' '}
            No podés crear ni reactivar usuarios hasta que liberes un slot o actualices tu plan.
          </>
        ) : (
          <>
            <span className="font-semibold">Casi en el límite.</span>{' '}
            Tenés {activeUsers} de {maxUsers} usuarios activos en tu plan{' '}
            <span className="font-medium capitalize">{plan}</span>.
          </>
        )}
      </div>
      <a
        href="/pricing"
        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
          atLimit
            ? 'bg-red-800 text-white hover:bg-red-700'
            : 'bg-amber-800 text-white hover:bg-amber-700'
        }`}
      >
        Ver planes →
      </a>
    </div>
  )
}

export default function TeamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { branding } = useBranding()

  const [users, setUsers] = useState<User[]>([])
  const [planInfo, setPlanInfo] = useState<PlanInfo>({ plan: 'free', maxUsers: 5, activeUsers: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isManager =
    session?.user?.role === 'owner' || session?.user?.role === 'admin'

  const isAtLimit = planInfo.activeUsers >= planInfo.maxUsers

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (status !== 'authenticated' || !isManager) return
    fetchUsers()
  }, [status, isManager, router])

  async function fetchUsers() {
    try {
      setIsLoading(true)
      const res = await fetch('/api/tenants/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users)
      setPlanInfo({
        plan: data.plan ?? 'free',
        maxUsers: data.maxUsers ?? 5,
        activeUsers: data.activeUsers ?? 0,
      })
    } catch (err: any) {
      setError(err?.message ?? 'Error loading users')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUpdateUser(userId: string, updates: any) {
    try {
      setError(null)
      setMessage(null)

      const res = await fetch('/api/tenants/users', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        // Mensaje específico para límite de plan
        if (payload?.error === 'plan_limit_reached') {
          throw new Error('No podés activar este usuario: límite del plan alcanzado. Actualizá tu plan en /pricing.')
        }
        throw new Error(payload?.error || 'Error updating user')
      }

      const payload = await res.json()
      if (payload.tempPassword) {
        setMessage(
          `Contraseña temporal: ${payload.tempPassword}. Compartila con el usuario.`
        )
      }

      await fetchUsers()
    } catch (err: any) {
      setError(err?.message ?? 'Error updating user')
    }
  }

  // — Loading —
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6]">
        <Spinner />
      </div>
    )
  }

  // — Sin permisos —
  if (!isManager) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6] p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-8 py-6 text-center">
          <p className="text-sm text-red-600">No tenés permisos para gestionar el equipo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <PageBreadcrumbs />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Hero header ──────────────────────────────────────────── */}
        <div className="mb-10 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-[64px] font-black leading-none tracking-tighter text-black">
                {users.length}
              </span>
              <div className="pb-1">
                <p className="text-xl font-bold text-black leading-tight">
                  {users.length === 1 ? 'miembro' : 'miembros'}
                </p>
                <p className="text-sm text-zinc-400">
                  {planInfo.activeUsers} activo{planInfo.activeUsers !== 1 ? 's' : ''} · {users.length - planInfo.activeUsers} inactivo{users.length - planInfo.activeUsers !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* right side: section label */}
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 pb-3">
            Gestión del equipo
          </p>
        </div>

        {/* thin divider */}
        <div className="mb-8 h-px bg-zinc-200" />

        {/* ── Alerts ───────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42z" />
            </svg>
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            <svg className="h-4 w-4 mt-0.5 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
            <span className="font-mono text-xs leading-relaxed">{message}</span>
          </div>
        )}

        {/* ── Main grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ── Formulario nuevo usuario ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Nuevo usuario
              </p>
              <CreateUserForm onUserCreated={fetchUsers} isAtLimit={isAtLimit} />
            </div>
          </div>

          {/* ── Lista de usuarios ── */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Usuarios del espacio
              </p>
              {/* Contador dinámico con color según proximidad al límite */}
              <span
                className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${
                  isAtLimit
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : planInfo.activeUsers >= planInfo.maxUsers - 1
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-zinc-200 bg-white text-zinc-500'
                }`}
              >
                {planInfo.activeUsers} activos / {planInfo.maxUsers} del plan
              </span>
            </div>

            {/* Banner de límite */}
            <PlanLimitBanner planInfo={planInfo} />

            {users.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-transparent px-6 py-16 text-center">
                <p className="text-sm text-zinc-400">No hay usuarios todavía.</p>
                <p className="mt-1 text-xs text-zinc-300">Creá el primero desde el formulario.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user, idx) => (
                  <div
                    key={user.id}
                    className="group rounded-2xl border border-zinc-200 bg-white px-5 py-4 transition-shadow hover:shadow-md"
                  >
                    {/* Top row: avatar + name + role + status */}
                    <div className="flex items-center gap-4">
                      <Avatar name={user.name} />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-black truncate">
                            {user.name}
                          </span>
                          <RoleBadge role={user.role} />
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-400 truncate">{user.email}</p>
                      </div>

                      <div className="hidden sm:flex items-center gap-4 shrink-0">
                        <StatusDot active={user.active} />
                        <span className="text-[11px] font-mono text-zinc-200 select-none w-5 text-right">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    {/* Expandable actions */}
                    <div className="mt-3 border-t border-zinc-100 pt-3">
                      <UserCard user={user} onUpdate={handleUpdateUser} isAtLimit={isAtLimit} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}