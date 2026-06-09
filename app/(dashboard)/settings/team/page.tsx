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

export default function TeamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { branding } = useBranding()
  const primaryColor = branding?.primaryColor ?? '#6366f1'
  const accentColor = branding?.accentColor ?? '#8b5cf6'

  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isManager =
    session?.user?.role === 'owner' || session?.user?.role === 'admin'

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
      const { users } = await res.json()
      setUsers(users)
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
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: `linear-gradient(135deg, #0f0c29, #1a1040, #0f1a2e)` }}
      >
        <Spinner />
      </div>
    )
  }

  // — Sin permisos —
  if (!isManager) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: `linear-gradient(135deg, #0f0c29, #1a1040, #0f1a2e)` }}
      >
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-8 py-6 text-center backdrop-blur-xl">
          <p className="text-red-300">No tenés permisos para gestionar el equipo.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: `linear-gradient(135deg, #0f0c29 0%, #1a1040 50%, #0f1a2e 100%)` }}
    >
      {/* Orbs */}
      <div
        className="pointer-events-none fixed -left-24 -top-24 h-96 w-96 rounded-full blur-[120px]"
        style={{ background: `${primaryColor}44` }}
      />
      <div
        className="pointer-events-none fixed -bottom-16 -right-16 h-80 w-80 rounded-full blur-[100px]"
        style={{ background: `${accentColor}33` }}
      />
      <div
        className="pointer-events-none fixed bottom-1/3 left-1/4 h-64 w-64 rounded-full blur-[90px]"
        style={{ background: `#06b6d433` }}
      />

      <div className="relative z-10">
        <PageBreadcrumbs />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Gestión del Equipo
              </h1>
              <p className="text-sm text-white/40">
                Creá y gestioná los usuarios de tu equipo
              </p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-blue-400/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-300 backdrop-blur-sm">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
              {message}
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Formulario crear usuario */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)' }}
              >
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
                  Nuevo usuario
                </p>
                <CreateUserForm onUserCreated={() => fetchUsers()} />
              </div>
            </div>

            {/* Lista de usuarios */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">Usuarios</h2>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: `${primaryColor}55`, border: `1px solid ${primaryColor}44` }}
                  >
                    {users.length}
                  </span>
                </div>
              </div>

              {users.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-6 py-12 text-center backdrop-blur-sm">
                  <p className="text-sm text-white/30">No hay usuarios aún.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl transition hover:bg-white/[0.09]"
                      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)' }}
                    >
                      <UserCard user={user} onUpdate={handleUpdateUser} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}