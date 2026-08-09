'use client'
//app\(dashboard)\tasks\page.tsx
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Monitor } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { TasksBoard } from '@/components/tasks/tasks-board'

const MANAGER_ROLES = ['owner', 'admin'] // 👈 mismo criterio que /kiosco

export default function TasksPage() {
  const { data: session } = useSession()
  const canManageTasks = MANAGER_ROLES.includes(session?.user?.role as string)

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col md:h-full">
      <PageHeader title="Tareas" description="Organizador diario del equipo">
        <Link href="/kiosco">
          <Button variant="outline" className="gap-2">
            <Monitor className="h-4 w-4" />
            Ir al Kiosco
          </Button>
        </Link>
      </PageHeader>
      <div className="flex-1 min-h-0 overflow-hidden p-4 md:p-6">
        <TasksBoard canEdit={canManageTasks} />
      </div>
    </div>
  )
}