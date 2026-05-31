'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CreateUserForm, UserCard } from '@/components/team-form'
import { PageBreadcrumbs } from '@/components/page-breadcrumbs'
import { Spinner } from '@/components/ui/spinner'

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
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isManager = session?.user?.role === 'owner' || session?.user?.role === 'admin'

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
          `Contraseña temporal: ${payload.tempPassword}. Comparte con el usuario.`
        )
      }

      await fetchUsers()
    } catch (err: any) {
      setError(err?.message ?? 'Error updating user')
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (!isManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-6 rounded-lg border border-red-200 bg-red-50">
            <p className="text-red-800">
              No tienes permisos para gestionar el equipo.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <PageBreadcrumbs />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <svg
                className="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Gestión del Equipo
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Crea y gestiona los usuarios de tu equipo
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create form */}
          <div className="lg:col-span-1">
            <CreateUserForm onUserCreated={() => fetchUsers()} />
          </div>

          {/* Users list */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Usuarios ({users.length})
                </h2>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {message && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-800">{message}</p>
                </div>
              )}

              {users.length === 0 ? (
                <p className="text-muted-foreground">No hay usuarios aún.</p>
              ) : (
                <div className="grid gap-3">
                  {users.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onUpdate={handleUpdateUser}
                    />
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
