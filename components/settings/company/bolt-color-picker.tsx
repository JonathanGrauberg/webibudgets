'use client'

import React, { useRef } from 'react'
import { motion } from 'framer-motion'

type ColorPickerProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div className="flex items-center gap-3">
        <motion.div
          className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg cursor-pointer border-2 border-white dark:border-slate-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => inputRef.current?.click()}
        >
          <div className="w-full h-full" style={{ backgroundColor: value }} />
          <input
            ref={inputRef}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </motion.div>
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const val = e.target.value
              if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) onChange(val)
            }}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  )
}
