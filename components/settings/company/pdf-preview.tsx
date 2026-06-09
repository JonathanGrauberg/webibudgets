'use client'

import React from 'react'

import { getContrastColor } from '@/lib/contrast'

interface PdfPreviewProps {
  colors?: {
    primary?: string | null
    secondary?: string | null
    accent?: string | null
  }
  watermark?: string | null
  logo?: string | null
  watermarkOpacity?: number
  showPageNumbers?: boolean
  showWebsiteInPdf?: boolean
  showFooterBranding?: boolean
}

export default function PdfPreview({
  colors,
  watermark,
  logo,
  watermarkOpacity = 0.06,
  showPageNumbers = true,
  showWebsiteInPdf = true,
  showFooterBranding = false,
}: PdfPreviewProps) {
  const primary = colors?.primary ?? '#0F172A'
  const headerColor = getContrastColor(primary)
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <h4 className="font-semibold">PDF Preview</h4>
        <p className="text-xs text-muted-foreground">
          Vista previa del presupuesto
        </p>
      </div>

      <div className="p-6 flex justify-center">
        <div
          className="relative bg-white shadow-xl rounded-md overflow-hidden"
          style={{
            width: '320px',
            height: '450px',
          }}
        >
          {/* Watermark */}
          {watermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img
                src={watermark}
                alt="Watermark"
                className="w-64 object-contain"
                style={{ opacity: watermarkOpacity }}
              />
            </div>
          )}

          {/* Header */}
            <div className="relative z-10 flex items-start justify-between border-b px-5 py-4" style={{ borderBottomColor: `${primary}30` }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: primary }}>
                Presupuesto
              </h2>
              <p className="text-xs text-slate-500">
                Fecha: 28/03/2025
              </p>
            </div>

            {logo && (
              <img src={logo} alt="Logo" className="h-12 w-12 object-contain" />
            )}
          </div>

          {/* Body */}
          <div className="relative z-10 px-5 py-4">
            <div className="mb-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wide" style={{ color: primary }}>
                Datos del Cliente
              </h3>

              <div className="mt-2 space-y-2">
                <div className="h-2 w-40 bg-slate-200 rounded" />
                <div className="h-2 w-32 bg-slate-200 rounded" />
                <div className="h-2 w-48 bg-slate-200 rounded" />
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: primary }}>
                Detalle
              </h3>

              <div className="overflow-hidden rounded border border-slate-300 text-xs">
                <div className="grid grid-cols-12 bg-slate-100 border-b">
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
              <div className="w-40 border-t-2 pt-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span>$ 111.800</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 border-t px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                {showFooterBranding && (
                  <div className="flex items-center space-x-2">
                    {logo && <img src={logo} alt="logo" className="h-6 w-6 object-contain" />}
                    <div className="text-xs font-semibold">Mi Empresa</div>
                  </div>
                )}

                {showWebsiteInPdf && (
                  <div className="text-xs text-muted-foreground">www.mi-empresa.com</div>
                )}
              </div>

              {showPageNumbers && (
                <div className="text-xs text-muted-foreground">Página 1 de 1</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}