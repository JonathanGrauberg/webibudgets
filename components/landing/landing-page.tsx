'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { LandingNav } from './landing-nav'
import { LandingSections } from './landing-sections'

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const { data: session, status } = useSession()

  // Fixed corporate theme: use static styling, no theme toggles.
  const dashboardHref = status === 'authenticated' ? '/dashboard' : '/auth/login'
  const dashboardLabel = status === 'authenticated' ? 'Dashboard' : 'Login'

  return (
    <div>
      <div className="bg-[#080808] text-white transition-colors duration-300">
        <LandingNav
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
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