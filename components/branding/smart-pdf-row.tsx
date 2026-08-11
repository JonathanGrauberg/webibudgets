'use client'
//components\branding\smart-pdf-row.tsx
import React, { useState, useRef } from 'react'
import { FileText, Upload, X, AlertCircle } from 'lucide-react'

const MAX_SIZE_MB = 4

type SmartPdfRowProps = {
  label: string
  hint?: string
  fileName: string | null
  value: string | null // data URI
  onChange: (dataUri: string | null, fileName: string | null) => void
}

export function SmartPdfRow({ label, hint, fileName, value, onChange }: SmartPdfRowProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const processFile = (file: File) => {
    setError(null)
    if (file.type !== 'application/pdf') {
      setError('Solo se aceptan archivos PDF.')
      return
    }
    const mb = file.size / 1024 / 1024
    if (mb > MAX_SIZE_MB) {
      setError(`El archivo pesa ${mb.toFixed(1)} MB. El máximo es ${MAX_SIZE_MB} MB.`)
      return
    }

    setIsProcessing(true)
    const reader = new FileReader()
    reader.onerror = () => { setError('No se pudo leer el archivo.'); setIsProcessing(false) }
    reader.onload = (ev) => {
      onChange(ev.target?.result as string, file.name)
      setIsProcessing(false)
    }
    reader.readAsDataURL(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  return (
    <div className="py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center shrink-0 ${
            value
              ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
              : 'border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
          }`}
        >
          <FileText className={`w-5 h-5 ${value ? 'text-slate-500' : 'text-slate-300 dark:text-slate-600'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {value ? (
              <span className="text-emerald-500 font-medium">✓ {fileName || 'PDF cargado'}</span>
            ) : (
              hint ?? `PDF con tus condiciones comerciales · máx. ${MAX_SIZE_MB} MB`
            )}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleInputChange} />
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
              onClick={() => { onChange(null, null); setError(null) }}
              className="p-1.5 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
              title="Quitar PDF"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">{error}</p>
        </div>
      )}
    </div>
  )
}