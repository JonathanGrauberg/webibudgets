// components/city-autocomplete.tsx
//
// Autocompletar de ciudad/localidad, filtrado por provincia, contra la API
// Georef (datos.gob.ar) vía app/api/georef/localidades. A propósito NO es
// un select cerrado: el valor tipeado se guarda igual aunque no se elija
// una sugerencia — así una localidad chica que no esté en el catálogo
// oficial no bloquea al usuario.
'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

interface CityAutocompleteProps {
  value: string
  onChange: (value: string) => void
  provinciaId: string | null
  disabled?: boolean
}

export function CityAutocomplete({ value, onChange, provinciaId, disabled }: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!provinciaId || value.trim().length < 2) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/georef/localidades?provincia=${encodeURIComponent(provinciaId)}&q=${encodeURIComponent(value.trim())}`,
          { signal: controller.signal }
        )
        const data = await res.json().catch(() => ({ localidades: [] }))
        setSuggestions(data.localidades ?? [])
      } catch {
        // búsqueda cancelada o la API externa falló — no rompemos el input
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [value, provinciaId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        disabled={disabled}
        placeholder={disabled ? 'Elegí una provincia primero' : 'Ej: Mar del Plata'}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && !disabled && (loading || suggestions.length > 0) && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow-md">
          {loading ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Buscando...</p>
          ) : (
            suggestions.map((nombre) => (
              <button
                key={nombre}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onChange(nombre)
                  setOpen(false)
                }}
              >
                {nombre}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
