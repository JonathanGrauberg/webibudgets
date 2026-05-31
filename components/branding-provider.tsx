'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  type Branding,
  applyFavicon,
  brandingToCssVars,
  effectiveBranding,
} from '@/lib/branding'

type BrandingContextValue = {
  branding: Branding
  updateBranding: (partial: Partial<Branding>) => void
}

const BrandingContext = createContext<BrandingContextValue | null>(null)

export function BrandingProvider({
  initialBranding,
  children,
}: {
  initialBranding?: Branding
  children: React.ReactNode
}) {
  const [branding, setBranding] = useState<Branding>(() => effectiveBranding(initialBranding))

  const updateBranding = useCallback((partial: Partial<Branding>) => {
    setBranding((prev) => {
      const next = effectiveBranding({ ...prev, ...partial })
      applyFavicon(next.faviconUrl)
      return next
    })
  }, [])

  const cssVars = useMemo(() => brandingToCssVars(branding), [branding])

  useEffect(() => {
    applyFavicon(branding.faviconUrl)
  }, [branding.faviconUrl])

  const value = useMemo(
    () => ({ branding, updateBranding }),
    [branding, updateBranding]
  )

  return (
    <BrandingContext.Provider value={value}>
      <div className="tenant min-h-screen bg-background" style={cssVars}>
        {children}
      </div>
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const ctx = useContext(BrandingContext)
  if (!ctx) {
    throw new Error('useBranding must be used within BrandingProvider')
  }
  return ctx
}
