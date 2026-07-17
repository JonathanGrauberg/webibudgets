//app\(dashboard)\settings\company\page.tsx
import React from 'react'
import { headers } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantBranding, TENANT_HEADER } from '@/lib/tenant'
import CompanyBrandingSettingsClient from '@/components/settings/company/company-branding-settings-client'

function canManageCompanySettings(role?: string | null): boolean {
  return role === 'owner' || role === 'admin'
}

export default async function CompanySettingsPage() {
  const session = await getServerSession(authOptions)
  const h = await headers()
  const tenantId = h.get(TENANT_HEADER) ?? process.env.DEFAULT_TENANT_ID ?? null

  if (!session || !canManageCompanySettings(session.user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-6 rounded-lg border bg-red-50">
          <p className="text-red-800">No tienes permisos para ver esta página.</p>
        </div>
      </div>
    )
  }

  let branding = null
  if (tenantId) {
    try {
      branding = await getTenantBranding(tenantId)
    } catch (err) {
      branding = null
    }
  }

  return <CompanyBrandingSettingsClient initialBranding={branding ?? undefined} />
}
