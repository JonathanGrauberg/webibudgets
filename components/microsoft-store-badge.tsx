'use client'
// components/microsoft-store-badge.tsx
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

interface MicrosoftStoreBadgeProps {
  size?: 'small' | 'large'
  className?: string
}

const STORE_PRODUCT_ID = '9NNZCDCDKNGH' // 👈 el Store ID real de .budgets

export function MicrosoftStoreBadge({ size = 'large', className }: MicrosoftStoreBadgeProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 👇 arranca oculto — evita el parpadeo mientras confirmamos en el cliente
  // si esto corre dentro de una app instalada (PWA general, Kiosco, o la
  // versión de Microsoft Store) o en un navegador normal.
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true // iOS

    setShouldShow(!isStandalone)
  }, [])

  useEffect(() => {
    if (!shouldShow || !containerRef.current) return
    if (containerRef.current.querySelector('ms-store-badge')) return // ya está creado, no duplicar

    // 👇 Creamos el Web Component a mano con JavaScript en vez de escribirlo
    // como JSX (<ms-store-badge>) — así TypeScript nunca tiene que validar
    // ese tag, y evitamos el error de "Property does not exist on type
    // JSX.IntrinsicElements" sin importar la versión de React/TS del proyecto.
    const badge = document.createElement('ms-store-badge')
    badge.setAttribute('productid', STORE_PRODUCT_ID)
    badge.setAttribute('productname', '.budgets')
    badge.setAttribute('window-mode', 'direct')
    badge.setAttribute('theme', 'dark')
    badge.setAttribute('size', size)
    badge.setAttribute('language', 'es-es')
    badge.setAttribute('animation', 'on')

    containerRef.current.appendChild(badge)
  }, [shouldShow, size])

  if (!shouldShow) return null

  return (
    <div className={className}>
      {/* Next.js evita cargar este script más de una vez, aunque el badge
          se use en varios lugares de la misma página */}
      <Script src="https://get.microsoft.com/badge/ms-store-badge.bundled.js" strategy="lazyOnload" />
      <div ref={containerRef} />
    </div>
  )
}