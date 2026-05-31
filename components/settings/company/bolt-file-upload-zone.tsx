'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Upload, X } from 'lucide-react'

type FileUploadZoneProps = {
  label: string
  accept?: string
  value: string | null
  onChange: (value: string | null) => void
  previewSize?: 'sm' | 'md' | 'lg'
}

export function FileUploadZone({
  label,
  accept = 'image/*,.pdf',
  value,
  onChange,
  previewSize = 'lg',
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const readFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onloadend = () => onChange(reader.result as string)
      reader.readAsDataURL(file)
    },
    [onChange]
  )

  const sizeClasses = {
    sm: 'h-24 w-24',
    md: 'h-32 w-32',
    lg: 'h-48 w-full',
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div
        className={`relative ${sizeClasses[previewSize]} rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        } ${value ? 'border-solid bg-slate-50 dark:bg-slate-800/50' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
          const file = e.dataTransfer.files[0]
          if (file) readFile(file)
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) readFile(file)
          }}
          className="hidden"
        />
        {value ? (
          <div className="relative w-full h-full group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="w-full h-full object-contain rounded-lg p-2" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <Upload className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium">Drop file or click to upload</p>
            <p className="text-xs mt-1 text-slate-400 dark:text-slate-600">PNG, JPG, PDF</p>
          </div>
        )}
      </div>
    </div>
  )
}
