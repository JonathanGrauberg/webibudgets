'use client'
//components\modal-pago-pendiente.tsx
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const MANAGER_ROLES = ['owner', 'admin']

export function ModalPagoPendiente() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [isOpen, setIsOpen] = useState(false)
  const [modalType, setModalType] = useState<'welcome' | 'payment_incomplete' | null>(null)

  const subParam = searchParams.get('subscription')
  const welcomeParam = searchParams.get('welcome')
  const userPlan = (session?.user as any)?.plan
  const userRole = (session?.user as any)?.role

  useEffect(() => {
    // 👑 Quien ya tiene todo el acceso (vip, custom, o pagando de verdad) nunca necesita ver esto
    if (userPlan === 'vip' || userPlan === 'custom') {
      setIsOpen(false)
      return
    }

    // 👇 nuevo — checkout automático: viene de la landing (ya logueado) o de Google con intención de pagar
    if (subParam === 'start') {
      const interval = searchParams.get('interval') === 'annual' ? 'annual' : 'monthly'
      fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ interval }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl
          } else {
            router.replace('/dashboard?subscription=pending')
          }
        })
        .catch(() => router.replace('/dashboard?subscription=pending'))
      return // no seguimos con el resto de la lógica del modal en este caso
    }

    // CASO A: volvió de MercadoPago sin completar el pago (cerró el checkout, o falló)
    if (subParam === 'pending') {
      setModalType('payment_incomplete')
      setIsOpen(true)
      return
    }

    // CASO B: primer ingreso después de registrarse gratis — solo si es alta nueva de verdad
    if (welcomeParam === '1' && (session?.user as any)?.isNewAccount === true) {
      const alreadySeen = localStorage.getItem('webibudgets_welcome_seen')
      if (!alreadySeen) {
        setModalType('welcome')
        setIsOpen(true)
        localStorage.setItem('webibudgets_welcome_seen', 'true')
      }
    }
  }, [subParam, welcomeParam, userPlan, searchParams, router, session])

  function handleGoToPricing() {
    setIsOpen(false)
    router.push('/pricing')
  }

  function handleClose() {
    setIsOpen(false)
  }

  if (!isOpen || !modalType) return null

  const canUpgrade = MANAGER_ROLES.includes(userRole)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all scale-in duration-200">

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-black mb-4 text-xl">
          {modalType === 'welcome' ? '🚀' : '💳'}
        </div>

        <h3 className="text-xl font-black tracking-tight text-zinc-900 leading-tight">
          {modalType === 'welcome'
            ? '¡Bienvenido a .budgets!'
            : 'No pudimos confirmar tu pago'}
        </h3>

        <p className="mt-2.5 text-sm text-zinc-500 leading-relaxed">
          {modalType === 'welcome' ? (
            <>
              Tu cuenta está lista, sin vencimiento y sin necesidad de tarjeta. Armá presupuestos, gestioná clientes y probá el sistema tranquilo.
            </>
          ) : (
            <>
              El pago no llegó a completarse en MercadoPago — puede que hayas cerrado la ventana o que haya fallado. Mientras tanto, seguís usando .budgets con el plan Free, sin ningún problema.
            </>
          )}
        </p>

        {modalType === 'payment_incomplete' && (
          <p className="mt-3 text-xs text-zinc-600 bg-zinc-50 border border-zinc-200/60 rounded-xl p-3 font-medium">
            🔒 <span className="font-bold text-black">Quedate tranquilo:</span> todos tus datos, clientes y presupuestos siguen intactos. Podés reintentar el pago cuando quieras.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {modalType === 'welcome' ? (
            canUpgrade && (
              <button
                type="button"
                onClick={handleGoToPricing}
                className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.99]"
              >
                ⚡ Ver planes PRO
              </button>
            )
          ) : (
            canUpgrade && (
              <button
                type="button"
                onClick={handleGoToPricing}
                className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.99]"
              >
                Reintentar el pago
              </button>
            )
          )}

          <button
            type="button"
            onClick={handleClose}
            className="w-full text-center rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            {modalType === 'welcome' ? 'Empezar a usar .budgets →' : 'Continuar al Dashboard →'}
          </button>
        </div>
      </div>
    </div>
  )
}