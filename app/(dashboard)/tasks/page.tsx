'use client'
//app\(dashboard)\tasks\page.tsx
import { PageHeader } from '@/components/page-header'
import { TasksBoard } from '@/components/tasks/tasks-board'

export default function TasksPage() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col md:h-full">
      <PageHeader title="Tareas" description="Organizador diario del equipo" />
      <div className="flex-1 min-h-0 overflow-hidden p-4 md:p-6">
        <TasksBoard />
      </div>
    </div>
  )
}