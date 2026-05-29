'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { LandingNav } from './landing-nav'
import { LandingSections } from './landing-sections'

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const { data: session, status } = useSession()

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark((prev) => !prev)
  }

  const dashboardHref = status === 'authenticated' ? '/dashboard' : '/auth/login'
  const dashboardLabel = status === 'authenticated' ? 'Dashboard' : 'Login'

  return (
    <div className={`${isDark ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
        <LandingNav
          isDark={isDark}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          toggleTheme={toggleTheme}
          dashboardHref={dashboardHref}
          dashboardLabel={dashboardLabel}
        />
        <LandingSections
          openFaqIndex={openFaqIndex}
          setOpenFaqIndex={setOpenFaqIndex}
          dashboardHref={dashboardHref}
          dashboardLabel={dashboardLabel}
        />
      </div>
    </div>
  )
}
