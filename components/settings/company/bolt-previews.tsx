'use client'

import React from 'react'
import { getContrastColor } from '@/lib/contrast'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'

export type ColorSystem = {
  primary: string
  secondary: string
  accent: string
}

export function SidebarPreview({ colors, logo }: { colors: ColorSystem; logo: string | null }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Sidebar Preview</h3>
      </div>
      <div className="p-4">
        <div
          className="w-20 rounded-lg overflow-hidden shadow-xl mx-auto"
          style={{
            height: '320px',
            background: `linear-gradient(180deg, ${colors.primary}15 0%, ${colors.secondary}15 100%)`,
          }}
        >
          <div className="h-12 flex items-center justify-center border-b" style={{ borderColor: `${colors.primary}30` }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Logo" className="h-8 w-auto object-contain px-2" />
            ) : (
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: colors.primary, color: getContrastColor(colors.primary) }}
              >
                WB
              </div>
            )}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2.5"
              style={{
                backgroundColor: i === 2 ? `${colors.primary}20` : 'transparent',
                borderLeft: i === 2 ? `3px solid ${colors.primary}` : '3px solid transparent',
              }}
            >
              <div
                className="w-5 h-5 rounded"
                style={{ backgroundColor: i === 2 ? colors.primary : `${colors.secondary}40` }}
              />
              <div
                className="flex-1 h-2 rounded"
                style={{
                  backgroundColor: i === 2 ? `${colors.primary}40` : `${colors.secondary}20`,
                  width: `${60 + i * 6}%`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DashboardPreview({ colors }: { colors: ColorSystem }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Dashboard Preview</h3>
      </div>
      <div className="p-4">
        <div className="rounded-lg overflow-hidden shadow-xl border dark:border-slate-700" style={{ height: '320px' }}>
          <div
            className="h-10 px-4 flex items-center border-b bg-white dark:bg-slate-900"
            style={{ borderBottom: `2px solid ${colors.primary}20` }}
          >
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700">
                  <div className="h-2 mb-1.5 rounded" style={{ backgroundColor: `${colors.secondary}20` }} />
                  <div
                    className="h-4 rounded"
                    style={{
                      backgroundColor: i === 1 ? colors.primary : i === 2 ? colors.accent : colors.secondary,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700">
              <div className="flex items-end justify-between h-24 gap-1">
                {[35, 55, 40, 70, 45, 85, 60].map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                    style={{ backgroundColor: i % 2 === 0 ? colors.primary : colors.accent }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PDFPreview({
  colors,
  watermark,
  logo,
  watermarkOpacity = 0.06,
  showPageNumbers = true,
  showWebsiteInPdf = true,
  showFooterBranding = false,
}: {
  colors: ColorSystem
  watermark: string | null
  logo: string | null
  watermarkOpacity?: number
  showPageNumbers?: boolean
  showWebsiteInPdf?: boolean
  showFooterBranding?: boolean
}){
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Document Preview</h3>
      </div>
      <div className="p-4 flex justify-center">
  <div
    className="rounded-lg overflow-hidden shadow-2xl bg-white border"
    style={{
      height: '500px',
      width: '360px',
    }}
  >
    <div className="relative w-full h-full flex flex-col bg-white">
      {/* Watermark */}
      {watermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img src={watermark} alt="Watermark" className="w-2/3 h-2/3 object-contain" style={{ opacity: watermarkOpacity }} />
        </div>
      )}

      {/* Header */}
      <div
        className="px-5 py-4 flex justify-between items-start border-b relative z-10"
        style={{
          borderBottomColor: `${colors.primary}30`,
        }}
      >
        <div>
          <h2
            className="text-lg font-bold"
            style={{ color: colors.primary }}
          >
            Presupuesto
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Fecha: 28/03/2025
          </p>
        </div>

        {logo && (
          <img
            src={logo}
            alt="Logo"
            className="w-12 h-12 object-contain"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4 relative z-10">
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wide">
            Datos del Cliente
          </h3>

          <div className="mt-2 space-y-2">
            <div className="h-2 w-40 bg-slate-200 rounded" />
            <div className="h-2 w-32 bg-slate-200 rounded" />
            <div className="h-2 w-48 bg-slate-200 rounded" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2">
            Detalle del Presupuesto
          </h3>

          <div className="border border-slate-300 rounded overflow-hidden text-xs">
            <div
              className="grid grid-cols-12 border-b text-white"
              style={{
                backgroundColor: colors.primary,
                color: getContrastColor(colors.primary),
              }}>
              <div className="col-span-6 px-2 py-2 font-semibold">
                Concepto
              </div>

              <div className="col-span-2 px-2 py-2 text-right font-semibold">
                Cant.
              </div>

              <div className="col-span-4 px-2 py-2 text-right font-semibold">
                Subtotal
              </div>
            </div>

            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="grid grid-cols-12 border-b last:border-b-0"
              >
                <div className="col-span-6 px-2 py-2">
                  <div className="h-2 w-24 bg-slate-200 rounded" />
                </div>

                <div className="col-span-2 px-2 py-2">
                  <div className="ml-auto h-2 w-6 bg-slate-200 rounded" />
                </div>

                <div className="col-span-4 px-2 py-2">
                  <div className="ml-auto h-2 w-14 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-40">
            <div
              className="flex justify-between pt-2 font-bold"
              style={{
                borderTop: `2px solid ${colors.primary}`,
              }}
            >
              <span>Total</span>
              <span>$ 111.800</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t relative z-10">
        <div className="flex items-center justify-between">
          <div>
            {showFooterBranding && (
              <div className="flex items-center space-x-2">
                {logo && <img src={logo} alt="logo" className="h-6 w-6 object-contain" />}
                <div className="text-xs font-semibold">Mi Empresa</div>
              </div>
            )}

            {showWebsiteInPdf && <div className="text-xs text-muted-foreground">www.mi-empresa.com</div>}
          </div>

          {showPageNumbers && <div className="text-xs text-muted-foreground">Página 1 de 1</div>}
        </div>
      </div>
    </div>
  </div>
</div>
    </div>
  )
}

export function MobilePreview({ colors, logo }: { colors: ColorSystem; logo: string | null }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Mobile Preview</h3>
      </div>
      <div className="p-4 flex justify-center">
        <div
          className="w-32 rounded-3xl overflow-hidden shadow-2xl border-4 dark:border-slate-700"
          style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}
        >
          <div className="h-6 flex justify-center items-end pb-1">
            <div className="w-16 h-4 bg-slate-900 rounded-t-lg" />
          </div>
          <div className="rounded-lg overflow-hidden border-2 dark:border-slate-600" style={{ height: '280px', margin: '0 4px 8px 4px' }}>
            <div className="h-10 px-3 flex items-center justify-between" style={{ backgroundColor: colors.primary, color: getContrastColor(colors.primary) }}>
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Logo" className="h-5 w-auto object-contain" />
              ) : (
                <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">WB</span>
                </div>
              )}
            </div>
            <div className="p-2 space-y-2" style={{ background: `${colors.secondary}10` }}>
              <div className="h-2 bg-white/40 rounded w-full" />
              <div className="grid grid-cols-2 gap-1">
                <div className="h-10 rounded" style={{ backgroundColor: `${colors.primary}60` }} />
                <div className="h-10 rounded" style={{ backgroundColor: `${colors.accent}60` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
