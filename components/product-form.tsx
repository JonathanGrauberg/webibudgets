'use client'
//components\product-form.tsx
import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { HelpCircle } from 'lucide-react'
import type { ProductService, ProductCategory } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/types'
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currencies' // 👈 nuevo

interface ProductFormProps {
  product?: ProductService | null
  defaultCurrency?: string // 👈 nuevo — moneda del tenant, usada para productos nuevos
  onSuccess: () => void
  onCancel: () => void
}

export function ProductForm({ product, defaultCurrency, onSuccess, onCancel }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'other' as ProductCategory,
    price: product?.price || '',
    currency: product?.currency || defaultCurrency || DEFAULT_CURRENCY, // 👈 nuevo
    unit: product?.unit || 'unidad',
    active: product?.active ?? true,
  })

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)

  try {
    const url = product ? `/api/products/${product.id}` : '/api/products'
    const method = product ? 'PATCH' : 'POST' // 👈 FIX

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (!res.ok) throw new Error('Failed to save product')
    onSuccess()
  } catch (error) {
    console.error('Error saving product:', error)
  } finally {
    setIsSubmitting(false)
  }
}

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="name">Nombre *</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Nombre del producto o servicio</TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Producto/Servicio (ej. Silla Modelo A, Servicio de instalación, etc.)"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Descripción detallada del producto</TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción breve del producto o servicio..."
            rows={2}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="category">Categoría *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Tipo de producto o servicio</TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={formData.category}
              onValueChange={(value: ProductCategory) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="unit">Unidad</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Unidad de medida (ej: Metros, Por persona, Unidades, Litros)</TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="unidad"
            />
          </div>
        </div>

        {/* 🌟 Precio + Moneda en la misma fila */}
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="price">Precio *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Precio del producto o servicio</TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="price"
              type="number"
              min="0"
              step="any"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              placeholder="850000"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="currency">Moneda *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Moneda en la que está cargado el precio</TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={formData.currency}
              onValueChange={(value: string) =>
                setFormData({ ...formData, currency: value })
              }
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="active">Producto Activo</Label>
            <p className="text-sm text-muted-foreground">
              Los productos inactivos no aparecen al crear presupuestos
            </p>
          </div>
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : product ? 'Actualizar' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </TooltipProvider>
  )
}