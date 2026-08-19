'use client'
// components/install-pwa-banner.tsx
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X, Download, Share } from 'lucide-react'
import { usePwaInstall } from '@/hooks/use-pwa-install'

const DISMISS_KEY = 'pwa_install_dismissed'

function isIos() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

export function InstallPwaBanner() {
  const pathname = usePathname()
  const { canInstall, isInstalled, promptInstall } = usePwaInstall()
  const [dismissed, setDismissed] = useState(true) // arranca oculto hasta confirmar en el cliente
  const [showIosInstructions, setShowIosInstructions] = useState(false)

  useEffect(() => {
    const alreadyDismissed = localStorage.getItem(DISMISS_KEY) === 'true'
    setDismissed(alreadyDismissed)
  }, [])

  // 👇 no lo mostramos dentro del Kiosco — ese es un dispositivo fijo, no un visitante casual
  const isKioscoRoute = pathname?.startsWith('/kiosco')

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  const handleInstallClick = async () => {
    if (isIos()) {
      setShowIosInstructions(true)
      return
    }
    const outcome = await promptInstall()
    if (outcome === 'accepted' || outcome === 'dismissed') {
      handleDismiss() // ya sea que instale o cancele, no lo volvemos a molestar esta sesión
    }
  }

  if (isKioscoRoute || isInstalled || dismissed) return null

  // En iOS solo lo mostramos si el navegador es Safari — Chrome/Firefox en iPhone
  // ni siquiera pueden instalar (limitación de Apple, no nuestra), así que insistir ahí sería inútil
  const isIosDevice = isIos()
  const isSafariOnIos = isIosDevice && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent)

  if (isIosDevice && !isSafariOnIos) return null
  if (!isIosDevice && !canInstall) return null // Android pero el navegador todavía no ofreció el evento

  return (
    <>
      <div className="fixed inset-x-4 bottom-24 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl lg:bottom-6 lg:left-auto lg:right-6 lg:w-80">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
          <Download className="h-5 w-5 text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-card-foreground">Instalá .budgets</p>
          <p className="text-xs text-muted-foreground">Accedé más rápido, sin pasar por el navegador.</p>
        </div>
        <button
          type="button"
          onClick={handleInstallClick}
          className="shrink-0 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Instrucciones manuales — solo iOS, no hay forma de automatizarlo */}
      {showIosInstructions && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={() => setShowIosInstructions(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl bg-card p-6 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-base font-bold text-card-foreground">Instalar en iPhone</p>
            <p className="mb-4 text-sm text-muted-foreground">Safari no permite instalar apps con un botón — son solo 2 pasos manuales:</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-foreground">1</div>
                <p className="flex items-center gap-1.5 text-sm text-card-foreground">
                  Tocá el ícono de <Share className="inline h-4 w-4" /> Compartir, abajo en el medio
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-foreground">2</div>
                <p className="text-sm text-card-foreground">Elegí <strong>&quot;Agregar a inicio&quot;</strong></p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setShowIosInstructions(false); handleDismiss() }}
              className="mt-5 w-full rounded-full bg-foreground py-2.5 text-sm font-semibold text-background"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}