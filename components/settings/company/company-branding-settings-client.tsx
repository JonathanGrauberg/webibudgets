'use client'
//components\settings\company\company-branding-settings-client.tsx
import useSWR from 'swr'
import { hasFeature } from '@/lib/features'
import { UpgradeModal } from '@/components/feature-gate'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Image as ImageIcon,
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
import { ColorPicker } from '@/components/settings/company/bolt-color-picker'
import {
  PDFPreview,
  type ColorSystem,
} from '@/components/settings/company/bolt-previews'
import { useSession } from 'next-auth/react'

import TeamPlanCard from '@/components/settings/company/team-plan-card'
import MercadoPagoConnectCard from '@/components/settings/company/mercadopago-connect-card'
import { SmartAssetRow } from '@/components/branding/smart-asset-row'
import { SmartPdfRow } from '@/components/branding/smart-pdf-row'
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currencies'
import { useSearchParams } from 'next/navigation'


export type CompanyBrandingSettingsClientProps = {
  initialBranding?: Branding
  currentBudgets?: number
  maxBudgets?: number
}

type CompanyInfo = {
  name: string
  email: string
  phone: string
  address: string
  website?: string
  description: string
  currency: string
  cuit: string
  condicionIva: string
}

type BrandingAssets = {
  logo: string | null
  favicon: string | null
  watermark: string | null
  sidebarIcon: string | null
}

// 👇 nuevo — agrupa todo lo que antes viajaba suelto como "pdfSettings" en cada llamada
type PdfSettings = {
  watermarkOpacity: number
  logoSize: number
  showPageNumbers: boolean
  showWebsiteInPdf: boolean
  showFooterBranding: boolean
  conditionsPdfUrl: string | null
  conditionsPdfName: string | null
  pdfTemplate: string // 👈 nuevo — "clasico" | "contraste" | "cantonera" | "directa"
  pdfTemplateDark: boolean // 👈 nuevo — toggle claro/oscuro, solo lo usa "directa"
}

type TeamMember = {
  id: string
  name: string
  role: string
  email: string
}

type PlanInfo = {
  maxUsers: number
  activeUsers: number
  plan: string
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
  logoSize: number
  showPageNumbers: boolean
  showWebsiteInPdf: boolean
  showFooterBranding: boolean
  conditionsPdfUrl: string | null
  conditionsPdfName: string | null
  pdfTemplate: string // 👈 nuevo
  pdfTemplateDark: boolean // 👈 nuevo
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DEBOUNCE_MS = 650

function buildPersistedState(
  companyInfo: CompanyInfo,
  brandingAssets: BrandingAssets,
  colorSystem: ColorSystem,
  pdfSettings: PdfSettings
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
    logoSize: pdfSettings.logoSize,
    showPageNumbers: pdfSettings.showPageNumbers,
    showWebsiteInPdf: pdfSettings.showWebsiteInPdf,
    showFooterBranding: pdfSettings.showFooterBranding,
    conditionsPdfUrl: pdfSettings.conditionsPdfUrl,
    conditionsPdfName: pdfSettings.conditionsPdfName,
    pdfTemplate: pdfSettings.pdfTemplate, // 👈 nuevo
    pdfTemplateDark: pdfSettings.pdfTemplateDark, // 👈 nuevo
  }
}

function serializeBranding(
  brandingAssets: BrandingAssets,
  colorSystem: ColorSystem,
  pdfSettings: PdfSettings
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
    logoSize: pdfSettings.logoSize,
    conditionsPdfUrl: pdfSettings.conditionsPdfUrl,
    conditionsPdfName: pdfSettings.conditionsPdfName,
    showPageNumbers: pdfSettings.showPageNumbers,
    showWebsiteInPdf: pdfSettings.showWebsiteInPdf,
    showFooterBranding: pdfSettings.showFooterBranding,
    pdfTemplate: pdfSettings.pdfTemplate, // 👈 nuevo
    pdfTemplateDark: pdfSettings.pdfTemplateDark, // 👈 nuevo
  })
}

function TabButton({ active, onClick, icon: Icon, label, id }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string; id?: string
}) {
  return (
    <motion.button
      id={id}
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
          <Check className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-600">Guardado</span>
        </>
      )}
      {status === 'error' && <span className="text-red-600">Error al guardar</span>}
    </motion.div>
  )
}

const CONDICION_IVA_OPTIONS = [
      'Responsable Inscripto',
      'Monotributista',
      'Exento',
      'Consumidor Final',
    ]

export default function CompanyBrandingSettingsClient({
  initialBranding,
  currentBudgets = 0,
  maxBudgets = 30,
  }: CompanyBrandingSettingsClientProps) {

  const { data: session } = useSession()

  // 👇 trae plan/features frescos, no depende de lo que traiga initialBranding
  const { data: tenantPlanData, mutate: mutateTenantPlanData } = useSWR('/api/tenants', (url: string) => fetch(url).then((r) => r.json()))
  const hasWhiteLabel = hasFeature(
    { plan: tenantPlanData?.plan, features: tenantPlanData?.features },
    'whiteLabel'
  )
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  // 👇 nuevo — selector de plantilla de PDF (feature PRO, mismo patrón que whiteLabel)
  const hasPdfTemplates = hasFeature(
    { plan: tenantPlanData?.plan, features: tenantPlanData?.features },
    'pdfTemplates'
  )
  const [pdfTemplateUpgradeOpen, setPdfTemplateUpgradeOpen] = useState(false)

  const effective = useMemo(() => effectiveBranding(initialBranding), [initialBranding])
  const { updateBranding } = useBranding()

  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'plan' ? 'plan' : 'company'
  const [activeTab, setActiveTab] = useState(initialTab)
  // 👈 nuevo — feedback al volver del OAuth de Mercado Pago (?mp=connected|error)
  const [mpNotice] = useState(() => searchParams.get('mp'))
  const [mpReason] = useState(() => searchParams.get('mp_reason'))

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
  const dbName = effective.name ?? ''
  const dbEmail = (initialBranding as any)?.email ?? ''
    return {
      name: dbName || session?.user?.name || '',
      email: dbEmail || session?.user?.email || '',
      phone: (initialBranding as any)?.phone ?? '',
      address: (initialBranding as any)?.address ?? '',
      website: (initialBranding as any)?.website ?? '',
      description: (initialBranding as any)?.description ?? '',
      currency: (initialBranding as any)?.currency ?? DEFAULT_CURRENCY,
      cuit: (initialBranding as any)?.cuit ?? '',
      condicionIva: (initialBranding as any)?.condicionIva ?? '',
    }
  })

  useEffect(() => {
    if (session?.user) {
      setCompanyInfo((prev) => ({
        ...prev,
        name: prev.name || session.user?.name || '',
        email: prev.email || session.user?.email || '',
      }))
    }
  }, [session])

  const [brandingAssets, setBrandingAssets] = useState<BrandingAssets>({
    logo: effective.logoUrl ?? null,
    favicon: effective.faviconUrl ?? null,
    watermark: effective.watermarkUrl ?? null,
    sidebarIcon: effective.sidebarIconUrl ?? null,
  })

  const [watermarkOpacity, setWatermarkOpacity] = useState<number>((initialBranding as any)?.watermarkOpacity ?? 0.06)
  const [logoSize, setLogoSize] = useState<number>((initialBranding as any)?.logoSize ?? 100)
  const [showPageNumbers, setShowPageNumbers] = useState<boolean>((initialBranding as any)?.showPageNumbers ?? true)
  const [showWebsiteInPdf, setShowWebsiteInPdf] = useState<boolean>((initialBranding as any)?.showWebsiteInPdf ?? true)
  const [showFooterBranding, setShowFooterBranding] = useState<boolean>((initialBranding as any)?.showFooterBranding ?? false)
  const [conditionsPdfUrl, setConditionsPdfUrl] = useState<string | null>((initialBranding as any)?.conditionsPdfUrl ?? null)
  const [conditionsPdfName, setConditionsPdfName] = useState<string | null>((initialBranding as any)?.conditionsPdfName ?? null)
  const [pdfTemplate, setPdfTemplate] = useState<string>((initialBranding as any)?.pdfTemplate ?? 'clasico') // 👈 nuevo
  const [pdfTemplateDark, setPdfTemplateDark] = useState<boolean>((initialBranding as any)?.pdfTemplateDark ?? false) // 👈 nuevo

  // 👇 nuevo — helper para no repetir el mismo objeto 6 veces a lo largo del archivo
  const currentPdfSettings = useCallback((): PdfSettings => ({
    watermarkOpacity,
    logoSize,
    showPageNumbers,
    showWebsiteInPdf,
    showFooterBranding,
    conditionsPdfUrl,
    conditionsPdfName,
    pdfTemplate, // 👈 nuevo
    pdfTemplateDark, // 👈 nuevo
  }), [watermarkOpacity, logoSize, showPageNumbers, showWebsiteInPdf, showFooterBranding, conditionsPdfUrl, conditionsPdfName, pdfTemplate, pdfTemplateDark])

  const [colorSystem, setColorSystem] = useState<ColorSystem>({
    primary: effective.primaryColor ?? '#0ea5e9',
    secondary: effective.secondaryColor ?? '#64748b',
    accent: effective.accentColor ?? '#10b981',
  })

  const [savedBrandingSnapshot, setSavedBrandingSnapshot] = useState(() =>
    serializeBranding(
      { logo: effective.logoUrl ?? null, favicon: effective.faviconUrl ?? null, watermark: effective.watermarkUrl ?? null, sidebarIcon: effective.sidebarIconUrl ?? null },
      { primary: effective.primaryColor ?? '#0ea5e9', secondary: effective.secondaryColor ?? '#64748b', accent: effective.accentColor ?? '#10b981' },
      {
        watermarkOpacity: (initialBranding as any)?.watermarkOpacity ?? 0.06,
        logoSize: (initialBranding as any)?.logoSize ?? 100,
        showPageNumbers: (initialBranding as any)?.showPageNumbers ?? true,
        showWebsiteInPdf: (initialBranding as any)?.showWebsiteInPdf ?? true,
        showFooterBranding: (initialBranding as any)?.showFooterBranding ?? false,
        conditionsPdfUrl: (initialBranding as any)?.conditionsPdfUrl ?? null, // 👈 faltaba
        conditionsPdfName: (initialBranding as any)?.conditionsPdfName ?? null, // 👈 faltaba
        pdfTemplate: (initialBranding as any)?.pdfTemplate ?? 'clasico', // 👈 nuevo
        pdfTemplateDark: (initialBranding as any)?.pdfTemplateDark ?? false, // 👈 nuevo
      }
    )
  )

  const resolvedInitialName = effective.name || session?.user?.name || ''
  const [savedName, setSavedName] = useState(resolvedInitialName)

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const [savedCompanySnapshot, setSavedCompanySnapshot] = useState<string>(() => {
    return JSON.stringify({
      name: effective.name || session?.user?.name || '',
      email: (initialBranding as any)?.email || session?.user?.email || '',
      phone: (initialBranding as any)?.phone ?? '',
      address: (initialBranding as any)?.address ?? '',
      website: (initialBranding as any)?.website ?? '',
      description: (initialBranding as any)?.description ?? '',
      currency: (initialBranding as any)?.currency ?? DEFAULT_CURRENCY,
      cuit: (initialBranding as any)?.cuit ?? '',
      condicionIva: (initialBranding as any)?.condicionIva ?? '',
    })
  })

  const [isSavingCompany, setIsSavingCompany] = useState(false)
  const [companySaveMessage, setCompanySaveMessage] = useState<string | null>(null)

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [planInfo, setPlanInfo] = useState<PlanInfo>({ maxUsers: 5, activeUsers: 0, plan: 'free' })

  const saveInFlightRef = useRef(false)
  const pendingSaveRef = useRef(false)
  const latestPayloadRef = useRef<PersistedState | null>(null)
  const hasMountedRef = useRef(false)
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lastSeenBrandingPropsRef = useRef(savedBrandingSnapshot)
  const lastSeenCompanyPropsRef = useRef(savedCompanySnapshot)

  useEffect(() => {
    const eff = effective

    const incomingBrandingSerialized = serializeBranding(
      {
        logo: eff.logoUrl ?? null,
        favicon: eff.faviconUrl ?? null,
        watermark: eff.watermarkUrl ?? null,
        sidebarIcon: eff.sidebarIconUrl ?? null,
      },
      {
        primary: eff.primaryColor ?? '#0ea5e9',
        secondary: eff.secondaryColor ?? '#64748b',
        accent: eff.accentColor ?? '#10b981',
      },
      {
        watermarkOpacity: (initialBranding as any).watermarkOpacity ?? 0.06,
        logoSize: (initialBranding as any).logoSize ?? 100,
        showPageNumbers: (initialBranding as any).showPageNumbers ?? true,
        showWebsiteInPdf: (initialBranding as any).showWebsiteInPdf ?? true,
        showFooterBranding: (initialBranding as any).showFooterBranding ?? false,
        conditionsPdfUrl: (initialBranding as any).conditionsPdfUrl ?? null, // 👈 faltaba
        conditionsPdfName: (initialBranding as any).conditionsPdfName ?? null, // 👈 faltaba
        pdfTemplate: (initialBranding as any).pdfTemplate ?? 'clasico', // 👈 nuevo
        pdfTemplateDark: (initialBranding as any).pdfTemplateDark ?? false, // 👈 nuevo
      }
    )

    if (incomingBrandingSerialized !== lastSeenBrandingPropsRef.current) {
      setBrandingAssets({
        logo: eff.logoUrl ?? null,
        favicon: eff.faviconUrl ?? null,
        watermark: eff.watermarkUrl ?? null,
        sidebarIcon: eff.sidebarIconUrl ?? null,
      })
      setColorSystem({
        primary: eff.primaryColor ?? '#0ea5e9',
        secondary: eff.secondaryColor ?? '#64748b',
        accent: eff.accentColor ?? '#10b981',
      })
      setWatermarkOpacity((initialBranding as any).watermarkOpacity ?? 0.06)
      setLogoSize((initialBranding as any).logoSize ?? 100)
      setShowPageNumbers((initialBranding as any).showPageNumbers ?? true)
      setShowWebsiteInPdf((initialBranding as any).showWebsiteInPdf ?? true)
      setShowFooterBranding((initialBranding as any).showFooterBranding ?? false)
      setConditionsPdfUrl((initialBranding as any).conditionsPdfUrl ?? null) // 👈 faltaba
      setConditionsPdfName((initialBranding as any).conditionsPdfName ?? null) // 👈 faltaba
      setPdfTemplate((initialBranding as any).pdfTemplate ?? 'clasico') // 👈 nuevo
      setPdfTemplateDark((initialBranding as any).pdfTemplateDark ?? false) // 👈 nuevo
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
      currency: (initialBranding as any).currency ?? DEFAULT_CURRENCY,
      cuit: (initialBranding as any).cuit ?? '',
      condicionIva: (initialBranding as any).condicionIva ?? '',
    })

    if (incomingCompanySerialized !== lastSeenCompanyPropsRef.current) {
      setCompanyInfo({
        name: eff.name ?? '',
        email: (initialBranding as any).email ?? '',
        phone: (initialBranding as any).phone ?? '',
        address: (initialBranding as any).address ?? '',
        website: (initialBranding as any).website ?? '',
        description: (initialBranding as any).description ?? '',
        currency: (initialBranding as any).currency ?? DEFAULT_CURRENCY,
        cuit: (initialBranding as any).cuit ?? '',
        condicionIva: (initialBranding as any).condicionIva ?? '',
      })
      setSavedCompanySnapshot(incomingCompanySerialized)
      setSavedName(eff.name ?? '')
      lastSeenCompanyPropsRef.current = incomingCompanySerialized
    }
  }, [initialBranding, effective])

  // 👇 corregido — antes faltaban logoSize/conditionsPdfUrl/conditionsPdfName en este objeto
  const brandingChanged =
    serializeBranding(brandingAssets, colorSystem, currentPdfSettings()) !== savedBrandingSnapshot

  const companyChanged =
    JSON.stringify({
      name: companyInfo.name,
      email: companyInfo.email,
      phone: companyInfo.phone,
      address: companyInfo.address,
      website: companyInfo.website ?? '',
      description: companyInfo.description,
      currency: companyInfo.currency,
      cuit: companyInfo.cuit,
      condicionIva: companyInfo.condicionIva,
    }) !== savedCompanySnapshot

  const previewLogo = brandingAssets.logo || brandingAssets.sidebarIcon

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
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(currentPayload),
          })

          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body.error || 'Failed to save settings')
          }

          // 👇 corregido — antes no incluía conditionsPdfUrl/conditionsPdfName acá
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
                logoSize: currentPayload.logoSize,
                showPageNumbers: currentPayload.showPageNumbers,
                showWebsiteInPdf: currentPayload.showWebsiteInPdf,
                showFooterBranding: currentPayload.showFooterBranding,
                conditionsPdfUrl: currentPayload.conditionsPdfUrl, // 👈 faltaba
                conditionsPdfName: currentPayload.conditionsPdfName, // 👈 faltaba
                pdfTemplate: currentPayload.pdfTemplate, // 👈 nuevo
                pdfTemplateDark: currentPayload.pdfTemplateDark, // 👈 nuevo
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
    if (!hasMountedRef.current) { hasMountedRef.current = true; return }
    if (!brandingChanged) return

    const timer = setTimeout(() => {
      // 👇 corregido — antes no mandaba conditionsPdfUrl/conditionsPdfName
      const payload = buildPersistedState(companyInfo, brandingAssets, colorSystem, currentPdfSettings())
      void persistBranding(payload)
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [
    brandingAssets, colorSystem, brandingChanged, companyInfo, persistBranding,
    watermarkOpacity, logoSize, showPageNumbers, showWebsiteInPdf, showFooterBranding,
    conditionsPdfUrl, conditionsPdfName, currentPdfSettings, // 👈 faltaban en el array de deps
    pdfTemplate, pdfTemplateDark, // 👈 nuevo
  ])

  useEffect(() => {
    return () => {
      if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current)
    }
  }, [])

  // Modificamos el useEffect que carga el equipo para mapear correctamente el plan 'vip'
  useEffect(() => {
    if (activeTab !== 'plan') return

    let cancelled = false

    async function loadTeam() {
      try {
        const res = await fetch('/api/tenants/users', { credentials: 'same-origin' })
        if (!res.ok) return
        const payload = await res.json()
        if (!cancelled) {
          if (Array.isArray(payload.users)) {
            setTeamMembers(payload.users)
          }

          // 🌟 Normalizamos la información en caso de que venga el plan 'vip'
          const isVipOrBusiness = payload.plan === 'vip' || payload.plan === 'business'

          setPlanInfo({
            maxUsers: isVipOrBusiness ? 999 : (payload.maxUsers ?? 5),
            activeUsers: payload.activeUsers ?? 0,
            plan: payload.plan ?? 'free',
          })
        }
      } catch {
        // mantener lista vacía en caso de falla
      }
    }

    loadTeam()
    return () => {
      cancelled = true
    }
  }, [activeTab])

  // 👇 en cuanto sabemos que no tiene whiteLabel, forzamos el switch a true
  useEffect(() => {
    if (tenantPlanData && !hasWhiteLabel && !showFooterBranding) {
      setShowFooterBranding(true)
    }
  }, [tenantPlanData, hasWhiteLabel]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateCompanyInfo = useCallback((field: keyof CompanyInfo, value: string) => {
    setCompanyInfo((prev) => ({ ...prev, [field]: value }))
  }, [])

  const updateBrandingAsset = useCallback((field: keyof BrandingAssets, value: string | null) => {
    setBrandingAssets((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSaveCompany = async () => {
    if (!companyInfo.name || companyInfo.name.trim() === '') {
      setSaveError('El nombre de la empresa es obligatorio.')
      return
    }
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
      currency: companyInfo.currency,
      cuit: companyInfo.cuit || null,
      condicionIva: companyInfo.condicionIva || null,
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
    { id: 'plan', icon: Crown, label: 'Plan' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
          {tabs.map((tab) => (
            <TabButton key={tab.id}
            id={`tab-${tab.id}`}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            icon={tab.icon}
            label={tab.label} />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {saveError && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            {saveError}
          </div>
        )}

        {mpNotice === 'connected' && (
          <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            ¡Listo! Tu cuenta de Mercado Pago quedó conectada.
          </div>
        )}
        {mpNotice === 'error' && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            No pudimos conectar tu cuenta de Mercado Pago. Probá de nuevo.
            {mpReason && <div className="mt-1 font-mono text-xs opacity-70">Motivo: {mpReason}</div>}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── CONFIGURACIÓN ── */}
          {activeTab === 'company' && (
            <motion.div
              key="company"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div id="tour-company-info" className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Información de la Empresa</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Actualiza los datos de la empresa visibles para el equipo
                    </p>
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
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Nombre de la Empresa
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={companyInfo.name}
                          onChange={(e) => updateCompanyInfo('name', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 transition-all text-slate-900 dark:text-slate-50"
                          placeholder="Nombre de la empresa"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Correo Electrónico
                      </label>
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

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Moneda por defecto
                      </label>
                      <select
                        value={companyInfo.currency}
                        onChange={(e) => updateCompanyInfo('currency', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-slate-50"
                      >
                        {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} — {c.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400">
                        Moneda usada por defecto en nuevos productos y presupuestos.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        CUIT
                      </label>
                      <input
                        type="text"
                        value={companyInfo.cuit}
                        onChange={(e) => updateCompanyInfo('cuit', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-slate-50"
                        placeholder="30-12345678-9"
                      />
                      <p className="text-xs text-slate-400">
                        Se muestra en recibos, remitos y otros documentos legales.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Condición frente al IVA
                      </label>
                      <select
                        value={companyInfo.condicionIva}
                        onChange={(e) => updateCompanyInfo('condicionIva', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 dark:text-slate-50"
                      >
                        <option value="">Sin especificar</option>
                        {CONDICION_IVA_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
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
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Descripción de la Empresa
                      </label>
                      <textarea
                        value={companyInfo.description}
                        onChange={(e) => updateCompanyInfo('description', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none text-slate-900 dark:text-slate-50"
                        placeholder="Describe tu empresa..."
                      />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-400">
                    Los cambios de branding se guardan automáticamente. La información de la empresa requiere que pulses "Guardar cambios".
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── BRANDING + COLORES ── */}
          {activeTab === 'branding' && (
            <motion.div
              key="branding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start"
            >
              <div className="space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Recursos de Marca</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Los cambios se guardan automáticamente</p>
                    </div>
                    <AnimatePresence>
                      {saveStatus !== 'idle' && <SaveIndicator status={saveStatus} />}
                    </AnimatePresence>
                  </div>
                  <div className="px-5 py-3">
                    <div id="tour-logo-row">
                      <SmartAssetRow label="Logo de la Empresa" value={brandingAssets.logo} onChange={(v) => updateBrandingAsset('logo', v)} />
                    </div>
                    <SmartAssetRow
                      label="Favicon"
                      value={brandingAssets.favicon}
                      onChange={(v) => updateBrandingAsset('favicon', v)}
                    />
                    <div id="tour-watermark-row">
                      <SmartAssetRow label="Marca de Agua (PDF)" value={brandingAssets.watermark} onChange={(v) => updateBrandingAsset('watermark', v)} />
                    </div>
                    <SmartAssetRow
                      label="Icono de Barra Lateral"
                      value={brandingAssets.sidebarIcon}
                      onChange={(v) => updateBrandingAsset('sidebarIcon', v)}
                    />
                    {/* 👇 nuevo — PDF de condiciones, mismo lugar que el resto de los assets */}
                    <SmartPdfRow
                      label="PDF de Condiciones"
                      fileName={conditionsPdfName}
                      value={conditionsPdfUrl}
                      onChange={(dataUri, name) => { setConditionsPdfUrl(dataUri); setConditionsPdfName(name) }}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Sistema de Colores</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Personaliza los colores de marca</p>
                  </div>
                  <div className="px-5 py-4 space-y-5">
                    <ColorPicker
                      label="Color Principal"
                      value={colorSystem.primary}
                      onChange={(v) => setColorSystem((p) => ({ ...p, primary: v }))}
                    />
                    <ColorPicker
                      label="Color Secundario"
                      value={colorSystem.secondary}
                      onChange={(v) => setColorSystem((p) => ({ ...p, secondary: v }))}
                    />
                    <ColorPicker
                      label="Color de Acento"
                      value={colorSystem.accent}
                      onChange={(v) => setColorSystem((p) => ({ ...p, accent: v }))}
                    />
                  </div>
                  <div className="px-5 pb-4 space-y-3">
                    <div className="flex gap-2">
                      {(
                        [
                          { id: 'primary', color: colorSystem.primary, label: 'Principal' },
                          { id: 'secondary', color: colorSystem.secondary, label: 'Secundario' },
                          { id: 'accent', color: colorSystem.accent, label: 'Acento' },
                        ] as const
                      ).map(({ id, color, label }) => (
                        <div key={id} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full h-10 rounded-lg shadow-sm" style={{ backgroundColor: color }} />
                          <span className="text-[10px] text-slate-400">{label}</span>
                        </div>
                      ))}
                    </div>
                    <div
                      className="h-8 rounded-lg"
                      style={{
                        background: `linear-gradient(90deg, ${colorSystem.primary} 0%, ${colorSystem.secondary} 50%, ${colorSystem.accent} 100%)`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Plantilla de PDF</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Elegí el diseño de tus presupuestos exportados</p>
                  </div>
                  <div className="px-5 py-4 grid grid-cols-2 gap-3">
                    {(
                      [
                        { id: 'clasico', label: 'Clásico', description: 'El diseño de siempre, con tu logo y colores.', pro: false },
                        { id: 'cantonera', label: 'Cantonera', description: 'Un acento fino y minimalista, sin bloques de color.', pro: true },
                        { id: 'contraste', label: 'Contraste', description: 'Bloques de color con tu trío de marca completo.', pro: true },
                        { id: 'directa', label: 'Directa', description: 'Tipografía grande y tabla numerada, con tu acento en detalles.', pro: true },
                      ] as const
                    ).map((opt) => {
                      const locked = opt.pro && !hasPdfTemplates
                      const selected = pdfTemplate === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            if (locked) {
                              setPdfTemplateUpgradeOpen(true)
                              return
                            }
                            setPdfTemplate(opt.id)
                          }}
                          className={`text-left rounded-lg border p-3 transition-colors ${
                            selected
                              ? 'border-slate-900 dark:border-slate-100 ring-1 ring-slate-900 dark:ring-slate-100'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          } ${locked ? 'opacity-70' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{opt.label}</span>
                            {locked && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                            {selected && !locked && <Check className="h-3.5 w-3.5 text-slate-900 dark:text-slate-50 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{opt.description}</p>
                        </button>
                      )
                    })}
                  </div>

                  {/* 👇 nuevo — toggle fondo claro/oscuro, solo aplica a "directa" */}
                  {pdfTemplate === 'directa' && (
                    <div className="px-5 pb-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div
                          className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                            pdfTemplateDark ? '' : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                          style={pdfTemplateDark ? { backgroundColor: colorSystem.primary } : {}}
                          onClick={() => setPdfTemplateDark(!pdfTemplateDark)}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                              pdfTemplateDark ? 'left-4' : 'left-0.5'
                            }`}
                          />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors select-none">
                          Fondo oscuro
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Configuración de PDF</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Ajustes aplicados a documentos exportados</p>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <label className="text-slate-700 dark:text-slate-300">Intensidad de marca de agua</label>
                        <span className="font-medium text-slate-500">{watermarkOpacity}</span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="0.2"
                        step="0.01"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                        className="w-full accent-current"
                        style={{ accentColor: colorSystem.primary }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <label className="text-slate-700 dark:text-slate-300">Tamaño del logo en PDF</label>
                        <span className="font-medium text-slate-500">{logoSize}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        step="5"
                        value={logoSize}
                        onChange={(e) => setLogoSize(Number(e.target.value))}
                        className="w-full accent-current"
                        style={{ accentColor: colorSystem.primary }}
                      />
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: 'Mostrar numeración de páginas', value: showPageNumbers, setter: setShowPageNumbers },
                        { label: 'Mostrar sitio web en el pie', value: showWebsiteInPdf, setter: setShowWebsiteInPdf },
                      ].map(({ label, value, setter }) => (
                        <label key={label} className="flex items-center gap-3 cursor-pointer group">
                          <div
                            className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                              value ? '' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                            style={value ? { backgroundColor: colorSystem.primary } : {}}
                            onClick={() => setter(!value)}
                          >
                            <div
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                                value ? 'left-4' : 'left-0.5'
                              }`}
                            />
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors select-none">
                            {label}
                          </span>
                        </label>
                      ))}

                      {/* 👇 footer branding, con lógica propia de PRO */}
                      <label className={`flex items-center gap-3 group ${hasWhiteLabel ? 'cursor-pointer' : 'cursor-pointer'}`}>
                        <div
                          className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                            showFooterBranding ? '' : 'bg-slate-200 dark:bg-slate-700'
                          } ${!hasWhiteLabel ? 'opacity-60' : ''}`}
                          style={showFooterBranding ? { backgroundColor: colorSystem.primary } : {}}
                          onClick={() => {
                            if (!hasWhiteLabel) {
                              setUpgradeOpen(true)
                              return
                            }
                            setShowFooterBranding(!showFooterBranding)
                          }}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                              showFooterBranding ? 'left-4' : 'left-0.5'
                            }`}
                          />
                        </div>
                        <span
                          className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors select-none flex items-center gap-1.5"
                          onClick={() => !hasWhiteLabel && setUpgradeOpen(true)}
                        >
                          Mostrar &quot;Generado en budgets.webistudio.net&quot;
                          {!hasWhiteLabel && (
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 underline underline-offset-2">
                              Pasate a PRO para quitar esto
                            </span>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:sticky lg:top-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Vista previa del documento</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Se actualiza en tiempo real</p>
                  </div>
                  <div className="p-4">
                    <PDFPreview
                      colors={colorSystem}
                      watermark={brandingAssets.watermark}
                      logo={previewLogo}
                      watermarkOpacity={watermarkOpacity}
                      logoSize={logoSize}
                      showPageNumbers={showPageNumbers}
                      showWebsiteInPdf={showWebsiteInPdf}
                      showFooterBranding={showFooterBranding}
                      template={pdfTemplate}
                      templateDark={pdfTemplateDark}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

    {/* ── PLAN ── */}
    {activeTab === 'plan' && (
      <motion.div
        key="plan"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Gestionar Equipo</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Miembros del equipo y sus permisos
            </p>
          </div>
          <div className="p-6 space-y-4">
            {teamMembers.length === 0 ? (
              <p className="text-sm text-slate-500">No hay miembros cargados.</p>
            ) : (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{
                        backgroundColor: colorSystem.primary,
                        color: getContrastColor(colorSystem.primary),
                      }}
                    >
                      {member.name
                        ? member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                        : '??'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">{member.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
                    </div>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                    style={{
                      backgroundColor: `${colorSystem.primary}15`,
                      color: colorSystem.primary,
                    }}
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
              Ir a gestión de equipo
            </Link>
          </div>
        </div>

        {/* 🌟 Pasamos el plan limpio. Si en TeamPlanCard tenés lógica interna para renderizar
            un badge o barra de progreso, al mandarle maxUsers={999} vas a poder pintar el símbolo "∞"
            o deshabilitar la barra de límite fácilmente. */}
        <TeamPlanCard
          currentUsers={planInfo.activeUsers}
          maxUsers={planInfo.maxUsers}
          plan={planInfo.plan}
          colors={colorSystem}
        />

        <div className="mt-6">
          <MercadoPagoConnectCard
            connected={!!tenantPlanData?.mpConnected}
            colors={colorSystem}
            onDisconnected={() => mutateTenantPlanData?.()}
          />
        </div>
      </motion.div>
    )}

        </AnimatePresence>
      </div>
      <UpgradeModal feature="whiteLabel" open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <UpgradeModal feature="pdfTemplates" open={pdfTemplateUpgradeOpen} onOpenChange={setPdfTemplateUpgradeOpen} />
    </div>
  )
}