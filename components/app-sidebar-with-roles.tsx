'use client'

import { useState } from 'react'
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
  Menu,
  Settings,
} from 'lucide-react'
import { getVisibleNavItems, getVisibleSettingsItems } from '@/lib/permissions'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const NAV_ICONS: Record<string, ElementType> = {
  '/dashboard': LayoutDashboard,
  '/clients': Users,
  '/products': Package,
  '/budgets': FileText,
  '/sellers': Handshake,
  '/stock': Layers,
  '/installers': UserRoundCog,
}

const SETTINGS_ICONS: Record<string, ElementType> = {
  '/settings/company': Settings,
  '/settings/team': Users,
}

function SidebarContent({
  closeMenu,
  branding,
  userRole,
}: {
  closeMenu?: () => void
  branding?: { id?: string; name?: string | null; logoUrl?: string | null; primaryColor?: string | null; secondaryColor?: string | null; accentColor?: string | null }
  userRole?: string
}) {
  const pathname = usePathname()
  const visibleNavigation = getVisibleNavItems(userRole)
  const visibleSettings = getVisibleSettingsItems(userRole)

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
          <Image
            src={branding?.logoUrl ?? '/placeholder-logo.png'}
            alt={branding?.name ?? 'WebiBudgets'}
            width={32}
            height={32}
            className="object-contain"
            priority
          />
        </div>

        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground">{branding?.name ?? 'WebiBudgets'}</h1>
          <p className="text-xs text-sidebar-foreground/60">Sistema de Gestión</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {/* Main navigation */}
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
                  onClick={() => closeMenu?.()}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-foreground text-background">
                {item.tooltip}
              </TooltipContent>
            </Tooltip>
          )
        })}

        {/* Settings separator */}
        {visibleSettings.length > 0 && (
          <div className="my-4 border-t border-sidebar-border/50" />
        )}

        {/* Settings navigation */}
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
                  onClick={() => closeMenu?.()}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-foreground text-background">
                {item.tooltip}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4 space-y-3">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground transition hover:bg-sidebar-accent/90"
        >
          Cerrar sesión
        </button>
        <p className="text-xs text-sidebar-foreground/50">
          v1.0.0 - Creado por Webi.
        </p>
      </div>
    </div>
  )
}

export function AppSidebar({
  branding,
  userRole,
}: {
  branding?: { id?: string; name?: string | null; logoUrl?: string | null; primaryColor?: string | null; secondaryColor?: string | null; accentColor?: string | null }
  userRole?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <TooltipProvider>
      <>
        {/* Mobile topbar */}
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Image
              src={branding?.logoUrl ?? '/placeholder-logo.png'}
              alt={branding?.name ?? 'WebiBudgets'}
              width={28}
              height={28}
              className="object-contain"
              priority
            />
            <span className="text-sm font-semibold">{branding?.name ?? 'WebiBudgets'}</span>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Menú de navegación</SheetTitle>
              </SheetHeader>

              <SidebarContent closeMenu={() => setOpen(false)} branding={branding} userRole={userRole} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop sidebar */}
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 lg:flex">
          <SidebarContent branding={branding} userRole={userRole} />
        </aside>
      </>
    </TooltipProvider>
  )
}
