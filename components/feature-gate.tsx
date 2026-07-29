'use client'
import { useState } from 'react'
import { Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogOverlay } from '@/components/ui/dialog'
import type { FeatureKey } from '@/lib/features'

const FEATURE_COPY: Partial<Record<FeatureKey, { title: string; description: string }>> = {
  bulkPriceUpdate: {
    title: 'Actualización masiva de precios',
    description: 'Actualizá el precio de todo tu catálogo o de una categoría entera en un click. Disponible en el plan PRO.',
  },
  calculator: {
    title: 'Calculadora inteligente',
    description: 'Calculá automáticamente m², m³ y horas de trabajo al armar tus presupuestos. Disponible en el plan PRO.',
  },
  editBudgets: {
    title: 'Editar presupuestos',
    description: 'Volvé a editar cualquier presupuesto ya creado, corrigiendo ítems, precios o datos del cliente. Disponible en el plan PRO.',
  },
  dashboardMetrics: {
    title: 'Business Intelligence',
    description: 'Accedé a gráficos de facturación, distribución por estados y tus productos más solicitados. Disponible en el plan PRO.',
  },
  productVariants: {
    title: 'Variantes de producto',
    description: 'Gestioná colores, talles o terminaciones con stock independiente para cada opción. Disponible en el plan PRO.',
  },
  workOrders: {
    title: 'Órdenes de Trabajo con QR',
    description: 'Generá órdenes de trabajo completas para tu equipo, con checklist, materiales y QR de seguimiento. Disponible en el plan PRO.',
  },
    whiteLabel: {
    title: 'Quitar marca de .budgets',
    description: 'Eliminá el pie "Generado en budgets.webistudio.net" de tus presupuestos y documentos, para que lleven 100% tu marca. Disponible en el plan PRO.',
  },
    commissions: {
    title: 'Distribución de ganancias',
    description: 'Calculá automáticamente cuánto le corresponde a cada vendedor o socio sobre las ventas del período. Disponible en el plan PRO.',
  },
  exportData: {
    title: 'Exportar reportes',
    description: 'Descargá tus reportes contables en CSV/Excel para liquidar comisiones o llevar tu contabilidad. Disponible en el plan PRO.',
  },
  auditHistory: {
    title: 'Historial detallado por presupuesto',
    description: 'Mirá el desglose exacto de cuánto se llevó cada integrante en cada presupuesto individual. Disponible en el plan PRO.',
  },
  customCategories: {
    title: 'Crear nuevas categorías',
    description: 'Creá las categorías que más se acomoden a tu empresa. Disponible en el plan PRO.',
  },
}

export function UpgradeModal({ feature, open, onOpenChange }: {
  feature: FeatureKey
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const copy = FEATURE_COPY[feature] ?? { title: 'Función PRO', description: 'Esta función está disponible en el plan PRO.' }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Crown className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
        <DialogFooter className="mt-4 justify-center">
          <Button onClick={() => onOpenChange(false)} variant="outline">Ahora no</Button>
          <Button onClick={() => { /* redirigir a /settings/billing o similar */ }}>
            Quiero PRO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Botón con corona que abre el modal de upgrade en vez de ejecutar la acción. */
export function LockedButton({ feature, children, ...buttonProps }: {
  feature: FeatureKey
  children: React.ReactNode
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)} variant="outline" className={`${buttonProps.className ?? ''} relative`}>
        {children}
        <Crown className="ml-2 h-3.5 w-3.5 text-amber-500" />
      </Button>
      <UpgradeModal feature={feature} open={open} onOpenChange={setOpen} />
    </>
  )
}