'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle, MapPin } from 'lucide-react'
import type { Client } from '@/lib/types'

interface ClientFormProps {
  client?: Client | null
  onSuccess: () => void
  onCancel: () => void
}

export function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
  name: client?.name || '',
  company: client?.company || '',
  email: client?.email || '',
  phone: client?.phone || '',
  address: client?.address || '',
  notes: client?.notes || '',

  // uso / clasificación
  type: (client as any)?.type || '',
  peopleCount: (client as any)?.peopleCount || '',
  usageFrequency: (client as any)?.usageFrequency || '',
  status: (client as any)?.status || 'nuevo',

  // 📍 ubicación simple
  locationUrl: (client as any)?.locationUrl || '',

  // 🆕 seguimiento comercial
  assignedSeller: (client as any)?.assignedSeller || '',
  lastContactAt: (client as any)?.lastContactAt || '',
})


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = client ? `/api/clients/${client.id}` : '/api/clients'
      const method = client ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to save client')
      onSuccess()
    } catch (error) {
      console.error('Error saving client:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const [sellers, setSellers] = useState<Array<{ id: string; name: string; lastName: string; active: boolean }>>([])

    React.useEffect(() => {
      ;(async () => {
        try {
          const res = await fetch('/api/sellers') // por default trae activos
          const data = await res.json()
          if (Array.isArray(data)) setSellers(data)
        } catch (e) {
          console.error('Error fetching sellers:', e)
        }
      })()
    }, [])


  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos básicos */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Empresa</Label>
            <Input
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
              
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              
            />
          </div>

          <div className="space-y-2">
            <Label>Teléfono *</Label>
            <Input
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Dirección</Label>
          <Input
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
        </div>

        {/* 📍 Ubicación en mapa */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Ubicación en mapa</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Pegá el link de Google Maps del punto exacto del campo
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="https://maps.app.goo.gl/..."
              value={formData.locationUrl}
              onChange={(e) =>
                setFormData({ ...formData, locationUrl: e.target.value })
              }
            />

            {formData.locationUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(formData.locationUrl, '_blank')}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tipo de cliente */}
        <div className="space-y-2">
          <Label>Tipo de Uso</Label>
          <Select
            value={formData.type}
            onValueChange={(v) => setFormData({ ...formData, type: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="home">Casa</SelectItem>
              <SelectItem value="home_modular">Casa Modular</SelectItem>
              <SelectItem value="cabin">Cabaña</SelectItem>
              <SelectItem value="hall">Salón</SelectItem>
              <SelectItem value="sanitary">Sanitario</SelectItem>
              <SelectItem value="company">Empresa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Uso */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Cantidad de personas</Label>
            <Input
              type="number"
              value={formData.peopleCount}
              onChange={(e) =>
                setFormData({ ...formData, peopleCount: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Frecuencia de uso</Label>
            <Input
              value={formData.usageFrequency}
              onChange={(e) =>
                setFormData({ ...formData, usageFrequency: e.target.value })
              }
              placeholder="Ej: fines de semana"
            />
          </div>
        </div>

        {/* Estado del cliente */}
        <div className="space-y-2">
          <Label>Estado del cliente</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => setFormData({ ...formData, status: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nuevo">Nuevo</SelectItem>
              <SelectItem value="contactado">Contactado</SelectItem>
              <SelectItem value="presupuesto_enviado">Presupuesto enviado</SelectItem>
              <SelectItem value="interesado">Interesado</SelectItem>
              <SelectItem value="sin_respuesta">Sin respuesta</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
              <SelectItem value="cliente_activo">Cliente activo</SelectItem>
              <SelectItem value="cliente_frecuente">Cliente frecuente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fecha último contacto */}
        <div className="space-y-2">
          <Label>Fecha último contacto</Label>
          <Input
            type="date"
            value={formData.lastContactAt}
            onChange={(e) =>
              setFormData({ ...formData, lastContactAt: e.target.value })
            }
          />
        </div>

        {/* Vendedor asignado */}
        <div className="space-y-2">
          <Label>Vendedor asignado</Label>
          <Select
            value={formData.assignedSeller || 'sin_asignar'}
            onValueChange={(v) =>
              setFormData({
                ...formData,
                assignedSeller: v === 'sin_asignar' ? '' : v,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar vendedor" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="sin_asignar">Sin asignar</SelectItem>

              {sellers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} {s.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>




        {/* Notas */}
        <div className="space-y-2">
          <Label>Notas</Label>
          <Textarea
            rows={3}
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Guardando...'
              : client
              ? 'Actualizar'
              : 'Crear Cliente'}
          </Button>
        </div>
      </form>
    </TooltipProvider>
  )
}
