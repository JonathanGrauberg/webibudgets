// app/terminos/page.tsx
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LegalContent } from '@/components/legal/legal-content'
import { TERMS_MD } from '@/lib/legal-content'

export const metadata = {
  title: 'Términos y Condiciones | .budgets',
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" />
          Volver a .budgets
        </Link>
      </div>
      <LegalContent markdown={TERMS_MD} />
    </div>
  )
}