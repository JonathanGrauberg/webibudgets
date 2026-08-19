// app/privacidad/page.tsx
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LegalContent } from '@/components/legal/legal-content'
import { PRIVACY_POLICY_MD } from '@/lib/legal-content'

export const metadata = {
  title: 'Política de Privacidad | .budgets',
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" />
          Volver a .budgets
        </Link>
      </div>
      <LegalContent markdown={PRIVACY_POLICY_MD} />
    </div>
  )
}