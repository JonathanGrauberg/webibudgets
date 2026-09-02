// app/(dashboard)/help/page.tsx
import { PageHeader } from '@/components/page-header'
import { HelpManual } from '@/components/help/help-manual'

export default function HelpPage() {
  return (
    <div className="min-h-screen">
      <PageHeader title="Ayuda" description="Manual de uso — buscá por palabra clave o navegá por sección" />
      <div className="p-4 md:p-6 lg:p-8">
        <HelpManual />
      </div>
    </div>
  )
}
