'use client'

import React from 'react'
import { getContrastColor, calculateContrastRatio } from '@/lib/contrast'
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
              <div className="w-3 h-3 rounded-full bg-slate-400" />
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
  logoSize = 100, // 👈 nuevo
  showPageNumbers = true,
  showWebsiteInPdf = true,
  showFooterBranding = false,
  template = 'clasico', // 👈 nuevo — "clasico" | "contraste" | "cantonera" | "directa"
  templateDark = false, // 👈 nuevo — toggle claro/oscuro, solo lo usa "directa"
}: {
  colors: ColorSystem
  watermark: string | null
  logo: string | null
  watermarkOpacity?: number
  logoSize?: number // 👈 nuevo
  showPageNumbers?: boolean
  showWebsiteInPdf?: boolean
  showFooterBranding?: boolean
  template?: string // 👈 nuevo
  templateDark?: boolean // 👈 nuevo
}) {
  const logoPx = Math.round(48 * (logoSize / 100)) // 👈 nuevo — 48px = el w-12/h-12 actual (12 * 4px de Tailwind)

  if (template === 'contraste') {
    return (
      <ContrasteDocPreview
        colors={colors}
        watermark={watermark}
        logo={logo}
        watermarkOpacity={watermarkOpacity}
        logoPx={logoPx}
        showPageNumbers={showPageNumbers}
        showWebsiteInPdf={showWebsiteInPdf}
        showFooterBranding={showFooterBranding}
      />
    )
  }

  if (template === 'cantonera') {
    return (
      <CantoneraDocPreview
        accent={colors.primary}
        watermark={watermark}
        logo={logo}
        watermarkOpacity={watermarkOpacity}
        logoPx={logoPx}
        showPageNumbers={showPageNumbers}
        showWebsiteInPdf={showWebsiteInPdf}
        showFooterBranding={showFooterBranding}
      />
    )
  }

  if (template === 'directa') {
    return (
      <DirectaDocPreview
        accent={colors.accent || colors.primary}
        watermark={watermark}
        logo={logo}
        watermarkOpacity={watermarkOpacity}
        logoPx={logoPx}
        showPageNumbers={showPageNumbers}
        showWebsiteInPdf={showWebsiteInPdf}
        showFooterBranding={showFooterBranding}
        dark={templateDark}
      />
    )
  }

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
            className="text-lg font-bold text-black"
            
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
            className="object-contain" // 👈 antes: "w-12 h-12 object-contain"
            style={{ width: logoPx, height: logoPx }} // 👈 nuevo — tamaño dinámico en vez de fijo
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
              <div className="flex items-center space-x-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <div className="text-xs text-slate-400">
                  Generado con <span className="font-semibold text-slate-500">budgets.webistudio.net</span>
                </div>
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

/** acento si contrasta lo suficiente contra `bg`; si no, cae a `fallback` (mismo criterio que lib/pdf/template-contraste.ts) */
function pickAccentOr(bg: string, accent: string, fallback: string, minRatio = 2.3) {
  try {
    return calculateContrastRatio(bg, accent) >= minRatio ? accent : fallback
  } catch {
    return fallback
  }
}

function ContrasteDocPreview({
  colors,
  watermark,
  logo,
  watermarkOpacity,
  logoPx,
  showPageNumbers,
  showWebsiteInPdf,
  showFooterBranding,
}: {
  colors: ColorSystem
  watermark: string | null
  logo: string | null
  watermarkOpacity: number
  logoPx: number
  showPageNumbers: boolean
  showWebsiteInPdf: boolean
  showFooterBranding: boolean
}) {
  const onPrimary = getContrastColor(colors.primary)
  const onSecondary = getContrastColor(colors.secondary)
  const badgeFg = getContrastColor(colors.accent)
  // 🐛 fix — "Para/De" van sobre el fondo primario (negro), no sobre la tarjeta
  // secundaria; ver el mismo comentario en lib/pdf/template-contraste.ts
  const titleColor = pickAccentOr(colors.primary, colors.accent, onPrimary)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Document Preview</h3>
      </div>
      <div className="p-4 flex justify-center">
        <div
          className="rounded-lg overflow-hidden shadow-2xl border relative"
          style={{ height: '500px', width: '360px', backgroundColor: colors.primary, color: onPrimary }}
        >
          {watermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img src={watermark} alt="Watermark" className="w-2/3 h-2/3 object-contain" style={{ opacity: watermarkOpacity }} />
            </div>
          )}

          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <div
              className="px-4 py-3.5 flex items-start justify-between"
              style={{ borderBottom: `1px solid ${onPrimary}30` }}
            >
              <div className="flex items-center gap-2">
                {logo ? (
                  <img src={logo} alt="Logo" className="object-contain" style={{ width: logoPx * 0.7, height: logoPx * 0.7 }} />
                ) : (
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center font-bold text-[9px]"
                    style={{ backgroundColor: onPrimary, color: colors.primary }}
                  >
                    WB
                  </div>
                )}
                <span className="text-xs font-bold">Mi Empresa</span>
              </div>
              <div className="text-right">
                <h2 className="text-base font-extrabold uppercase tracking-wide" style={{ color: titleColor }}>
                  Presupuesto
                </h2>
                <p className="text-[9px] mt-1" style={{ opacity: 0.65 }}>N° 000123 · 28/03/2025</p>
              </div>
            </div>

            {/* Para / De */}
            <div className="px-4 pt-3 flex gap-4 text-[10px]">
              <div className="flex-1">
                <div className="text-[8px] font-bold uppercase tracking-wide mb-1" style={{ color: titleColor }}>Para</div>
                <div className="h-2 w-20 rounded" style={{ backgroundColor: `${onPrimary}30` }} />
              </div>
              <div className="flex-1">
                <div className="text-[8px] font-bold uppercase tracking-wide mb-1" style={{ color: titleColor }}>De</div>
                <div className="h-2 w-20 rounded" style={{ backgroundColor: `${onPrimary}30` }} />
              </div>
            </div>

            {/* Tabla en tarjeta clara (Color Secundario) */}
            <div className="px-4 pt-3">
              <div className="rounded-md overflow-hidden text-[10px]" style={{ backgroundColor: colors.secondary, color: onSecondary }}>
                <div className="grid grid-cols-12 px-2 py-2 font-semibold" style={{ opacity: 0.55, fontSize: '8px' }}>
                  <div className="col-span-1" />
                  <div className="col-span-5">CONCEPTO</div>
                  <div className="col-span-2 text-right">CANT.</div>
                  <div className="col-span-4 text-right">SUBTOTAL</div>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="grid grid-cols-12 items-center px-2 py-1.5" style={{ borderTop: `1px solid ${onSecondary}15` }}>
                    <div className="col-span-1">
                      <span
                        className="inline-flex items-center justify-center rounded-full font-bold"
                        style={{ width: 12, height: 12, fontSize: '7px', backgroundColor: colors.accent, color: badgeFg }}
                      >
                        {i}
                      </span>
                    </div>
                    <div className="col-span-5"><div className="h-1.5 w-14 rounded" style={{ backgroundColor: `${onSecondary}25` }} /></div>
                    <div className="col-span-2 flex justify-end"><div className="h-1.5 w-4 rounded" style={{ backgroundColor: `${onSecondary}25` }} /></div>
                    <div className="col-span-4 flex justify-end"><div className="h-1.5 w-10 rounded" style={{ backgroundColor: `${onSecondary}25` }} /></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="px-4 pt-3">
              <div
                className="flex items-center justify-between rounded px-3 py-2 font-bold text-[11px]"
                style={{ backgroundColor: colors.accent, color: badgeFg }}
              >
                <span>Total</span>
                <span>$ 111.800</span>
              </div>
            </div>

            <div className="flex-1" />

            {/* Footer */}
            <div className="px-4 py-2.5" style={{ borderTop: `1px solid ${onPrimary}25`, opacity: 0.55 }}>
              <div className="flex items-center justify-between text-[9px]">
                <span>
                  {showFooterBranding && 'Generado con budgets.webistudio.net'}
                  {showFooterBranding && showWebsiteInPdf && ' · '}
                  {showWebsiteInPdf && 'www.mi-empresa.com'}
                </span>
                {showPageNumbers && <span>Página 1 de 1</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CantoneraDocPreview({
  accent,
  watermark,
  logo,
  watermarkOpacity,
  logoPx,
  showPageNumbers,
  showWebsiteInPdf,
  showFooterBranding,
}: {
  accent: string
  watermark: string | null
  logo: string | null
  watermarkOpacity: number
  logoPx: number
  showPageNumbers: boolean
  showWebsiteInPdf: boolean
  showFooterBranding: boolean
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Document Preview</h3>
      </div>
      <div className="p-4 flex justify-center">
        <div className="rounded-lg overflow-hidden shadow-2xl bg-white border relative" style={{ height: '500px', width: '360px' }}>
          {/* Cantonera — mismo truco border-trick que el PDF real, acotado a la esquina */}
          <div
            className="absolute top-0 right-0"
            style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '22px 22px 0 0', borderColor: `${accent} transparent transparent transparent` }}
          />

          {watermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img src={watermark} alt="Watermark" className="w-2/3 h-2/3 object-contain" style={{ opacity: watermarkOpacity }} />
            </div>
          )}

          <div className="relative z-10 px-5 py-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {logo ? (
                  <img src={logo} alt="Logo" className="object-contain" style={{ width: logoPx * 0.6, height: logoPx * 0.6 }} />
                ) : (
                  <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-[9px] bg-slate-900 text-white">WB</div>
                )}
                <span className="text-xs font-bold text-slate-900">Mi Empresa</span>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-slate-900">Presupuesto</h2>
                <div className="h-[3px] w-9 rounded ml-auto mt-1" style={{ backgroundColor: accent }} />
                <p className="text-[9px] text-slate-500 mt-1">N° 000123 · 28/03/2025</p>
              </div>
            </div>

            {/* Datos */}
            <p className="text-[8px] font-bold uppercase tracking-wide mt-4 mb-1.5" style={{ color: accent }}>Datos</p>
            <div className="flex gap-2 text-[9px]">
              {[0, 1].map((i) => (
                <div key={i} className="flex-1 rounded border border-slate-200 bg-slate-50 p-2" style={{ borderLeft: `3px solid ${accent}` }}>
                  <div className="h-1.5 w-14 rounded bg-slate-300 mb-1.5" />
                  <div className="h-1.5 w-10 rounded bg-slate-200" />
                </div>
              ))}
            </div>

            {/* Detalle */}
            <p className="text-[8px] font-bold uppercase tracking-wide mt-4 mb-1.5" style={{ color: accent }}>Detalle del presupuesto</p>
            <div className="text-[9px]">
              <div className="grid grid-cols-12 pb-1.5" style={{ borderBottom: `2px solid ${accent}` }}>
                <div className="col-span-6 font-semibold text-slate-500" style={{ fontSize: '7px' }}>CONCEPTO</div>
                <div className="col-span-3 text-right font-semibold text-slate-500" style={{ fontSize: '7px' }}>CANT.</div>
                <div className="col-span-3 text-right font-semibold text-slate-500" style={{ fontSize: '7px' }}>SUBTOTAL</div>
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className={`grid grid-cols-12 items-center py-1.5 ${i % 2 === 0 ? 'bg-slate-50' : ''}`} style={{ borderBottom: '1px solid #EDEEF1' }}>
                  <div className="col-span-6"><div className="h-1.5 w-16 rounded bg-slate-200" /></div>
                  <div className="col-span-3 flex justify-end"><div className="h-1.5 w-5 rounded bg-slate-200" /></div>
                  <div className="col-span-3 flex justify-end"><div className="h-1.5 w-8 rounded bg-slate-200" /></div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-3 flex justify-end">
              <div className="w-28 pt-2 flex justify-between font-bold text-[11px]" style={{ borderTop: `2px solid ${accent}` }}>
                <span className="text-slate-900">Total</span>
                <span style={{ color: accent }}>$ 111.800</span>
              </div>
            </div>

            <div className="flex-1" />

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
              <span>
                {showFooterBranding && 'Generado con budgets.webistudio.net'}
                {showFooterBranding && showWebsiteInPdf && ' · '}
                {showWebsiteInPdf && 'www.mi-empresa.com'}
              </span>
              {showPageNumbers && <span>Página 1 de 1</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DirectaDocPreview({
  accent,
  watermark,
  logo,
  watermarkOpacity,
  logoPx,
  showPageNumbers,
  showWebsiteInPdf,
  showFooterBranding,
  dark,
}: {
  accent: string
  watermark: string | null
  logo: string | null
  watermarkOpacity: number
  logoPx: number
  showPageNumbers: boolean
  showWebsiteInPdf: boolean
  showFooterBranding: boolean
  dark: boolean
}) {
  // 🎨 Paleta neutra fija, igual que en lib/pdf/template-directa.ts — el
  // color del tenant nunca pinta estos bloques grandes, solo el logo y el Total.
  const palette = dark
    ? { pageBg: '#24262C', ink: '#F5F6F8', muted: '#9CA3AF', panelBg: '#2F323A', chipBg: '#131417', chipFg: '#FFFFFF', rowAlt: '#2A2C33' }
    : { pageBg: '#FFFFFF', ink: '#15171C', muted: '#7A7F89', panelBg: '#EEF0F3', chipBg: '#15171C', chipFg: '#FFFFFF', rowAlt: '#FAFAFB' }
  const totalFg = pickAccentOr(palette.chipBg, accent, palette.chipFg)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Document Preview</h3>
      </div>
      <div className="p-4 flex justify-center">
        <div
          className="rounded-lg overflow-hidden shadow-2xl border relative"
          style={{ height: '500px', width: '360px', background: palette.pageBg }}
        >
          {watermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img src={watermark} alt="Watermark" className="w-2/3 h-2/3 object-contain" style={{ opacity: watermarkOpacity }} />
            </div>
          )}

          <div className="relative z-10 px-5 py-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {logo ? (
                  <img src={logo} alt="Logo" className="object-contain" style={{ width: logoPx * 0.6, height: logoPx * 0.6 }} />
                ) : (
                  <svg width={logoPx * 0.55} height={logoPx * 0.34} viewBox="0 0 40 24" fill="none">
                    <circle cx="14" cy="12" r="9.5" stroke={accent} strokeWidth="2.5" />
                    <circle cx="26" cy="12" r="9.5" stroke={accent} strokeWidth="2.5" />
                  </svg>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: palette.muted }}>Mi Empresa</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: palette.ink }}>Presupuesto</h2>
            </div>

            {/* Meta */}
            <div className="mt-3 text-[9px] space-y-0.5">
              <div><span className="inline-block w-16 font-bold" style={{ color: palette.ink }}>N°</span><span style={{ color: palette.muted }}>000123</span></div>
              <div><span className="inline-block w-16 font-bold" style={{ color: palette.ink }}>Fecha</span><span style={{ color: palette.muted }}>28/03/2025</span></div>
            </div>

            {/* Datos */}
            <div className="flex gap-4 text-[9px] mt-3">
              {[0, 1].map((i) => (
                <div key={i} className="flex-1">
                  <div className="h-1.5 w-10 rounded mb-1.5" style={{ backgroundColor: `${palette.muted}80` }} />
                  <div className="h-1.5 w-16 rounded mb-1" style={{ backgroundColor: palette.ink, opacity: 0.7 }} />
                  <div className="h-1.5 w-12 rounded" style={{ backgroundColor: `${palette.muted}50` }} />
                </div>
              ))}
            </div>

            {/* Detalle — columna de numeración con fondo sólido, igual que el PDF real */}
            <div className="text-[9px] mt-3">
              <div className="grid grid-cols-12 items-center" style={{ backgroundColor: palette.panelBg }}>
                <div className="col-span-1 text-center py-1.5 font-semibold" style={{ backgroundColor: palette.chipBg, color: palette.chipFg, fontSize: '7px' }}>N°</div>
                <div className="col-span-6 font-semibold py-1.5 pl-1.5" style={{ color: palette.muted, fontSize: '7px' }}>CONCEPTO</div>
                <div className="col-span-2 text-right font-semibold py-1.5" style={{ color: palette.muted, fontSize: '7px' }}>CANT.</div>
                <div className="col-span-3 text-right font-semibold py-1.5 pr-1.5" style={{ color: palette.muted, fontSize: '7px' }}>SUBTOTAL</div>
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-12 items-center py-1.5" style={{ borderBottom: `1px solid ${palette.panelBg}` }}>
                  <div className="col-span-1 text-center h-full flex items-center justify-center font-bold" style={{ backgroundColor: palette.chipBg, color: palette.chipFg, fontSize: '7px' }}>{i}</div>
                  <div className="col-span-6 pl-1.5"><div className="h-1.5 w-14 rounded" style={{ backgroundColor: `${palette.muted}50` }} /></div>
                  <div className="col-span-2 flex justify-end"><div className="h-1.5 w-5 rounded" style={{ backgroundColor: `${palette.muted}50` }} /></div>
                  <div className="col-span-3 flex justify-end pr-1.5"><div className="h-1.5 w-8 rounded" style={{ backgroundColor: `${palette.muted}50` }} /></div>
                </div>
              ))}
            </div>

            {/* Condiciones + Total */}
            <div className="mt-3 flex gap-3 items-start">
              <div className="flex-1 rounded p-2" style={{ backgroundColor: palette.panelBg }}>
                <div className="h-1.5 w-14 rounded mb-1" style={{ backgroundColor: palette.ink, opacity: 0.6 }} />
                <div className="h-1.5 w-10 rounded" style={{ backgroundColor: `${palette.muted}50` }} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-[8px] mb-1" style={{ color: palette.muted }}>
                  <span>Subtotal</span><span>$ 111.800</span>
                </div>
                <div className="flex justify-between items-center rounded px-2 py-1.5 text-[10px] font-bold" style={{ backgroundColor: palette.chipBg, color: palette.chipFg }}>
                  <span>Total</span>
                  <span style={{ color: totalFg }}>$ 111.800</span>
                </div>
              </div>
            </div>

            <div className="flex-1" />

            {/* Footer */}
            <div className="pt-2 border-t flex items-center justify-between text-[9px]" style={{ borderColor: palette.panelBg, color: palette.muted }}>
              <span>
                {showFooterBranding && 'Generado con budgets.webistudio.net'}
                {showFooterBranding && showWebsiteInPdf && ' · '}
                {showWebsiteInPdf && 'www.mi-empresa.com'}
              </span>
              {showPageNumbers && <span>Página 1 de 1</span>}
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
