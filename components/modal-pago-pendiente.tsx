'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function ModalPagoPendiente() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  
  const [isOpen, setIsOpen] = useState(false)
  const [diasRestantes, setDiasRestantes] = useState(14)
  const [isActivating, setIsActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subParam = searchParams.get('subscription')

  useEffect(() => {
    // 1. Calcular los días restantes usando la fecha real de fin de trial
    if (session?.user && 'trialEndsAt' in session.user && session.user.trialEndsAt) {
      const fechaFinTrial = new Date(session.user.trialEndsAt as string)
      const hoy = new Date()
      const diferenciaTiempo = fechaFinTrial.getTime() - hoy.getTime()
      const restantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24))
      setDiasRestantes(Math.max(0, restantes))
    }

    // 2. Control de la regla de las 24 horas usando localStorage
    const ultimaVezVisto = localStorage.getItem('webibudgets_trial_modal_last_seen')
    const ahora = new Date().getTime()
    const veinticuatroHoras = 24 * 60 * 60 * 1000

    const yaPasaron24Horas = !ultimaVezVisto || (ahora - parseInt(ultimaVezVisto)) > veinticuatroHoras

    // 3. Condición para mostrar: si viene de MercadoPago O si ya pasaron 24hs
    if (subParam === 'pending' || yaPasaron24Horas) {
      setIsOpen(true)
      localStorage.setItem('webibudgets_trial_modal_last_seen', ahora.toString())
    }
  }, [subParam, session])

  // ⚡ Función idéntica para re-intentar el pago en MercadoPago dinámicamente
  async function handleActivateNow() {
    if (!session?.user) return
    
    setIsActivating(true)
    setError(null)

    try {
      const currentPlan = (session.user as any).plan ?? 'starter'
      const tenantId = (session.user as any).tenantId

      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: currentPlan, tenantId }),
      })

      const data = await res.json()

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data?.error ?? 'No se pudo generar el enlace de pago')
      }

      // Redirigimos directo al checkout de MercadoPago
      window.location.href = data.checkoutUrl
    } catch (err) {
      console.error('[modal-checkout]', err)
      setError('Hubo un problema al conectar con MercadoPago. Intentá de nuevo.')
      setIsActivating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all scale-in duration-200">
        
        {/* Icono Cohete */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-black mb-4 text-xl">
          🚀
        </div>

        {/* Título dinámico */}
        <h3 className="text-xl font-black tracking-tight text-zinc-900 leading-tight">
          {diasRestantes > 0 
            ? `¡Tu prueba sigue activa! Te quedan ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}`
            : 'Tu período de prueba ha finalizado'
          }
        </h3>
        
        <p className="mt-2.5 text-sm text-zinc-500 leading-relaxed">
          Notamos que el pago en MercadoPago quedó pendiente, ¡pero no pasa nada! Podés seguir usando WebiBudgets normalmente para armar tus presupuestos.
        </p>

        <p className="mt-3 text-xs text-zinc-600 bg-zinc-50 border border-zinc-200/60 rounded-xl p-3 font-medium">
          🔒 <span className="font-bold text-black">Quedate tranquilo:</span> Cuando decidas activar tu plan, mantenés absolutamente todos tus datos, clientes y presupuestos intactos tal cual los venías usando.
        </p>

        {error && (
          <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 text-center font-medium">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {/* Botón de Acción Principal (Ir a MercadoPago) */}
          <button
            type="button"
            disabled={isActivating}
            onClick={handleActivateNow}
            className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isActivating ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Redirigiendo...
              </>
            ) : (
              '⚡ Activar mi plan ahora'
            )}
          </button>
          
          {/* Botón Secundario (Cerrar modal e ir al Dashboard) */}
          <button
            type="button"
            disabled={isActivating}
            onClick={() => {
              setIsOpen(false)
              router.replace('/dashboard')
            }}
            className="w-full text-center rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            Continuar al Dashboard por ahora →
          </button>
        </div>
      </div>
    </div>
  )
}