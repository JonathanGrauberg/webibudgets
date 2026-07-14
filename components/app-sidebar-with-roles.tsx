//components\app-sidebar-with-roles.tsx
'use client'

import { useState } from 'react'
import type { ElementType } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import {
  LayoutDashboard, Users, Package, FileText,
  Layers, UserRoundCog, Handshake, Menu, Settings, Receipt,
} from 'lucide-react'
import { getVisibleNavItems, getVisibleSettingsItems } from '@/lib/permissions'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { TenantFeatures } from '@/lib/types'

const NAV_ICONS: Record<string, ElementType> = {
  '/dashboard': LayoutDashboard,
  '/clients': Users,
  '/products': Package,
  '/budgets': FileText,
  '/sellers': Handshake,
  '/stock': Layers,
  '/installers': UserRoundCog,
  '/documents': Receipt,
}

const SETTINGS_ICONS: Record<string, ElementType> = {
  '/settings/company': Settings,
  '/settings/team': Users,
}

type Branding = {
  id?: string
  name?: string | null
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
  faviconUrl?: string | null
  features?: TenantFeatures | null
}

function buildSidebarStyle(primaryColor?: string | null): React.CSSProperties {
  return {
    backgroundColor: primaryColor || '#0a0a0a',
  }
}

function SidebarContent({
  closeMenu,
  branding,
  userRole,
}: {
  closeMenu?: () => void
  branding?: Branding
  userRole?: string
}) {
  const pathname = usePathname()

  // 1. Convertimos 'features' en un objeto plano de manera segura por si viniera serializado como string
  const parsedFeatures = typeof branding?.features === 'string'
    ? (() => {
        try {
          return JSON.parse(branding.features)
        } catch {
          return null
        }
      })()
    : branding?.features

  const visibleNavigation = getVisibleNavItems(userRole, parsedFeatures)
  const visibleSettings = getVisibleSettingsItems(userRole)

  return (
    <div
      className="flex h-full w-full flex-col text-white"
      style={buildSidebarStyle(branding?.primaryColor)}
    >
      {/* Header */}
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <Image
            src={branding?.faviconUrl ?? '/placeholder-logo.png'}
            alt={branding?.name ?? '.budgets'}
            width={24}
            height={24}
            className="object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight text-white">
            {branding?.name ?? '.budgets'}
          </h1>
          <p className="text-[10px] text-white/40">Sistema de Gestión</p>
        </div>
      </div>
 
      {/* Nav */}
      <nav className="relative z-10 flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">
          Principal
        </p>

        {visibleNavigation.map((item) => {
          const Icon = NAV_ICONS[item.href] ?? LayoutDashboard
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Tooltip key={item.name} delayDuration={300}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  data-tour={`nav-${item.href.replace(/\//g, '-').replace(/^-/, '')}`}
                  onClick={() => closeMenu?.()}
                  style={
                    isActive
                      ? {
                          backgroundColor: branding?.accentColor ?? 'rgba(255,255,255,.12)',
                        }
                      : undefined
                  }
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-white')} />
                  <span className="truncate">{item.name}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.tooltip}</TooltipContent>
            </Tooltip>
          )
        })}

        {visibleSettings.length > 0 && (
          <>
            <div className="my-3 border-t border-white/10" />
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">
              Configuración
            </p>
          </>
        )}

        {visibleSettings.map((item) => {
          const Icon = SETTINGS_ICONS[item.href] ?? Settings
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Tooltip key={item.name} delayDuration={300}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  data-tour={`nav-${item.href.replace(/\//g, '-').replace(/^-/, '')}`}
                  onClick={() => closeMenu?.()}
                  style={
                    isActive
                      ? {
                          backgroundColor: branding?.accentColor ?? 'rgba(255,255,255,.12)',
                        }
                      : undefined
                  }
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.tooltip}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/10 p-3 space-y-2">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/15 hover:text-white"
        >
          Cerrar sesión
        </button>
        <p className="text-center text-[10px] text-white/25">v1.2.0 · Creado por Webistudio.net</p>
      </div>
    </div>
  )
}

export function AppSidebar({ branding, userRole }: { branding?: Branding; userRole?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <TooltipProvider>
      <>
        {/* 📱 Mobile topbar */}
        <div 
          className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b px-6 text-white lg:hidden shadow-sm shrink-0"
          style={{
            backgroundColor: branding?.primaryColor || '#0a0a0a',
            borderBottomColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Image
                src={branding?.faviconUrl ?? '/placeholder-logo.png'}
                alt={branding?.name ?? 'WebiBudgets'}
                width={20}
                height={20}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-sm font-semibold tracking-wide text-white truncate max-w-[180px]">
              {branding?.name ?? 'WebiBudgets'}
            </span>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white/90 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 border-none">
              <SheetHeader className="sr-only">
                <SheetTitle>Menú de navegación</SheetTitle>
              </SheetHeader>
              <SidebarContent closeMenu={() => setOpen(false)} branding={branding} userRole={userRole} />
            </SheetContent>
          </Sheet>
        </div>

        {/* 💻 Desktop sidebar */}
        <aside className="hidden h-full w-64 shrink-0 lg:flex">
          <SidebarContent branding={branding} userRole={userRole} />
        </aside>
      </>
    </TooltipProvider>
  )
}