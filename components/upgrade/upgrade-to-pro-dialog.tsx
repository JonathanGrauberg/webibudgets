'use client'

import { useState } from 'react'
import { Crown, Check, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const PRO_FEATURES = [
  'Calculadora automática por m² / m³',
  'Órdenes de trabajo con QR en vivo',
  'Reparto de ganancias entre socios',
  'Dashboard con Business Intelligence',
  'PDFs 100% con tu marca',
]

interface UpgradeToProDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpgradeToProDialog({ open, onOpenChange }: UpgradeToProDialogProps) {
  const [isAnnual, setIsAnnual] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [code, setCode] = useState('')
const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
const [discountPercent, setDiscountPercent] = useState<number | null>(null)

const checkCode = async (value: string) => {
  if (!value.trim()) { setCodeStatus('idle'); setDiscountPercent(null); return }
  setCodeStatus('checking')
  try {
    const res = await fetch(`/api/resellers/validate-code?code=${encodeURIComponent(value.trim())}`)
    const data = await res.json()
    if (data.valid) {
      setCodeStatus('valid')
      setDiscountPercent(data.discountPercent)
    } else {
      setCodeStatus('invalid')
      setDiscountPercent(null)
    }
  } catch {
    setCodeStatus('invalid')
  }
}

// precio mostrado, ahora contempla el descuento si hay código válido
const basePrice = isAnnual ? 36000 : 40000
const finalPrice = discountPercent ? Math.round(basePrice * (1 - discountPercent / 100)) : basePrice
const finalAnnualTotal = finalPrice * 12 // 👈 nuevo — se recalcula solo, ya contempla el descuento

const handleSubscribe = async () => {
  setIsLoading(true)
  try {
    const res = await fetch('/api/subscriptions/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interval: isAnnual ? 'annual' : 'monthly',
        code: codeStatus === 'valid' ? code.trim() : undefined, // 👈 nuevo
      }),
    })
      const data = await res.json()
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'No se pudo iniciar el pago')
      }
      window.location.href = data.checkoutUrl
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'No se pudo iniciar el pago')
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Crown className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center">Pasate a PRO</DialogTitle>
        </DialogHeader>

        {/* Toggle Mensual/Anual */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Mensual
          </span>
          <button
            type="button"
            onClick={() => setIsAnnual((v) => !v)}
            className={`relative h-6 w-11 shrink-0 overflow-hidden rounded-full transition-colors ${
              isAnnual ? 'bg-amber-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                isAnnual ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Anual
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            Ahorrás 10%
          </span>
        </div>

        {/* Precio */}
        <div className="text-center">
          <span className="text-4xl font-bold text-foreground">${finalPrice.toLocaleString('es-AR')}</span>
          <span className="ml-1.5 text-sm text-muted-foreground">/ mes</span>
          {isAnnual && (
            <p className="mt-1 text-xs text-muted-foreground">
              Facturado anual: <span className="font-semibold">${finalAnnualTotal.toLocaleString('es-AR')}/año</span> {/* 👈 antes: $432.000 fijo */}
            </p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-2 border-t pt-4">
          {PRO_FEATURES.map((f) => (
            <div key={f} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span className="text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <input
            placeholder="¿Tenés un código de descuento?"
            value={code}
            onChange={(e) => { setCode(e.target.value); checkCode(e.target.value) }}
            className="w-full rounded-lg border border-input px-3 py-2 text-sm uppercase"
          />
          {codeStatus === 'valid' && (
            <p className="text-xs font-medium text-emerald-600">✓ Código aplicado: {discountPercent}% off</p>
          )}
          {codeStatus === 'invalid' && (
            <p className="text-xs text-destructive">Código inválido</p>
          )}
        </div>

        <Button onClick={handleSubscribe} disabled={isLoading} className="w-full gap-2 bg-amber-500 text-amber-950 hover:bg-amber-400">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Redirigiendo a MercadoPago...
            </>
          ) : (
            'Suscribirme con MercadoPago'
          )}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          Se te va a redirigir a MercadoPago para completar el pago de forma segura.
        </p>
      </DialogContent>
    </Dialog>
  )
}