'use client'

import { useState } from 'react'
import { LandingNav } from './landing-nav'
import { LandingSections } from './landing-sections'
import { dashboardHref } from './landing-data'
import {WhatsNewModal}  from "@/components/WhatsNewModal";

export function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-background">
      <WhatsNewModal />
      <LandingNav />
      <LandingSections
        openFaqIndex={openFaqIndex}
        setOpenFaqIndex={setOpenFaqIndex}
        dashboardHref={dashboardHref}
        dashboardLabel="Dashboard"
      />
    </div>
  )
}
