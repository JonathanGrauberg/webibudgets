'use client'

import React from 'react'

interface PdfPreviewProps {
  branding: {
    logoUrl?: string | null
    watermarkUrl?: string | null
  }
}

export default function PdfPreview({ branding }: PdfPreviewProps) {
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
          {branding?.watermarkUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img
                src={branding.watermarkUrl}
                alt="Watermark"
                className="w-64 opacity-[0.06] object-contain"
              />
            </div>
          )}

          {/* Header */}
          <div className="relative z-10 flex items-start justify-between border-b px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Presupuesto
              </h2>
              <p className="text-xs text-slate-500">
                Fecha: 28/03/2025
              </p>
            </div>

            {branding?.logoUrl && (
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="h-12 w-12 object-contain"
              />
            )}
          </div>

          {/* Body */}
          <div className="relative z-10 px-5 py-4">
            <div className="mb-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
                Datos del Cliente
              </h3>

              <div className="mt-2 space-y-2">
                <div className="h-2 w-40 bg-slate-200 rounded" />
                <div className="h-2 w-32 bg-slate-200 rounded" />
                <div className="h-2 w-48 bg-slate-200 rounded" />
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-800">
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
            <div className="h-2 w-24 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  )
}