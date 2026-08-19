'use client'
// hooks/use-pwa-install.ts
import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Si ya está corriendo instalada (modo standalone), no tiene sentido ofrecer instalar de nuevo
    const alreadyStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true // iOS

    setIsInstalled(alreadyStandalone)

    const handler = (e: Event) => {
      e.preventDefault() // 👈 evita que Chrome muestre su mini-banner automático — lo disparamos nosotros
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Si el usuario efectivamente instala (desde nuestro botón o el menú del navegador),
    // este evento nos avisa para ocultar cualquier cartel propio que sigamos mostrando
    const installedHandler = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable' as const
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null) // el evento solo se puede usar una vez
    return outcome // 'accepted' | 'dismissed'
  }, [deferredPrompt])

  return {
    canInstall: !!deferredPrompt && !isInstalled, // true solo en Android/Chrome, cuando el navegador lo permite
    isInstalled,
    promptInstall,
  }
}