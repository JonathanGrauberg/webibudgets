'use client'
//hooks\use-onboarding-tour.ts
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { driver, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import '@/styles/onboarding-tour.css'

type StepMode = 'click' | 'next' | 'click-modal'   // 👈 agregar 'click-modal'

type TourStep = {
  selector: string
  title: string
  description: string
  mode: StepMode
  beforeShow?: () => void
}

const STEPS: TourStep[] = [
  {
    selector: '[data-tour="nav-settings-company"]',
    title: 'Empecemos 👋',
    description: 'Primero, hacé clic en "Configuración" para completar los datos de tu empresa.',
    mode: 'click',
  },
  {
    selector: '#tour-company-info',
    title: 'Datos de tu empresa',
    description: 'Completá nombre, email, teléfono y dirección para que tus presupuestos se vean profesionales. Tip: en la pestaña "Branding" también podés cambiar los colores de la app (opcional).',
    mode: 'next',
  },
  {
    selector: '#tour-logo-row',
    title: 'Logo de tu empresa',
    description: 'Este logo va a aparecer en el encabezado de tus presupuestos.',
    mode: 'next',
    beforeShow: () => (document.querySelector('#tab-branding') as HTMLElement | null)?.click(),
  },
  {
    selector: '#tour-watermark-row',
    title: 'Marca de agua del PDF',
    description: 'Aparece de fondo, sutil, en el PDF final. Le da un toque profesional.',
    mode: 'next',
  },
  {
    selector: '[data-tour="nav-clients"]',
    title: 'Clientes',
    description: 'Sin un cliente no se puede armar un presupuesto. Hacé clic acá.',
    mode: 'click',
  },
  {
    selector: '#tour-create-client',
    title: 'Creá tu primer cliente',
    description: 'Hacé clic acá, completá los datos y guardá.',
    mode: 'click-modal',   // 👈 antes decía 'next'
  },
  {
    selector: '[data-tour="nav-products"]',
    title: 'Productos y Servicios',
    description: 'Ahora vamos a cargar un producto. Hacé clic acá.',
    mode: 'click',
  },
  {
    selector: '#tour-create-product',
    title: 'Creá tu primer producto o servicio',
    description: 'Hacé clic acá, cargalo y guardá. (También vas a poder cargar ítems personalizados directo desde el creador de presupuestos, sin guardarlos en tu stock).',
    mode: 'click-modal',   // 👈 antes decía 'next'
  },
  {
    selector: '[data-tour="nav-sellers"]',
    title: 'Vendedores y Personal',
    description: 'Opcional: acá podés cargar vendedores y personal de instalación para usarlos como referencia en tus presupuestos. Podés hacerlo después.',
    mode: 'next',
  },
  {
    selector: '[data-tour="nav-budgets"]',
    title: 'Último paso 🚀',
    description: 'Hacé clic en "Presupuestos" para crear el primero.',
    mode: 'click',
  },
  {
    selector: '#tour-create-budget',
    title: 'Creá tu primer presupuesto',
    description: 'Con todo lo que cargaste, ¡ya podés armarlo!',
    mode: 'next',
  },
]

function isVisible(el: HTMLElement) {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
}

function queryVisible(selector: string): HTMLElement | null {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector))
  return nodes.find(isVisible) ?? null
}

function waitForVisible(selector: string, timeout = 2500): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const found = queryVisible(selector)
    if (found) return resolve(found)

    const observer = new MutationObserver(() => {
      const el = queryVisible(selector)
      if (el) {
        observer.disconnect()
        resolve(el)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })

    setTimeout(() => {
      observer.disconnect()
      resolve(queryVisible(selector))
    }, timeout)
  })
}

function waitForDialogClose(openWindowMs = 1500): Promise<void> {
  return new Promise((resolve) => {
    let dialogSeen = false
    let fallback: ReturnType<typeof setTimeout>

    const cleanup = () => {
      observer.disconnect()
      clearTimeout(fallback)
    }

    const check = () => {
      const dialog = document.querySelector('[role="dialog"]')
      if (dialog) dialogSeen = true
      if (dialogSeen && !dialog) {
        cleanup()
        resolve()
      }
    }

    const observer = new MutationObserver(check)
    observer.observe(document.body, { childList: true, subtree: true })

    // Si nunca detectamos un modal (por si el selector no matchea), no bloqueamos el tour para siempre
    fallback = setTimeout(() => {
      if (!dialogSeen) {
        cleanup()
        resolve()
      }
    }, openWindowMs)

    check()
  })
}

export function useOnboardingTour() {
  const { data: session, status } = useSession()
  const driverRef = useRef<Driver | null>(null)
  const startedRef = useRef(false)

  async function markSeen() {
    try {
      await fetch('/api/user/onboarding', { method: 'PATCH' })
    } catch {
      // si falla, en el peor caso el tour puede reaparecer una vez más
    }
  }

async function showStep(index: number) {
  const step = STEPS[index]
  if (!step) {
    driverRef.current?.destroy()
    markSeen()
    return
  }

  step.beforeShow?.()
  const target = await waitForVisible(step.selector)

  if (!target) {
    console.warn(`[onboarding-tour] No encontré "${step.selector}" (paso ${index}), lo salteo`)
    showStep(index + 1)
    return
  }

  const isLast = index === STEPS.length - 1
  const showNextBtn = step.mode === 'next'

  driverRef.current?.highlight({
    element: target,
    popover: {
      title: step.title,
      description: step.description,
      side: step.mode === 'click' ? 'right' : 'bottom',   // 👈 nuevo, evita que tape el sidebar
      align: 'start',                                       // 👈 nuevo
      showButtons: showNextBtn ? ['next', 'close'] : ['close'],
      nextBtnText: isLast ? 'Finalizar' : 'Siguiente',
      onNextClick: () => showStep(index + 1),
      onCloseClick: () => {
        driverRef.current?.destroy()
        markSeen()
      },
    },
  })

  if (step.mode === 'click' || step.mode === 'click-modal') {
    const handler = async () => {
      target.removeEventListener('click', handler)

      if (step.mode === 'click-modal') {
        driverRef.current?.destroy()          // ocultamos el popover para que no choque con el modal
        await waitForDialogClose()
        driverRef.current = driver({ allowClose: true, overlayOpacity: 0.65 })
        showStep(index + 1)
      } else {
        setTimeout(() => showStep(index + 1), 60)
      }
    }
    target.addEventListener('click', handler)
  }
}

  useEffect(() => {
    if (status !== 'authenticated' || startedRef.current) return
    const userId = (session?.user as any)?.id
    if (!userId) return

    startedRef.current = true

    fetch('/api/user/onboarding')
      .then((res) => (res.ok ? res.json() : { hasSeenOnboarding: true }))
      .then((data) => {
        if (data?.hasSeenOnboarding) return

        driverRef.current = driver({ allowClose: true, overlayOpacity: 0.65 })
        setTimeout(() => showStep(0), 600)
      })
      .catch(() => {})
  }, [status, session])
}