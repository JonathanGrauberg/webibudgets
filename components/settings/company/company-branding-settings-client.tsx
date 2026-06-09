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
import { getContrastColor } from '@/lib/contrast'
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
  website?: string
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
  watermarkUrl: string | null
  sidebarIconUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  watermarkOpacity: number
  showPageNumbers: boolean
  showWebsiteInPdf: boolean
  showFooterBranding: boolean
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DEBOUNCE_MS = 650

function buildPersistedState(
  companyInfo: CompanyInfo,
  brandingAssets: BrandingAssets,
  colorSystem: ColorSystem,
  pdfSettings: { watermarkOpacity: number; showPageNumbers: boolean; showWebsiteInPdf: boolean; showFooterBranding: boolean }
): PersistedState {
  return {
    name: companyInfo.name,
    logoUrl: brandingAssets.logo,
    watermarkUrl: brandingAssets.watermark,
    sidebarIconUrl: brandingAssets.sidebarIcon,
    faviconUrl: brandingAssets.favicon,
    primaryColor: colorSystem.primary,
    secondaryColor: colorSystem.secondary,
    accentColor: colorSystem.accent,
    watermarkOpacity: pdfSettings.watermarkOpacity,
    showPageNumbers: pdfSettings.showPageNumbers,
    showWebsiteInPdf: pdfSettings.showWebsiteInPdf,
    showFooterBranding: pdfSettings.showFooterBranding,
  }
}

function serializeBranding(
  brandingAssets: BrandingAssets,
  colorSystem: ColorSystem,
  pdfSettings: { watermarkOpacity: number; showPageNumbers: boolean; showWebsiteInPdf: boolean; showFooterBranding: boolean }
): string {
  return JSON.stringify({
    logoUrl: brandingAssets.logo,
    watermarkUrl: brandingAssets.watermark,
    sidebarIconUrl: brandingAssets.sidebarIcon,
    faviconUrl: brandingAssets.favicon,
    primaryColor: colorSystem.primary,
    secondaryColor: colorSystem.secondary,
    accentColor: colorSystem.accent,
    watermarkOpacity: pdfSettings.watermarkOpacity,
    showPageNumbers: pdfSettings.showPageNumbers,
    showWebsiteInPdf: pdfSettings.showWebsiteInPdf,
    showFooterBranding: pdfSettings.showFooterBranding,
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
          <span className="text-slate-500">Guardando...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-3.5 h-3.5 text-green-600" />
          <span className="text-green-600">Guardado</span>
        </>
      )}
      {status === 'error' && <span className="text-red-600">Error al guardar</span>}
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
              <Crown className="w-5 h-5" style={{ color: getContrastColor(colors.primary) }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Plan de Equipo</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Límites del espacio de trabajo</p>
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
              <span className="text-slate-600 dark:text-slate-400">Miembros</span>
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
            className="block w-full py-2.5 rounded-lg font-medium text-center transition-all"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`, color: getContrastColor(colors.primary) }}
          >
          Gestionar Equipo
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
    email: (initialBranding as any)?.email ?? '',
    phone: (initialBranding as any)?.phone ?? '',
    address: (initialBranding as any)?.address ?? '',
    website: (initialBranding as any)?.website ?? '',
    description: (initialBranding as any)?.description ?? '',
  })

  // Themes removed for MVP: use a single corporate visual theme.
  const [brandingAssets, setBrandingAssets] = useState<BrandingAssets>({
    logo: effective.logoUrl ?? null,
    favicon: effective.faviconUrl ?? null,
    watermark: effective.watermarkUrl ?? null,
    sidebarIcon: effective.sidebarIconUrl ?? null,
  })
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>((initialBranding as any)?.watermarkOpacity ?? 0.06)
  const [showPageNumbers, setShowPageNumbers] = useState<boolean>((initialBranding as any)?.showPageNumbers ?? true)
  const [showWebsiteInPdf, setShowWebsiteInPdf] = useState<boolean>((initialBranding as any)?.showWebsiteInPdf ?? true)
  const [showFooterBranding, setShowFooterBranding] = useState<boolean>((initialBranding as any)?.showFooterBranding ?? false)
  const [colorSystem, setColorSystem] = useState<ColorSystem>({
    primary: effective.primaryColor ?? '#0ea5e9',
    secondary: effective.secondaryColor ?? '#64748b',
    accent: effective.accentColor ?? '#10b981',
  })

  const [savedBrandingSnapshot, setSavedBrandingSnapshot] = useState(() =>
    serializeBranding(
    { logo: effective.logoUrl ?? null, favicon: effective.faviconUrl ?? null, watermark: effective.watermarkUrl ?? null, sidebarIcon: effective.sidebarIconUrl ?? null },
      {
        primary: effective.primaryColor ?? '#0ea5e9',
        secondary: effective.secondaryColor ?? '#64748b',
        accent: effective.accentColor ?? '#10b981',
      },
      {
        watermarkOpacity: (initialBranding as any)?.watermarkOpacity ?? 0.06,
        showPageNumbers: (initialBranding as any)?.showPageNumbers ?? true,
        showWebsiteInPdf: (initialBranding as any)?.showWebsiteInPdf ?? true,
        showFooterBranding: (initialBranding as any)?.showFooterBranding ?? false,
      }
    )
  )
  const [savedName, setSavedName] = useState(effective.name ?? '')

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isSavingName, setIsSavingName] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [nameSaveMessage, setNameSaveMessage] = useState<string | null>(null)

  const [savedCompanySnapshot, setSavedCompanySnapshot] = useState<string>(JSON.stringify({
    name: effective.name ?? '',
    email: (initialBranding as any)?.email ?? '',
    phone: (initialBranding as any)?.phone ?? '',
    address: (initialBranding as any)?.address ?? '',
    website: (initialBranding as any)?.website ?? '',
    description: (initialBranding as any)?.description ?? '',
  }))
  const [isSavingCompany, setIsSavingCompany] = useState(false)
  const [companySaveMessage, setCompanySaveMessage] = useState<string | null>(null)

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [maxUsers] = useState(5)

  const saveInFlightRef = useRef(false)
  const pendingSaveRef = useRef(false)
  const latestPayloadRef = useRef<PersistedState | null>(null)
  const hasMountedRef = useRef(false)
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lastSeenBrandingPropsRef = useRef(savedBrandingSnapshot)
  const lastSeenCompanyPropsRef = useRef(savedCompanySnapshot)
  // Sync incoming `initialBranding` with local state when it changes.
  // We compare serialized snapshots to avoid stomping on local edits
  // when the user is actively modifying fields.
  useEffect(() => {
    const eff = effective

    const incomingBrandingSerialized = serializeBranding(
      { logo: eff.logoUrl ?? null, favicon: eff.faviconUrl ?? null, watermark: eff.watermarkUrl ?? null, sidebarIcon: eff.sidebarIconUrl ?? null },
      {
        primary: eff.primaryColor ?? '#0ea5e9',
        secondary: eff.secondaryColor ?? '#64748b',
        accent: eff.accentColor ?? '#10b981',
      },
      {
        watermarkOpacity: (initialBranding as any).watermarkOpacity ?? 0.06,
        showPageNumbers: (initialBranding as any).showPageNumbers ?? true,
        showWebsiteInPdf: (initialBranding as any).showWebsiteInPdf ?? true,
        showFooterBranding: (initialBranding as any).showFooterBranding ?? false,
      }
    )

    // 🌟 Ahora comparamos contra la referencia del componente, no contra el snapshot local de guardado
    if (incomingBrandingSerialized !== lastSeenBrandingPropsRef.current) {
      setBrandingAssets({ logo: eff.logoUrl ?? null, favicon: eff.faviconUrl ?? null, watermark: eff.watermarkUrl ?? null, sidebarIcon: eff.sidebarIconUrl ?? null })
      setColorSystem({
        primary: eff.primaryColor ?? '#0ea5e9',
        secondary: eff.secondaryColor ?? '#64748b',
        accent: eff.accentColor ?? '#10b981',
      })
      setWatermarkOpacity((initialBranding as any).watermarkOpacity ?? 0.06)
      setShowPageNumbers((initialBranding as any).showPageNumbers ?? true)
      setShowWebsiteInPdf((initialBranding as any).showWebsiteInPdf ?? true)
      setShowFooterBranding((initialBranding as any).showFooterBranding ?? false)
      setSavedBrandingSnapshot(incomingBrandingSerialized)
      lastSeenBrandingPropsRef.current = incomingBrandingSerialized
    }

    const incomingCompanySerialized = JSON.stringify({
      name: eff.name ?? '',
      email: (initialBranding as any).email ?? '',
      phone: (initialBranding as any).phone ?? '',
      address: (initialBranding as any).address ?? '',
      website: (initialBranding as any).website ?? '',
      description: (initialBranding as any).description ?? '',
    })

    // 🌟 Hacemos lo mismo para la info de la empresa
    if (incomingCompanySerialized !== lastSeenCompanyPropsRef.current) {
      setCompanyInfo({
        name: eff.name ?? '',
        email: (initialBranding as any).email ?? '',
        phone: (initialBranding as any).phone ?? '',
        address: (initialBranding as any).address ?? '',
        website: (initialBranding as any).website ?? '',
        description: (initialBranding as any).description ?? '',
      })
      setSavedCompanySnapshot(incomingCompanySerialized)
      setSavedName(eff.name ?? '')
      lastSeenCompanyPropsRef.current = incomingCompanySerialized
    }

  }, [initialBranding, effective]) // 🌟 Limpiamos las dependencias para evitar ejecuciones infinitas

  const brandingChanged =
    serializeBranding(brandingAssets, colorSystem, { watermarkOpacity, showPageNumbers, showWebsiteInPdf, showFooterBranding }) !== savedBrandingSnapshot
  const nameChanged = companyInfo.name !== savedName
  const companyChanged = JSON.stringify({
    name: companyInfo.name,
    email: companyInfo.email,
    phone: companyInfo.phone,
    address: companyInfo.address,
    website: companyInfo.website ?? '',
    description: companyInfo.description,
  }) !== savedCompanySnapshot

  const previewLogo = brandingAssets.logo || brandingAssets.sidebarIcon

const persistBranding = useCallback(
  async (payload: PersistedState) => {
    console.log('[persistBranding llamado]', {
      logoUrl: payload.logoUrl?.slice(0, 30) || 'NULL', // ✅ Corregido con ?.
      watermarkUrl: payload.watermarkUrl?.slice(0, 30) || 'NULL', // ✅ Corregido con ?.
      inFlight: saveInFlightRef.current,
    })

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

        console.debug('[persistBranding] sending payload', currentPayload)
        console.debug('[persistBranding] brandingAssets (closure)', { 
          watermark: brandingAssets.watermark, 
          sidebarIcon: brandingAssets.sidebarIcon 
        })

        console.log('[PUNTO 1 - Cliente antes del PUT]', {
          watermarkUrl: currentPayload.watermarkUrl?.slice(0, 50) || null, // ✅ Corregido con ?.
          sidebarIconUrl: currentPayload.sidebarIconUrl?.slice(0, 50) || null, // ✅ Corregido con ?.
        })

        const res = await fetch('/api/tenants', {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(currentPayload),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to save settings')
        }

        setSavedBrandingSnapshot(
          serializeBranding(
            {
              logo: currentPayload.logoUrl,
              favicon: currentPayload.faviconUrl,
              watermark: currentPayload.watermarkUrl,
              sidebarIcon: currentPayload.sidebarIconUrl,
            },
            {
              primary: currentPayload.primaryColor,
              secondary: currentPayload.secondaryColor,
              accent: currentPayload.accentColor,
            },
            {
              watermarkOpacity: currentPayload.watermarkOpacity,
              showPageNumbers: currentPayload.showPageNumbers,
              showWebsiteInPdf: currentPayload.showWebsiteInPdf,
              showFooterBranding: currentPayload.showFooterBranding,
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
          watermarkUrl: currentPayload.watermarkUrl,
          sidebarIconUrl: currentPayload.sidebarIconUrl,
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
  [updateBranding]
)

useEffect(() => {
  if (!hasMountedRef.current) {
    hasMountedRef.current = true
    return
  }

  if (!brandingChanged) return

  const timer = setTimeout(() => {
    const payload = buildPersistedState(companyInfo, brandingAssets, colorSystem, { 
      watermarkOpacity, 
      showPageNumbers, 
      showWebsiteInPdf, 
      showFooterBranding 
    })
    void persistBranding(payload)
  }, AUTOSAVE_DEBOUNCE_MS)

  return () => clearTimeout(timer)
}, [
  brandingAssets, 
  colorSystem, 
  brandingChanged, 
  companyInfo, 
  persistBranding,
  watermarkOpacity, // ✅ Incluido para refrescar el efecto
  showPageNumbers, // ✅ Incluido para refrescar el efecto
  showWebsiteInPdf, // ✅ Incluido para refrescar el efecto
  showFooterBranding // ✅ Incluido para refrescar el efecto
])

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
        const res = await fetch('/api/tenants/users', { credentials: 'same-origin' })
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

  const handleSaveCompany = async () => {
    setIsSavingCompany(true)
    setSaveError(null)
    setCompanySaveMessage(null)

    const payload = {
      name: companyInfo.name,
      email: companyInfo.email,
      phone: companyInfo.phone,
      address: companyInfo.address,
      website: companyInfo.website ?? null,
      description: companyInfo.description,
    }

    try {
      const res = await fetch('/api/tenants', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Error al guardar')
      }

      setSavedCompanySnapshot(JSON.stringify(payload))
      setSavedName(companyInfo.name)
      updateBranding({ name: companyInfo.name })
      setCompanySaveMessage('Guardado correctamente')
      setTimeout(() => setCompanySaveMessage(null), 2500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar'
      setSaveError(message)
    } finally {
      setIsSavingCompany(false)
    }
  }

  const tabs = [
    { id: 'company', icon: Building2, label: 'Configuración' },
    { id: 'branding', icon: ImageIcon, label: 'Branding' },
    { id: 'colors', icon: Palette, label: 'Colores' },
    { id: 'preview', icon: Monitor, label: 'Vista' },
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
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Configuración de Empresa</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Gestiona la marca y los datos de tu espacio de trabajo</p>
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
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Información de la Empresa</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Actualiza los datos de la empresa visibles para el equipo</p>
                  </div>
                  {companyChanged && (
                    <button
                      type="button"
                      onClick={handleSaveCompany}
                      disabled={isSavingCompany}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                      style={{ backgroundColor: colorSystem.primary, color: getContrastColor(colorSystem.primary) }}
                    >
                      <Save className="w-4 h-4" />
                      {isSavingCompany ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
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
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Correo Electrónico</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          value={companyInfo.email}
                          onChange={(e) => updateCompanyInfo('email', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-slate-50"
                          placeholder="correo@empresa.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          value={companyInfo.phone}
                          onChange={(e) => updateCompanyInfo('phone', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-slate-50"
                          placeholder="011 1234 5678"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Website</label>
                      <div className="relative">
                        <input
                          type="url"
                          value={companyInfo.website ?? ''}
                          onChange={(e) => updateCompanyInfo('website', e.target.value)}
                          className="w-full pl-4 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-slate-50"
                          placeholder="https://www.tuempresa.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Dirección</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={companyInfo.address}
                          onChange={(e) => updateCompanyInfo('address', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-slate-50"
                          placeholder="Calle 123, Ciudad, Provincia, CP"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción de la Empresa</label>
                      <textarea
                        value={companyInfo.description}
                        onChange={(e) => updateCompanyInfo('description', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none text-slate-900 dark:text-slate-50"
                        placeholder="Describe tu empresa..."
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <p className="text-sm text-slate-500">La aplicación utiliza un único tema corporativo. No hay opciones de tema disponibles.</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Los cambios de branding se guardan automáticamente. La información de la empresa requiere que pulses "Guardar cambios".
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'branding' && (
            <motion.div key="branding" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Recursos de Marca</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sube logos y recursos de marca — los cambios se guardan automáticamente</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FileUploadZone label="Logo de la Empresa" value={brandingAssets.logo} onChange={(v) => updateBrandingAsset('logo', v)} />
                  <FileUploadZone label="Favicon" value={brandingAssets.favicon} onChange={(v) => updateBrandingAsset('favicon', v)} />
                  <FileUploadZone label="Marca de Agua (PDF)" value={brandingAssets.watermark} onChange={(v) => updateBrandingAsset('watermark', v)} />
                  <FileUploadZone label="Icono de Barra Lateral" value={brandingAssets.sidebarIcon} onChange={(v) => updateBrandingAsset('sidebarIcon', v)} />
                </div>
                <div className="p-6 border-t">
                  <h3 className="text-lg font-semibold mb-3">PDF Branding</h3>
                  <div className="space-y-3">
                    <label className="block text-sm">Intensidad de marca de agua: <span className="font-medium">{watermarkOpacity}</span></label>
                    <input type="range" min="0.01" max="0.2" step="0.01" value={watermarkOpacity} onChange={(e) => setWatermarkOpacity(Number(e.target.value))} />
                    <div className="flex gap-4 items-center">
                      <label className="flex items-center gap-2"><input type="checkbox" checked={showPageNumbers} onChange={(e) => setShowPageNumbers(e.target.checked)} /> Mostrar numeración de páginas</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={showWebsiteInPdf} onChange={(e) => setShowWebsiteInPdf(e.target.checked)} /> Mostrar sitio web</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={showFooterBranding} onChange={(e) => setShowFooterBranding(e.target.checked)} /> Mostrar "Generado con WebiBudgets"</label>
                    </div>
                    <p className="text-xs text-slate-500">Los cambios de PDF se guardan automáticamente junto al branding.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'colors' && (
            <motion.div key="colors" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Sistema de Colores</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Personaliza los colores de marca — los cambios se guardan automáticamente</p>
                </div>
                <div className="p-6 space-y-6">
                  <ColorPicker label="Primary Color" value={colorSystem.primary} onChange={(v) => setColorSystem((p) => ({ ...p, primary: v }))} />
                  <ColorPicker label="Secondary Color" value={colorSystem.secondary} onChange={(v) => setColorSystem((p) => ({ ...p, secondary: v }))} />
                  <ColorPicker label="Accent Color" value={colorSystem.accent} onChange={(v) => setColorSystem((p) => ({ ...p, accent: v }))} />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Vista de Colores</h2>
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
                      Botón primario
                    </button>
                    <button
                      type="button"
                      className="px-5 py-2 rounded-lg font-medium text-sm bg-white dark:bg-slate-800"
                      style={{ border: `2px solid ${colorSystem.secondary}`, color: colorSystem.secondary }}
                    >
                      Secundario
                    </button>
                    <button type="button" className="px-5 py-2 rounded-lg text-white font-medium text-sm" style={{ backgroundColor: colorSystem.accent }}>
                      Destacado
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
                  watermarkOpacity={watermarkOpacity}
                  showPageNumbers={showPageNumbers}
                  showWebsiteInPdf={showWebsiteInPdf}
                  showFooterBranding={showFooterBranding}
                />
                
                <MobilePreview colors={colorSystem} logo={previewLogo} />
              </div>
            </motion.div>
          )}

          {activeTab === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Gestionar Equipo</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestiona los miembros del equipo y sus permisos</p>
                </div>
                <div className="p-6 space-y-4">
                  {teamMembers.length === 0 ? (
                    <p className="text-sm text-slate-500">No hay miembros cargados.</p>
                  ) : (
                    teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: colorSystem.primary, color: getContrastColor(colorSystem.primary) }}
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
                    Invitar miembro
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
