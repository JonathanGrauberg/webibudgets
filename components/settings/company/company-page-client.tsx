'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Palette,
  Upload,
  Image as ImageIcon,
  Monitor,
  FileCode,
  Smartphone,
  Users,
  Crown,
  Check,
  Save,
  X,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react'

import CompanyInfoForm from '@/components/settings/company/company-info-form'
import TabNavigation from '@/components/settings/company/tab-navigation'
import TeamPlanCard from '@/components/settings/company/team-plan-card'
import PdfPreview from '@/components/settings/company/pdf-preview'
import MobilePreview from '@/components/settings/company/mobile-preview'
import DashboardPreview from '@/components/settings/company/dashboard-preview'
import SidebarPreview from '@/components/settings/company/sidebar-preview'

export default function CompanyPageClient({ initialBranding }: { initialBranding?: any }) {
  // keep local branding state to feed previews and form as needed
  const [branding, setBranding] = useState(initialBranding ?? {
    name: 'WebiBudgets',
    logoUrl: '/placeholder-logo.png',
    primaryColor: '#0F172A',
    secondaryColor: '#334155',
    accentColor: '#F59E0B',
  })

  useEffect(() => {
    setBranding(initialBranding ?? branding)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBranding])

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

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TabNavigation />

            <div className="bg-card rounded-lg p-6 border">
              <CompanyInfoForm initialBranding={branding} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <PdfPreview branding={branding} />
              </div>

              <div>
                <TeamPlanCard />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1 space-y-4">
            <MobilePreview branding={branding} />
            <DashboardPreview branding={branding} />
            <SidebarPreview branding={branding} />
          </aside>
        </div>
      </div>
    </div>
  )
}
