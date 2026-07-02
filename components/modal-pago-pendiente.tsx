'use client'
//components\modal-pago-pendiente.tsx
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function ModalPagoPendiente() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  
  const [isOpen, setIsOpen] = useState(false)
  const [diasRestantes, setDiasRestantes] = useState(14)
  
  // Guardamos qué tipo de diseño mostrar: 'welcome' (cohete) o 'pending' (tarjeta)
  const [modalType, setModalType] = useState<'welcome' | 'pending' | null>(null)

  const subParam = searchParams.get('subscription')
  const userPlan = (session?.user as any)?.plan

 useEffect(() => {
    // 👑 ESCUDO VIP / BUSINESS / PLANES ACTIVOS: Si ya pagó, no mostramos nada
    if (userPlan === 'vip' || userPlan === 'business') {
      setIsOpen(false)
      return
    }

    // Calcular días restantes del trial
    if (session?.user && 'trialEndsAt' in session.user && session.user.trialEndsAt) {
      const fechaFinTrial = new Date(session.user.trialEndsAt as string)
      const hoy = new Date()
      const diferenciaTiempo = fechaFinTrial.getTime() - hoy.getTime()
      const restantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24))
      setDiasRestantes(Math.max(0, restantes))
    }

    // Control de tiempos para el recordatorio rutinario
    const ultimaVezVisto = localStorage.getItem('webibudgets_trial_modal_last_seen')
    const ahora = new Date().getTime()
    const veinticuatroHoras = 24 * 60 * 60 * 1000
    const yaPasaron24Horas = !ultimaVezVisto || (ahora - parseInt(ultimaVezVisto)) > veinticuatroHoras

    // 🌟 CONTROL DE FLUJOS ESTRICTO (Tu lógica aplicada al 100%)
    
    // CASO A: Si explícitamente viene el parámetro de MercadoPago (Ej: el webhook o la redirección devolvió 'pending')
    if (subParam === 'pending') {
      setModalType('pending')
      setIsOpen(true)
      return
    }

   
    const welcomeParam = searchParams.get('welcome')

    // CASO B: Primer ingreso (viene de registrarse)
    if (welcomeParam === '1' && diasRestantes > 0) {
      setModalType('welcome')
      setIsOpen(true)
      localStorage.setItem('webibudgets_welcome_seen', 'true')
      return
    }

    // CASO C: El período de prueba ya venció (Bloqueo total, tiene que elegir un plan)
    if (diasRestantes <= 0) {
      setModalType('pending') 
      setIsOpen(true)
      return
    }

    // CASO D: Recordatorio a los 7 dias 
    if (diasRestantes <= 7 && diasRestantes > 0 && yaPasaron24Horas) {
      setModalType('pending')
      setIsOpen(true)
      localStorage.setItem('webibudgets_trial_modal_last_seen', ahora.toString())
    }

  }, [subParam, session, diasRestantes, userPlan])
  // 👈 PUNTO 2 SOLUCIONADO: Te redirige al catálogo de precios para que elijas el plan que quieras
  function handleGoToPricing() {
    setIsOpen(false)
    router.push('/pricing')
  }

  // Cierre limpio de la Bienvenida (Cohete)
  function handleCloseWelcome() {
    localStorage.setItem('webibudgets_welcome_seen', 'true') // Guardamos para que NO vuelva a aparecer jamás
    setIsOpen(false)
  }

  if (!isOpen || !modalType) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all scale-in duration-200">
        
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-black mb-4 text-xl">
          {modalType === 'welcome' ? '🚀' : '💳'}
        </div>

        <h3 className="text-xl font-black tracking-tight text-zinc-900 leading-tight">
          {modalType === 'welcome' 
            ? `¡Tu prueba gratuita está activa! Quedan ${diasRestantes} días`
            : diasRestantes > 0 
              ? `¡Tu período de prueba sigue activo! Te quedan ${diasRestantes} días`
              : 'Tu período de prueba ha finalizado'
          }
        </h3>
        
        <p className="mt-2.5 text-sm text-zinc-500 leading-relaxed">
          {modalType === 'welcome' ? (
            <>
              ¡Te damos la bienvenida a bordo! Queremos que exprimas .budgets al máximo. Tenés acceso total para armar tus presupuestos sin vueltas durante estos 14 días.
            </>
          ) : (
            <>
              {diasRestantes > 0 
                ? `Te quedan ${diasRestantes} días de prueba. Cuando quieras, podés activar tu plan para seguir usando .budgets sin interrupciones.`
                : 'Para seguir usando .budgets y mantener todos tus datos a salvo, por favor selecciona y activa tu plan definitivo.'
              }
            </>
          )}
        </p>

        <p className="mt-3 text-xs text-zinc-600 bg-zinc-50 border border-zinc-200/60 rounded-xl p-3 font-medium">
          🔒 <span className="font-bold text-black">Quedate tranquilo:</span> Cuando decidas activar tu plan definitivo, mantenés absolutamente todos tus datos, clientes y presupuestos intactos tal cual los venías usando.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {/* Botón principal unificado para ir a /pricing */}
          <button
            type="button"
            onClick={handleGoToPricing}
            className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {modalType === 'welcome' ? '⚡ Elegir mi plan definitivo' : '⚡ Activar mi plan ahora'}
          </button>
          
          {/* Botón secundario para continuar */}
          <button
            type="button"
            onClick={modalType === 'welcome' ? handleCloseWelcome : () => setIsOpen(false)}
            className="w-full text-center rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            {modalType === 'welcome' ? 'Ir a mi cuenta gratis por ahora →' : 'Continuar al Dashboard por ahora →'}
          </button>
        </div>
      </div>
    </div>
  )
}