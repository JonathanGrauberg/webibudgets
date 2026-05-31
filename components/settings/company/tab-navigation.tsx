'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function TabNavigation() {
  const pathname = usePathname()

  const tabs = [
    { name: 'Company', href: '/settings/company' },
    { name: 'Team', href: '/settings/team' },
    { name: 'Branding', href: '/settings/company' },
  ]

  return (
    <div className="flex items-center gap-3 mb-6">
      {tabs.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href)
        return (
          <Link key={t.name} href={t.href} className={`px-3 py-2 rounded ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-muted-foreground/5'}`}>
            {t.name}
          </Link>
        )
      })}
    </div>
  )
}
