'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Palette,
  Image as ImageIcon,
  Monitor,
  Users,
  Crown,
  Check,
  Save,
  Plus,
  Loader2,
} from 'lucide-react'

import type { Branding } from '@/lib/branding'
import { effectiveBranding } from '@/lib/branding'
import { useBranding } from '@/components/branding-provider'
import { FileUploadZone } from '@/components/settings/company/bolt-file-upload-zone'
import { ColorPicker } from '@/components/settings/company/bolt-color-picker'
import {
  SidebarPreview,
  DashboardPreview,
  PDFPreview,
  MobilePreview,
  type ColorSystem,
} from '@/components/settings/company/bolt-previews'

export type CompanyBrandingSettingsClientProps = {
  initialBranding?: Branding
}

type CompanyInfo = {
  name: string
  email: string
  phone: string
  address: string
  description: string
}

type BrandingAssets = {
  logo: string | null
  favicon: string | null
  watermark: string | null
  sidebarIcon: string | null
}

type TeamMember = {
  id: string
  name: string
  role: string
  email: string
}

type PersistedState = {
  name: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DEBOUNCE_MS = 650

function buildPersistedState(
  companyInfo: CompanyInfo,
  brandingAssets: BrandingAssets,
  colorSystem: ColorSystem
): PersistedState {
  return {
    name: companyInfo.name,
    logoUrl: brandingAssets.logo,
    faviconUrl: brandingAssets.favicon,
    primaryColor: colorSystem.primary,
    secondaryColor: colorSystem.secondary,
    accentColor: colorSystem.accent,
  }
}

function serializeBranding(brandingAssets: BrandingAssets, colorSystem: ColorSystem): string {
  return JSON.stringify({
    logoUrl: brandingAssets.logo,
    faviconUrl: brandingAssets.favicon,
    primaryColor: colorSystem.primary,
    secondaryColor: colorSystem.secondary,
    accentColor: colorSystem.accent,
  })
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
        active
          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50'
      }`}
      whileHover={{ scale: active ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  )
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-1.5 text-sm"
    >
      {status === 'saving' && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
          <span className="text-slate-500">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-3.5 h-3.5 text-green-600" />
          <span className="text-green-600">Saved</span>
        </>
      )}
      {status === 'error' && <span className="text-red-600">Save failed</span>}
    </motion.div>
  )
}

function TeamPlanCard({
  currentUsers,
  maxUsers,
  colors,
}: {
  currentUsers: number
  maxUsers: number
  colors: ColorSystem
}) {
  const usagePercent = maxUsers > 0 ? Math.min(100, (currentUsers / maxUsers) * 100) : 0

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 relative">
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 100%)` }}
      />
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)` }}
            >
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Team Plan</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Workspace limits</p>
            </div>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}
          >
            Active
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">Team Members</span>
            </div>
            <span className="font-medium text-slate-900 dark:text-slate-50">
              {currentUsers} / {maxUsers}
            </span>
          </div>
          <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ duration: 0.5 }}
              style={{ backgroundColor: colors.primary }}
            />
          </div>
        </div>

        <Link
          href="/settings/team"
          className="block w-full py-2.5 rounded-lg text-white font-medium text-center transition-all"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)` }}
        >
          Manage Team
        </Link>
      </div>
    </div>
  )
}

export default function CompanyBrandingSettingsClient({ initialBranding }: CompanyBrandingSettingsClientProps) {
  const effective = useMemo(() => effectiveBranding(initialBranding), [initialBranding])
  const { updateBranding } = useBranding()

  const [activeTab, setActiveTab] = useState('company')
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: effective.name ?? '',
    email: '',
    phone: '',
    address: '',
    description: '',
  })
  const [brandingAssets, setBrandingAssets] = useState<BrandingAssets>({
    logo: effective.logoUrl ?? null,
    favicon: effective.faviconUrl ?? null,
    watermark: null,
    sidebarIcon: null,
  })
  const [colorSystem, setColorSystem] = useState<ColorSystem>({
    primary: effective.primaryColor ?? '#0ea5e9',
    secondary: effective.secondaryColor ?? '#64748b',
    accent: effective.accentColor ?? '#10b981',
  })

  const [savedBrandingSnapshot, setSavedBrandingSnapshot] = useState(() =>
    serializeBranding(
      { logo: effective.logoUrl ?? null, favicon: effective.faviconUrl ?? null, watermark: null, sidebarIcon: null },
      {
        primary: effective.primaryColor ?? '#0ea5e9',
        secondary: effective.secondaryColor ?? '#64748b',
        accent: effective.accentColor ?? '#10b981',
      }
    )
  )
  const [savedName, setSavedName] = useState(effective.name ?? '')

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isSavingName, setIsSavingName] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [nameSaveMessage, setNameSaveMessage] = useState<string | null>(null)

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [maxUsers] = useState(5)

  const saveInFlightRef = useRef(false)
  const pendingSaveRef = useRef(false)
  const latestPayloadRef = useRef<PersistedState | null>(null)
  const hasMountedRef = useRef(false)
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const brandingChanged =
    serializeBranding(brandingAssets, colorSystem) !== savedBrandingSnapshot
  const nameChanged = companyInfo.name !== savedName

  const previewLogo = brandingAssets.sidebarIcon || brandingAssets.logo

  const persistBranding = useCallback(
    async (payload: PersistedState) => {
      if (saveInFlightRef.current) {
        pendingSaveRef.current = true
        latestPayloadRef.current = payload
        return
      }

      saveInFlightRef.current = true
      setSaveStatus('saving')
      setSaveError(null)

      let currentPayload = payload

      try {
        while (true) {
          pendingSaveRef.current = false

          const res = await fetch('/api/tenants', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(currentPayload),
          })

          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body?.error || 'Failed to save settings')
          }

          setSavedBrandingSnapshot(
            serializeBranding(
              {
                logo: currentPayload.logoUrl,
                favicon: currentPayload.faviconUrl,
                watermark: brandingAssets.watermark,
                sidebarIcon: brandingAssets.sidebarIcon,
              },
              {
                primary: currentPayload.primaryColor,
                secondary: currentPayload.secondaryColor,
                accent: currentPayload.accentColor,
              }
            )
          )

          updateBranding({
            name: currentPayload.name,
            logoUrl: currentPayload.logoUrl,
            faviconUrl: currentPayload.faviconUrl,
            primaryColor: currentPayload.primaryColor,
            secondaryColor: currentPayload.secondaryColor,
            accentColor: currentPayload.accentColor,
          })

          if (pendingSaveRef.current && latestPayloadRef.current) {
            currentPayload = latestPayloadRef.current
            latestPayloadRef.current = null
            continue
          }

          break
        }

        setSaveStatus('saved')
        if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current)
        savedStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to save settings'
        setSaveError(message)
        setSaveStatus('error')
      } finally {
        saveInFlightRef.current = false
      }
    },
    [brandingAssets.sidebarIcon, brandingAssets.watermark, updateBranding]
  )

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    if (!brandingChanged) return

    const timer = setTimeout(() => {
      const payload = buildPersistedState(companyInfo, brandingAssets, colorSystem)
      void persistBranding(payload)
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [brandingAssets, colorSystem, brandingChanged, companyInfo, persistBranding])

  useEffect(() => {
    return () => {
      if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'plan') return

    let cancelled = false

    async function loadTeam() {
      try {
        const res = await fetch('/api/tenants/users')
        if (!res.ok) return
        const payload = await res.json()
        if (!cancelled && Array.isArray(payload.users)) {
          setTeamMembers(payload.users)
        }
      } catch {
        // keep empty list on failure
      }
    }

    loadTeam()
    return () => {
      cancelled = true
    }
  }, [activeTab])

  const updateCompanyInfo = useCallback((field: keyof CompanyInfo, value: string) => {
    setCompanyInfo((prev) => ({ ...prev, [field]: value }))
  }, [])

  const updateBrandingAsset = useCallback((field: keyof BrandingAssets, value: string | null) => {
    setBrandingAssets((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSaveCompanyName = async () => {
    setIsSavingName(true)
    setSaveError(null)
    setNameSaveMessage(null)

    try {
      const res = await fetch('/api/tenants', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: companyInfo.name }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Failed to save company name')
      }

      setSavedName(companyInfo.name)
      updateBranding({ name: companyInfo.name })
      setNameSaveMessage('Company name saved')
      setTimeout(() => setNameSaveMessage(null), 2500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save company name'
      setSaveError(message)
    } finally {
      setIsSavingName(false)
    }
  }

  const tabs = [
    { id: 'company', icon: Building2, label: 'Company' },
    { id: 'branding', icon: ImageIcon, label: 'Branding' },
    { id: 'colors', icon: Palette, label: 'Colors' },
    { id: 'preview', icon: Monitor, label: 'Preview' },
    { id: 'plan', icon: Crown, label: 'Plan' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24">
      <div className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${colorSystem.primary} 0%, ${colorSystem.accent} 100%)`,
                  boxShadow: `0 4px 20px ${colorSystem.primary}30`,
                }}
              >
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Company Settings</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Manage your workspace branding</p>
              </div>
            </div>

            <SaveIndicator status={saveStatus} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {saveError && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{saveError}</div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'company' && (
            <motion.div
              key="company"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Company Information</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your company details visible to team members</p>
                  </div>
                  {nameChanged && (
                    <button
                      type="button"
                      onClick={handleSaveCompanyName}
                      disabled={isSavingName}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <Save className="w-4 h-4" />
                      {isSavingName ? 'Saving...' : 'Save Name'}
                    </button>
                  )}
                </div>
                <div className="p-6 space-y-6">
                  {nameSaveMessage && (
                    <p className="text-sm text-green-600">{nameSaveMessage}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={companyInfo.name}
                          onChange={(e) => updateCompanyInfo('name', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 transition-all text-slate-900 dark:text-slate-50"
                          style={{ outlineColor: 'var(--color-primary)' }}
                          placeholder="Your company name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          value={companyInfo.email}
                          onChange={(e) => updateCompanyInfo('email', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-slate-50"
                          placeholder="company@example.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          value={companyInfo.phone}
                          onChange={(e) => updateCompanyInfo('phone', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-slate-50"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Business Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={companyInfo.address}
                          onChange={(e) => updateCompanyInfo('address', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-slate-50"
                          placeholder="123 Street, City, State ZIP"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Company Description</label>
                    <textarea
                      value={companyInfo.description}
                      onChange={(e) => updateCompanyInfo('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none text-slate-900 dark:text-slate-50"
                      placeholder="Tell us about your company..."
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Branding changes save automatically. Only the company name requires manual save.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'branding' && (
            <motion.div key="branding" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Brand Assets</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upload your logos and brand assets — changes save automatically</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FileUploadZone label="Company Logo" value={brandingAssets.logo} onChange={(v) => updateBrandingAsset('logo', v)} />
                  <FileUploadZone label="Favicon" value={brandingAssets.favicon} onChange={(v) => updateBrandingAsset('favicon', v)} />
                  <FileUploadZone label="PDF Watermark" value={brandingAssets.watermark} onChange={(v) => updateBrandingAsset('watermark', v)} />
                  <FileUploadZone label="Sidebar Icon/Logo" value={brandingAssets.sidebarIcon} onChange={(v) => updateBrandingAsset('sidebarIcon', v)} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'colors' && (
            <motion.div key="colors" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Color System</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customize your brand colors — changes save automatically</p>
                </div>
                <div className="p-6 space-y-6">
                  <ColorPicker label="Primary Color" value={colorSystem.primary} onChange={(v) => setColorSystem((p) => ({ ...p, primary: v }))} />
                  <ColorPicker label="Secondary Color" value={colorSystem.secondary} onChange={(v) => setColorSystem((p) => ({ ...p, secondary: v }))} />
                  <ColorPicker label="Accent Color" value={colorSystem.accent} onChange={(v) => setColorSystem((p) => ({ ...p, accent: v }))} />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Live Color Preview</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex gap-3">
                    {(
                      [
                        { id: 'primary', color: colorSystem.primary },
                        { id: 'secondary', color: colorSystem.secondary },
                        { id: 'accent', color: colorSystem.accent },
                      ] as const
                    ).map(({ id, color }) => (
                      <div key={id} className="flex-1 h-20 rounded-xl shadow-lg" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div
                    className="h-24 rounded-xl shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${colorSystem.primary} 0%, ${colorSystem.secondary} 50%, ${colorSystem.accent} 100%)`,
                    }}
                  />
                  <div className="flex gap-2.5 flex-wrap">
                    <button type="button" className="px-5 py-2 rounded-lg text-white font-medium text-sm" style={{ backgroundColor: colorSystem.primary }}>
                      Primary Button
                    </button>
                    <button
                      type="button"
                      className="px-5 py-2 rounded-lg font-medium text-sm bg-white dark:bg-slate-800"
                      style={{ border: `2px solid ${colorSystem.secondary}`, color: colorSystem.secondary }}
                    >
                      Secondary
                    </button>
                    <button type="button" className="px-5 py-2 rounded-lg text-white font-medium text-sm" style={{ backgroundColor: colorSystem.accent }}>
                      Accent
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SidebarPreview colors={colorSystem} logo={previewLogo} />
                <DashboardPreview colors={colorSystem} />
                <PDFPreview
  colors={colorSystem}
  watermark={brandingAssets.watermark}
  logo={previewLogo}
/>
                <MobilePreview colors={colorSystem} logo={previewLogo} />
              </div>
            </motion.div>
          )}

          {activeTab === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Manage Team</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your team members and permissions</p>
                </div>
                <div className="p-6 space-y-4">
                  {teamMembers.length === 0 ? (
                    <p className="text-sm text-slate-500">No team members loaded yet.</p>
                  ) : (
                    teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: colorSystem.primary }}
                          >
                            {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-50">{member.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
                          </div>
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                          style={{ backgroundColor: `${colorSystem.primary}15`, color: colorSystem.primary }}
                        >
                          {member.role}
                        </span>
                      </div>
                    ))
                  )}
                  <Link
                    href="/settings/team"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 transition-all font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Invite Team Member
                  </Link>
                </div>
              </div>
              <TeamPlanCard currentUsers={teamMembers.length} maxUsers={maxUsers} colors={colorSystem} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
