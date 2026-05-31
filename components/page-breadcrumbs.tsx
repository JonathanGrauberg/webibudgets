'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

type BreadcrumbItem = {
  label: string
  href?: string
}

const pathLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  budgets: 'Presupuestos',
  clients: 'Clientes',
  products: 'Productos',
  sellers: 'Vendedores',
  stock: 'Stock',
  installers: 'Instaladores',
  settings: 'Configuración',
  company: 'Empresa',
  team: 'Equipo',
}

export function PageBreadcrumbs() {
  const pathname = usePathname()

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter((seg) => seg !== '(dashboard)')

  if (segments.length === 0) return null

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/dashboard' },
  ]

  let builPath = ''
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]
    builPath += `/${segment}`
    breadcrumbs.push({
      label: pathLabels[segment] || segment,
      href: builPath,
    })
  }

  const lastSegment = segments[segments.length - 1]
  breadcrumbs.push({
    label: pathLabels[lastSegment] || lastSegment,
  })

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground px-4 py-2 lg:px-6">
      {breadcrumbs.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1">
          {idx > 0 && <ChevronRight className="h-4 w-4 opacity-50" />}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
