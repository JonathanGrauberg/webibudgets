import React from 'react'
import { headers } from 'next/headers'
import { getTenantBranding, TENANT_HEADER } from '@/lib/tenant'
import CompanySettingsForm from '@/components/company-settings-form'

export default async function CompanySettingsPage() {
  const h = await headers()
  const tenantId = h.get(TENANT_HEADER) ?? process.env.DEFAULT_TENANT_ID ?? null

  let branding = null
  if (tenantId) {
    try {
      branding = await getTenantBranding(tenantId)
    } catch (err) {
      branding = null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl shadow-lg shadow-sky-500/20">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18"></path><path d="M12 3v18"></path></svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Company Settings</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your workspace branding and company information</p>
            </div>
          </div>
        </div>

        <CompanySettingsForm initialBranding={branding ?? undefined} />
      </div>
    </div>
  )
}
