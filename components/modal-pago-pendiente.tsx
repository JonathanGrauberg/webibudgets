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
  const userPlan = (session?.user as any)?.plan

  // 🌟 Determinamos si es un usuario que entró a probar gratis de buena fe
  // Si no tiene un flag de "pago pendiente" de MercadoPago y tiene días de prueba, es Free Trial.
  const isFreeTrialUser = subParam !== 'pending' && diasRestantes > 0

  useEffect(() => {
    if (session?.user && 'trialEndsAt' in session.user && session.user.trialEndsAt) {
      const fechaFinTrial = new Date(session.user.trialEndsAt as string)
      const hoy = new Date()
      const diferenciaTiempo = fechaFinTrial.getTime() - hoy.getTime()
      const restantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24))
      setDiasRestantes(Math.max(0, restantes))
    }

    const ultimaVezVisto = localStorage.getItem('webibudgets_trial_modal_last_seen')
    const ahora = new Date().getTime()
    const veinticuatroHoras = 24 * 60 * 60 * 1000
    const yaPasaron24Horas = !ultimaVezVisto || (ahora - parseInt(ultimaVezVisto)) > veinticuatroHoras

    // Reglas para mostrar el modal
    if (subParam === 'pending') {
      // Si MercadoPago explícitamente falló, se muestra sí o sí
      setIsOpen(true)
    } else if (diasRestantes <= 0 && userPlan !== 'business') {
      // Si se terminaron los días de prueba, bloqueo total y se muestra
      setIsOpen(true)
    } else if (yaPasaron24Horas) {
      // Recordatorio amigable cada 24 horas
      setIsOpen(true)
      localStorage.setItem('webibudgets_trial_modal_last_seen', ahora.toString())
    }
  }, [subParam, session, diasRestantes, userPlan])

  async function handleActivateNow() {
    if (!session?.user) return
    
    setIsActivating(true)
    setError(null)

    try {
      const tenantId = (session.user as any).tenantId
      // Si por esas casualidades el plan es nulo, mandamos 'starter' por defecto
      const planToPay = userPlan ?? 'starter'

      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: planToPay, tenantId }),
      })

      const data = await res.json()

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data?.error ?? 'No se pudo generar el enlace de pago')
      }

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
        
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-black mb-4 text-xl">
          {isFreeTrialUser ? '🚀' : '💳'}
        </div>

        {/* 🌟 Título Inteligente */}
        <h3 className="text-xl font-black tracking-tight text-zinc-900 leading-tight">
          {isFreeTrialUser 
            ? `¡Tu prueba gratuita está activa! Quedan ${diasRestantes} días`
            : diasRestantes > 0 
              ? `¡Tu período de prueba sigue activo! Te quedan ${diasRestantes} días`
              : 'Tu período de prueba ha finalizado'
          }
        </h3>
        
        {/* 🌟 Descripción Inteligente */}
        <p className="mt-2.5 text-sm text-zinc-500 leading-relaxed">
          {isFreeTrialUser ? (
            <>
              ¡Te damos la bienvenida a bordo! Queremos que exprimas WebiBudgets al máximo. Tenés acceso total para armar tus presupuestos sin vueltas durante estos 14 días de gracia.
            </>
          ) : (
            <>
              Notamos que el pago en MercadoPago quedó pendiente, ¡pero no pasa nada! Podés seguir usando WebiBudgets normalmente para armar tus presupuestos.
            </>
          )}
        </p>

        <p className="mt-3 text-xs text-zinc-600 bg-zinc-50 border border-zinc-200/60 rounded-xl p-3 font-medium">
          🔒 <span className="font-bold text-black">Quedate tranquilo:</span> Cuando decidas activar tu plan definitivo, mantenés absolutamente todos tus datos, clientes y presupuestos intactos tal cual los venías usando.
        </p>

        {error && (
          <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 text-center font-medium">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            disabled={isActivating}
            onClick={handleActivateNow}
            className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isActivating ? (
              'Redirigiendo a MercadoPago...'
            ) : (
              isFreeTrialUser ? '⚡ Asegurar mi plan Básico (\$6.990)' : '⚡ Activar mi plan ahora'
            )}
          </button>
          
          <button
            type="button"
            disabled={isActivating}
            onClick={() => {
              setIsOpen(false)
              router.replace('/dashboard')
            }}
            className="w-full text-center rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {isFreeTrialUser ? 'Ir a mi cuenta gratis por ahora →' : 'Continuar al Dashboard por ahora →'}
          </button>
        </div>
      </div>
    </div>
  )
}