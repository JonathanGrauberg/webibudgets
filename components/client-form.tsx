//components\client-form.tsx
'use client'
 
import React, { useMemo, useState } from 'react'
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
import { WhatsappPhoneInput } from '@/components/whatsapp-phone-input'

interface ClientFormProps {
  client?: Client | null
  existingClients?: Client[]
  onSelectExisting?: (client: Client) => void
  onSuccess: () => void
  onCancel: () => void
}

const onlyDigits = (s: string) => s.replace(/\D/g, '')

export function ClientForm({ client, existingClients = [], onSelectExisting, onSuccess, onCancel }: ClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
  name: client?.name || '',
  company: client?.company || '',
  email: client?.email || '',
  phone: client?.phone || '',
  address: client?.address || '',
  city: (client as any)?.city || '',
  province: (client as any)?.province || '',
  notes: client?.notes || '',

  identificationType:
    (client as any)?.cuit
      ? 'company'
      : 'person',

  identificationNumber:
    (client as any)?.cuit ||
    (client as any)?.dni ||
    '',

  
  status: (client as any)?.status || 'nuevo',

  // 📍 ubicación simple
  locationUrl: (client as any)?.locationUrl || '',

  // 🆕 seguimiento comercial
  assignedSeller: (client as any)?.assignedSeller || '',
  lastContactAt: (client as any)?.lastContactAt || '',
  whatsappNumber: (client as any)?.whatsappNumber || '', // 👈 nuevo
})

  // 👇 Prioridad 1 — coincidencias en vivo contra los clientes ya cargados
  // (sin pegarle a la API), para avisar de posibles duplicados mientras
  // se escribe nombre/empresa/teléfono/dirección.
  const possibleDuplicates = useMemo(() => {
    const name = formData.name.trim().toLowerCase()
    const company = formData.company.trim().toLowerCase()
    const phone = onlyDigits(formData.phone)
    const address = formData.address.trim().toLowerCase()

    if (!name && !company && !phone && !address) return []

    return existingClients.filter((c) => {
      if (client && c.id === client.id) return false // no compararse contra sí mismo al editar

      const cName = (c.name || '').toLowerCase()
      const cCompany = (c.company || '').toLowerCase()
      const cPhone = onlyDigits(c.phone || '')
      const cAddress = (c.address || '').toLowerCase()

      return (
        (name.length >= 3 && cName.includes(name)) ||
        (company.length >= 3 && cCompany.includes(company)) ||
        (phone.length >= 6 && cPhone === phone) ||
        (address.length >= 5 && cAddress === address)
      )
    })
  }, [formData.name, formData.company, formData.phone, formData.address, existingClients, client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.phone.trim()) {
      const proceed = confirm(
        '¿Seguro que querés continuar sin teléfono? Es importante para poder contactar al cliente más adelante.'
      )
      if (!proceed) return
    }

    setIsSubmitting(true)

    try {
      const url = client ? `/api/clients/${client.id}` : '/api/clients'
      const method = client ? 'PUT' : 'POST'

      const payload = {
        ...formData,

        dni:
          formData.identificationType === 'person'
            ? formData.identificationNumber
            : null,

        cuit:
          formData.identificationType === 'company'
            ? formData.identificationNumber
            : null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        {/* 👇 Posibles duplicados — se actualiza en vivo mientras se escribe */}
        {possibleDuplicates.length > 0 && (
          <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-800">
              ⚠️ Ya existe{possibleDuplicates.length > 1 ? 'n' : ''} un cliente parecido — tocalo si es el mismo:
            </p>
            <div className="space-y-1.5">
              {possibleDuplicates.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectExisting?.(c)}
                  className="flex w-full items-center justify-between rounded border border-amber-200 bg-white px-2.5 py-1.5 text-left text-xs hover:bg-amber-100"
                  disabled={!onSelectExisting}
                >
                  <span className="font-medium text-foreground">
                    {c.name}{c.company ? ` · ${c.company}` : ''}
                  </span>
                  <span className="text-muted-foreground">{c.phone || 'sin teléfono'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

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

        <div className="grid gap-4 sm:grid-cols-3">

          <div className="space-y-2">
            <Label>Tipo de identificación</Label>

            <Select
              value={formData.identificationType}
              onValueChange={(v) =>
                setFormData({
                  ...formData,
                  identificationType: v,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="person">Persona</SelectItem>
                <SelectItem value="company">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {formData.identificationType === 'company'
                ? 'CUIT / RUT / RUC'
                : 'DNI'}
            </Label>

            <Input
              placeholder={
                formData.identificationType === 'company'
                  ? 'CUIT / RUT / RUC / CNPJ'
                  : 'Documento'
              }
              value={formData.identificationNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  identificationNumber: e.target.value,
                })
              }
            />
          </div>


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
            <Label>Teléfono</Label>
            <Input
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>
          
          {/* 👇 nuevo */}
          <WhatsappPhoneInput
            value={formData.whatsappNumber}
            onChange={(fullNumber) => setFormData({ ...formData, whatsappNumber: fullNumber })}
          />
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

        {/* 🆕 Ciudad y Provincia */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Ciudad</Label>
            <Input
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Provincia</Label>
            <Input
              value={formData.province}
              onChange={(e) =>
                setFormData({ ...formData, province: e.target.value })
              }
            />
          </div>
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
