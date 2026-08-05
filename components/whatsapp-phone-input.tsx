'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WHATSAPP_COUNTRIES, buildWhatsappNumber, isValidWhatsappNumber, type WhatsappCountry } from '@/lib/whatsapp'

interface WhatsappPhoneInputProps {
  value: string // número completo normalizado, o '' si vacío
  onChange: (fullNumber: string) => void
}

export function WhatsappPhoneInput({ value, onChange }: WhatsappPhoneInputProps) {
  const [country, setCountry] = useState<WhatsappCountry>('AR')
  const [rest, setRest] = useState('')

  // Si viene un valor ya cargado (edición), lo separamos en país + resto una sola vez al montar
  useEffect(() => {
    if (!value) return
    const match = (Object.entries(WHATSAPP_COUNTRIES) as [WhatsappCountry, typeof WHATSAPP_COUNTRIES[WhatsappCountry]][])
      .find(([, cfg]) => value.startsWith(cfg.dialCode + cfg.mobilePrefix))
    if (match) {
      const [code, cfg] = match
      setCountry(code)
      setRest(value.slice((cfg.dialCode + cfg.mobilePrefix).length))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const config = WHATSAPP_COUNTRIES[country]
  const fullNumber = buildWhatsappNumber(country, rest)
  const valid = rest.length === 0 || isValidWhatsappNumber(fullNumber)

  const handleRestChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '')
    setRest(cleaned)
    onChange(cleaned ? buildWhatsappNumber(country, cleaned) : '')
  }

  const handleCountryChange = (c: WhatsappCountry) => {
    setCountry(c)
    onChange(rest ? buildWhatsappNumber(c, rest) : '')
  }

  return (
    <div className="space-y-2">
      <Label>WhatsApp (opcional)</Label>
      <div className="flex gap-2">
        <Select value={country} onValueChange={(v: WhatsappCountry) => handleCountryChange(v)}>
          <SelectTrigger className="w-[120px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(WHATSAPP_COUNTRIES) as [WhatsappCountry, typeof WHATSAPP_COUNTRIES[WhatsappCountry]][]).map(([code, cfg]) => (
              <SelectItem key={code} value={code}>+{cfg.dialCode} {code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder={`Ej: ${config.example}`}
          value={rest}
          onChange={(e) => handleRestChange(e.target.value)}
          className={!valid ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {country === 'AR'
          ? 'Código de área sin el 0, luego el número. Se arma automático: +54 9 [área] [número].'
          : 'Código de área y número, sin espacios ni guiones.'}
      </p>
      {!valid && rest.length > 0 && (
        <p className="text-[11px] text-destructive">El número no parece completo.</p>
      )}
    </div>
  )
}