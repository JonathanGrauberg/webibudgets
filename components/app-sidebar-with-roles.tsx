'use client'

import { useState, useRef, useEffect } from 'react'
import type { ElementType } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Layers,
  UserRoundCog,
  Handshake,
  Settings,
  Receipt,
  PiggyBank,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  User,
  MoreHorizontal,
  KanbanSquare,
} from 'lucide-react'
import { getVisibleNavItems, getVisibleSettingsItems } from '@/lib/permissions'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  '/rendiciones': PiggyBank,
  '/tasks': KanbanSquare, // 👈 nuevo
}

const SETTINGS_ICONS: Record<string, ElementType> = {
  '/settings/company': Settings,
  '/settings/team': Users,
}

// Máximo de ítems que se muestran directo en la cápsula mobile.
// El resto queda agrupado detrás del botón "Más".
const MAX_PRIMARY_MOBILE_ITEMS = 3

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

function useVisibleItems(branding?: Branding, userRole?: string) {
  const parsedFeatures =
    typeof branding?.features === 'string'
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

  return { visibleNavigation, visibleSettings }
}

/* ------------------------------------------------------------------ */
/* 💻 DESKTOP SIDEBAR CONTENT (sin cambios)                            */
/* ------------------------------------------------------------------ */

function SidebarContent({
  branding,
  userRole,
  isCollapsed = false,
  toggleCollapse,
}: {
  branding?: Branding
  userRole?: string
  isCollapsed?: boolean
  toggleCollapse?: () => void
}) {
  const pathname = usePathname()
  const { visibleNavigation, visibleSettings } = useVisibleItems(branding, userRole)

  return (
    <div
      className="flex h-full w-full flex-col text-white transition-all duration-300 ease-in-out"
      style={buildSidebarStyle(branding?.primaryColor)}
    >
      {/* 1. HEADER */}
      <div
        className={cn(
          'flex h-16 items-center border-b border-white/10 px-3 transition-all duration-300',
          isCollapsed
            ? 'flex-col justify-center gap-2 py-3 h-auto'
            : 'justify-between'
        )}
      >
        <button
          type="button"
          onClick={isCollapsed ? toggleCollapse : undefined}
          className={cn(
            'flex items-center gap-3 overflow-hidden text-left focus:outline-none rounded-xl p-1 transition-colors',
            isCollapsed && 'hover:bg-white/10 cursor-pointer'
          )}
          title={isCollapsed ? 'Expandir menú' : undefined}
        >
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
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <h1 className="text-sm font-semibold leading-tight text-white truncate">
                {branding?.name ?? '.budgets'}
              </h1>
              <p className="text-[10px] text-white/40">Sistema de Gestión</p>
            </div>
          )}
        </button>

        {toggleCollapse && (
          <button
            type="button"
            onClick={toggleCollapse}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* 2. NAVEGACIÓN */}
      <nav className="relative z-10 flex-1 space-y-1 overflow-y-auto px-2.5 py-4">
        {!isCollapsed && (
          <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">
            Principal
          </p>
        )}

        {visibleNavigation.map((item) => {
          const Icon = NAV_ICONS[item.href] ?? LayoutDashboard
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Tooltip key={item.name} delayDuration={200}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  data-tour={`nav-${item.href.replace(/\//g, '-').replace(/^-/, '')}`}
                  style={
                    isActive
                      ? {
                          backgroundColor:
                            branding?.accentColor ?? 'rgba(255,255,255,.12)',
                        }
                      : undefined
                  }
                  className={cn(
                    'flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all relative',
                    isCollapsed ? 'justify-center px-0' : 'px-3.5',
                    isActive
                      ? 'sidebar-active-tab text-black font-semibold'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon
                    className={cn('h-4 w-4 shrink-0', isActive && 'text-white')}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" hidden={!isCollapsed}>
                {item.name}
              </TooltipContent>
            </Tooltip>
          )
        })}

        {visibleSettings.length > 0 && (
          <>
            <div className="my-3 border-t border-white/10" />
            {!isCollapsed && (
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">
                Configuración
              </p>
            )}
          </>
        )}

        {visibleSettings.map((item) => {
          const Icon = SETTINGS_ICONS[item.href] ?? Settings
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Tooltip key={item.name} delayDuration={200}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  data-tour={`nav-${item.href.replace(/\//g, '-').replace(/^-/, '')}`}
                  style={
                    isActive
                      ? {
                          backgroundColor:
                            branding?.accentColor ?? 'rgba(255,255,255,.12)',
                        }
                      : undefined
                  }
                  className={cn(
                    'flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all relative',
                    isCollapsed ? 'justify-center px-0' : 'px-3.5',
                    isActive
                      ? 'sidebar-active-tab text-black font-semibold'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" hidden={!isCollapsed}>
                {item.name}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      {/* 3. FOOTER */}
      <div className="relative z-10 border-t border-white/10 p-2.5 space-y-2">
        {isCollapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-10 w-full items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 text-white transition-colors"
                title="Cuenta y Opciones"
              >
                <User className="h-5 w-5 text-white/80" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="end"
              className="w-48 bg-neutral-900 text-white border-neutral-800"
            >
              <DropdownMenuLabel className="text-xs text-neutral-400">
                Mi Cuenta
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-neutral-800" />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        )}

        {!isCollapsed && (
          <p className="text-center text-[10px] text-white/25">
            v2.1.0 · Webistudio.net
          </p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 📱 MOBILE TOP BAR — nombre de usuario + icono de persona            */
/* ------------------------------------------------------------------ */

function MobileTopBar({
  branding,
  userName,
}: {
  branding?: Branding
  userName?: string | null
}) {
  const displayName = userName?.trim() || 'Usuario'

  return (
    <div
      className="fixed inset-x-4 top-4 z-40 flex h-14 items-center justify-between rounded-full px-3 pl-4 text-white shadow-xl shadow-black/15 ring-1 ring-white/10 lg:hidden"
      style={{ backgroundColor: branding?.primaryColor || '#0a0a0a' }}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Image
            src={branding?.faviconUrl ?? '/placeholder-logo.png'}
            alt={branding?.name ?? 'WebiBudgets'}
            width={20}
            height={20}
            className="object-contain"
            priority
          />
        </div>
        <span className="text-sm font-semibold tracking-wide text-white truncate max-w-[140px]">
          {branding?.name ?? 'WebiBudgets'}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={displayName}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20"
          >
            <User className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 bg-neutral-900 text-white border-neutral-800"
        >
          <DropdownMenuLabel className="truncate text-xs text-neutral-400">
            {displayName}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-neutral-800" />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 📱 MOBILE BOTTOM NAV — pill capsule, estilo imagen de referencia    */
/* ------------------------------------------------------------------ */

function MobileBottomNav({
  branding,
  userRole,
}: {
  branding?: Branding
  userRole?: string
}) {
  const pathname = usePathname()
  const { visibleNavigation, visibleSettings } = useVisibleItems(branding, userRole)
  const allItems = [...visibleNavigation, ...visibleSettings]

  const primaryItems = allItems.slice(0, MAX_PRIMARY_MOBILE_ITEMS)
  const overflowItems = allItems.slice(MAX_PRIMARY_MOBILE_ITEMS)

  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  const isItemActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  const isOverflowActive = overflowItems.some((item) => isItemActive(item.href))

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsMoreOpen(false)
  }, [pathname])

  const activeBg = branding?.primaryColor || '#0a0a0a'

  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 lg:hidden">
      <div className="flex items-center gap-1 rounded-full bg-white px-2 py-2 shadow-xl shadow-black/15 ring-1 ring-black/5">
        {primaryItems.map((item) => {
          const Icon = NAV_ICONS[item.href] ?? SETTINGS_ICONS[item.href] ?? LayoutDashboard
          const isActive = isItemActive(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              data-tour={`nav-mobile-${item.href.replace(/\//g, '-').replace(/^-/, '')}`}
              style={isActive ? { backgroundColor: activeBg } : undefined}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full py-2.5 transition-all duration-200 ease-in-out',
                isActive
                  ? 'px-4 text-white'
                  : 'px-3 text-neutral-400 hover:text-neutral-700'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isActive && !isMoreOpen && (
                <span className="whitespace-nowrap text-sm font-semibold">
                  {item.name}
                </span>
              )}
            </Link>
          )
        })}

        {overflowItems.length > 0 && (
          <div ref={moreRef} className="relative shrink-0">
            {/* Panel flotante que se expande hacia arriba */}
            <div
              className={cn(
                'absolute bottom-full right-0 mb-3 w-52 origin-bottom-right rounded-2xl bg-white p-1.5 shadow-xl shadow-black/15 ring-1 ring-black/5 transition-all duration-200 ease-out',
                isMoreOpen
                  ? 'translate-y-0 scale-100 opacity-100'
                  : 'pointer-events-none translate-y-2 scale-95 opacity-0'
              )}
            >
              {overflowItems.map((item) => {
                const Icon =
                  NAV_ICONS[item.href] ?? SETTINGS_ICONS[item.href] ?? LayoutDashboard
                const isActive = isItemActive(item.href)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    data-tour={`nav-mobile-more-${item.href.replace(/\//g, '-').replace(/^-/, '')}`}
                    onClick={() => setIsMoreOpen(false)}
                    style={isActive ? { backgroundColor: activeBg } : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'text-white'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsMoreOpen((prev) => !prev)}
              style={isMoreOpen || isOverflowActive ? { backgroundColor: activeBg } : undefined}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-2.5 transition-all duration-200 ease-in-out',
                isMoreOpen || isOverflowActive
                  ? 'text-white'
                  : 'text-neutral-400 hover:text-neutral-700'
              )}
            >
              <MoreHorizontal className="h-5 w-5 shrink-0" />
              {(isMoreOpen || isOverflowActive) && (
                <span className="whitespace-nowrap text-sm font-semibold">
                  Más
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/* EXPORT PRINCIPAL                                                    */
/* ------------------------------------------------------------------ */

export function AppSidebar({
  branding,
  userRole,
  userName,
}: {
  branding?: Branding
  userRole?: string
  userName?: string | null
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Referencia al contenedor Desktop del sidebar para detectar clics fuera
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Si el sidebar está expandido (!isCollapsed) y el clic ocurre fuera del sidebar, se colapsa
      if (
        !isCollapsed &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsCollapsed(true)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCollapsed])

  return (
    <TooltipProvider>
      <>
        {/* 📱 Mobile: topbar + bottom pill nav */}
        <MobileTopBar branding={branding} userName={userName} />
        <MobileBottomNav branding={branding} userRole={userRole} />

        {/* 💻 Desktop sidebar estilo Pill / Cápsula */}
        <aside
          ref={sidebarRef}
          className={cn(
            'hidden h-full shrink-0 lg:flex transition-all duration-300 ease-in-out z-30 rounded-[28px] overflow-hidden shadow-xl border border-white/10',
            isCollapsed ? 'w-16' : 'w-64'
          )}
        >
          <SidebarContent
            branding={branding}
            userRole={userRole}
            isCollapsed={isCollapsed}
            toggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        </aside>
      </>
    </TooltipProvider>
  )
}