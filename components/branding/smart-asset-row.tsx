'use client'

/**
 * SmartAssetRow — Drop-in replacement for CompactAssetRow
 * 
 * Sin crop, sin recorte forzado.
 * Solo: validación de tamaño → redimensión si es muy grande → compresión WebP.
 * El usuario sube lo que quiere y queda como quiere.
 */

import React, { useState, useRef, useCallback } from 'react'
import { Image as ImageIcon, Upload, X, AlertCircle, Info } from 'lucide-react'

// ─── Config por tipo de asset ──────────────────────────────────────────────────

type AssetConfig = {
  maxSizeMB: number      // Límite antes de mostrar error
  maxDimPx: number       // Máximo lado largo en píxeles (se escala proporcionalmente)
  quality: number        // WebP quality 0-1
  hint: string           // Texto de ayuda debajo del label
  accept: string         // MIME types para el input
}

const ASSET_CONFIG: Record<string, AssetConfig> = {
  logo: {
    maxSizeMB: 5,
    maxDimPx: 1200,
    quality: 0.85,
    hint: 'PNG o SVG · fondo transparente recomendado · aparece en el encabezado del PDF',
    accept: 'image/png,image/svg+xml,image/jpeg,image/webp',
  },
  favicon: {
    maxSizeMB: 2,
    maxDimPx: 256,
    quality: 0.9,
    hint: 'PNG cuadrado · mín. 64 × 64 px · aparece en la pestaña del navegador',
    accept: 'image/png,image/jpeg,image/webp,image/x-icon',
  },
  watermark: {
    maxSizeMB: 5,
    maxDimPx: 800,
    quality: 0.75,
    hint: 'PNG con fondo transparente · logo en gris o baja opacidad · se superpone en el PDF',
    accept: 'image/png,image/webp',
  },
  sidebarIcon: {
    maxSizeMB: 2,
    maxDimPx: 256,
    quality: 0.9,
    hint: 'PNG cuadrado · versión compacta del logo · aparece en la barra lateral',
    accept: 'image/png,image/jpeg,image/webp',
  },
}

function resolveConfig(label: string): AssetConfig {
  const l = label.toLowerCase()
  if (l.includes('favicon')) return ASSET_CONFIG.favicon
  if (l.includes('agua')) return ASSET_CONFIG.watermark
  if (l.includes('lateral') || l.includes('sidebar') || l.includes('icono')) return ASSET_CONFIG.sidebarIcon
  return ASSET_CONFIG.logo
}

// ─── Compresión pura, sin crop ─────────────────────────────────────────────────

function compressImage(
  file: File,
  config: AssetConfig,
  onDone: (dataUrl: string) => void,
  onError: () => void
) {
  const reader = new FileReader()
  reader.onerror = onError
  reader.onload = (ev) => {
    const src = ev.target?.result as string
    const img = new Image()
    img.onerror = onError
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      let { width, height } = img
      const max = config.maxDimPx

      if (width > max || height > max) {
        if (width >= height) {
          height = Math.round((height / width) * max)
          width = max
        } else {
          width = Math.round((width / height) * max)
          height = max
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { onError(); return }

      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      onDone(canvas.toDataURL('image/webp', config.quality))
    }
    img.src = src
  }
  reader.readAsDataURL(file)
}

// ─── Componente ────────────────────────────────────────────────────────────────

type SmartAssetRowProps = {
  label: string
  value: string | null
  onChange: (v: string | null) => void
}

export function SmartAssetRow({ label, value, onChange }: SmartAssetRowProps) {
  const config = resolveConfig(label)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const processFile = useCallback((file: File) => {
    setError(null)

    const mb = file.size / 1024 / 1024
    if (mb > config.maxSizeMB) {
      setError(
        `El archivo pesa ${mb.toFixed(1)} MB. El máximo es ${config.maxSizeMB} MB. ` +
        `Comprimí la imagen antes de subirla (podés usar squoosh.app).`
      )
      return
    }

    setIsProcessing(true)
    compressImage(
      file,
      config,
      (dataUrl) => {
        onChange(dataUrl)
        setIsProcessing(false)
      },
      () => {
        setError('No se pudo procesar la imagen. Probá con otro archivo.')
        setIsProcessing(false)
      }
    )
  }, [config, onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) processFile(file)
  }

  return (
    <div className="py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div
        className={`flex items-center gap-3 rounded-xl transition-all duration-150 ${
          isDragging ? 'bg-sky-50 dark:bg-sky-950/30 ring-2 ring-sky-400/50 p-2' : 'p-0'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
      >
        {/* Thumbnail */}
        <div
          className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center shrink-0 overflow-hidden transition-all ${
            value
              ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
              : 'border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
          }`}
        >
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-contain p-1.5" />
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-300 dark:text-slate-600" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{label}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
            {value ? (
              <span className="text-emerald-500 font-medium">✓ Imagen cargada</span>
            ) : (
              config.hint
            )}
          </p>
          {!value && (
            <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">
              Arrastrá aquí o usá el botón · máx. {config.maxSizeMB} MB
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept={config.accept}
            className="hidden"
            onChange={handleInputChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <Upload className="w-3 h-3" />
            {isProcessing ? 'Procesando…' : value ? 'Cambiar' : 'Subir'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(null); setError(null) }}
              className="p-1.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              title="Quitar imagen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto shrink-0 text-amber-400 hover:text-amber-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

export default SmartAssetRow