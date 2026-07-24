'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const PATH_NAMES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clientes',
  '/products': 'Productos',
  '/budgets': 'Presupuestos',
  '/sellers': 'Vendedores',
  '/stock': 'Control de Stock',
  '/installers': 'Instaladores',
  '/documents': 'Comprobantes',
  '/rendiciones': 'Rendiciones',
  '/settings/company': 'Configuración de Empresa',
  '/settings/team': 'Gestión de Equipo',
}

export function DynamicIslandHeader() {
  const pathname = usePathname()
  
  // Busca el título según la ruta actual
  const currentTitle = PATH_NAMES[pathname] || 
    Object.entries(PATH_NAMES).find(([key]) => key !== '/' && pathname.startsWith(key))?.[1] || 
    '.budgets'

  return (
    <div className="hidden lg:flex absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className={cn(
        "flex items-center justify-center px-6 py-1.5 bg-black text-white text-xs font-semibold tracking-wide shadow-lg transition-all duration-300",
        "rounded-b-2xl border-x border-b border-white/10 backdrop-blur-md"
      )}>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {currentTitle}
        </span>
      </div>
    </div>
  )
}