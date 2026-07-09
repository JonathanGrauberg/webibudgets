"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner" // 👈 si usás otra lib de toasts (ej. react-hot-toast), avisame y lo cambio

import type { FeatureKey } from "@/lib/features"

const FEATURE_LABELS: Record<FeatureKey, string> = {
  calculator: "Calculadora (presupuesto por fórmula)",
  commissions: "Comisiones",
  vouchers: "Recibos / Órdenes de Trabajo",
  dashboardMetrics: "Métricas en Dashboard",
  stockAnalytics: "Analítica de Stock",
}

const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as FeatureKey[]

interface TenantFeaturesFormProps {
  tenantId: string
  plan: string | null
  planPersisted: boolean // 👈 nuevo: true si el tenant YA tiene plan "custom" guardado en la base
  initialFeatures: Record<string, boolean> | null
  onSaved?: (features: Record<string, boolean>) => void // 👈 nuevo: se dispara al guardar con éxito
}

export default function TenantFeaturesForm({
  tenantId,
  plan,
  planPersisted,
  initialFeatures,
  onSaved,
}: TenantFeaturesFormProps) {
  // Se autogestiona: si el tenant no es plan "custom", no renderiza nada.
  // Así este componente se puede insertar en cualquier lugar sin condicionales afuera.
  const [features, setFeatures] = useState<Record<string, boolean>>(
    initialFeatures ?? {}
  )
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  if (plan !== "custom") return null

  function toggleFeature(key: FeatureKey, checked: boolean) {
    setFeatures((prev) => ({ ...prev, [key]: checked }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? "No se pudieron guardar los módulos")
      }

      toast.success("Módulos actualizados")
      setDirty(false)
      onSaved?.(features)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div>
        <h4 className="text-sm font-semibold uppercase tracking-[-0.5] text-primary">
          Plan Custom
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Módulos habilitados para este tenant
        </p>
      </div>

      {!planPersisted && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          Primero guardá el cambio de plan (botón "Guardar" de arriba) antes de guardar los módulos.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {FEATURE_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <Checkbox
              id={`feature-${key}`}
              checked={features[key] === true}
              onCheckedChange={(checked) =>
                toggleFeature(key, checked === true)
              }
            />
            <Label htmlFor={`feature-${key}`} className="text-sm font-normal">
              {FEATURE_LABELS[key]}
            </Label>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={!dirty || saving || !planPersisted}
        size="sm"
        className="rounded-full"
      >
        {saving ? "Guardando..." : "Guardar módulos"}
      </Button>
    </div>
  )
}