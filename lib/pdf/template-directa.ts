// lib\pdf\template-directa.ts
//
// Cuarta plantilla de PDF para presupuestos ("Directa") — feature PRO.
// Misma firma que budgetPdfTemplate (lib/pdf/template.ts) para poder
// intercambiarla desde renderBudgetPdf() sin tocar el resto del flujo.
//
// Referencia: diseño tipo "invoice" con título enorme, columna de
// numeración con fondo sólido y fila de Total en barra sólida. La
// referencia original pinta esos bloques grandes con un color fuerte
// (naranja en su variante oscura) — pero acá ESE bloque va siempre en un
// neutro fijo (negro/gris, igual que la propia referencia clara, que no
// usa color en absoluto). El color del tenant NUNCA pinta un área grande:
// aparece solo en el trazo del logo de doble anillo y en el monto del
// Total (con chequeo de contraste, igual criterio que "Contraste"). Así
// se respeta tal cual la organización/disposición de la referencia sin el
// riesgo de que un color como rojo fuerte o verde lima arruine un bloque
// grande.
//
// "Fondo oscuro" es un toggle propio de esta plantilla (tenant.pdfTemplateDark)
// que solo cambia la paleta neutra de fondo/texto — nunca los bloques que
// ya son neutros de por sí, ni la lógica de acento.
//
// Sin descripción de ítem ni línea de firma, mismo criterio que "Contraste"
// (la firma se suma a futuro con firma táctil/mouse). La sección "Payment
// Info" de la referencia se mapea a "Condiciones comerciales" porque es el
// dato que la app realmente tiene (no hay datos bancarios en este sistema).

import { calculateContrastRatio } from '@/lib/contrast'
import { formatCurrency as formatCurrencyBase } from '@/lib/format'
import { DEFAULT_CURRENCY } from '@/lib/currencies'

/**
 * Devuelve `accent` si contrasta lo suficiente contra `bg`; si no, cae a
 * `fallback`. Mismo helper que usa "Contraste" — acá protege el monto del
 * Total, que es el único texto que se pinta con el color del tenant sobre
 * un fondo (el bloque neutro del Total, no un fondo elegido por el tenant).
 */
function pickAccentOr(bg: string, accent: string, fallback: string, minRatio = 2.3) {
  try {
    return calculateContrastRatio(bg, accent) >= minRatio ? accent : fallback
  } catch {
    return fallback
  }
}

export function budgetPdfTemplateDirecta(
  budget: any,
  opts?: {
    logoDataUri?: string
    watermarkDataUri?: string
    companyName?: string
    isTrial?: boolean
    tenant?: {
      name?: string
      phone?: string
      email?: string
      address?: string
      website?: string
      primaryColor?: string
      accentColor?: string
      watermarkOpacity?: number
      logoSize?: number
      showPageNumbers?: boolean
      showWebsiteInPdf?: boolean
      showFooterBranding?: boolean
      pdfTemplateDark?: boolean
    }
  }
) {
  const tenant = opts?.tenant
  const logoWidthPx = Math.round(34 * ((tenant?.logoSize ?? 100) / 100))
  const watermarkOpacity = tenant?.watermarkOpacity ?? 0.06
  const accent = tenant?.accentColor || tenant?.primaryColor || '#0F172A'
  const dark = !!tenant?.pdfTemplateDark

  // 🎨 Paleta neutra fija — NO depende del tenant. Es justo lo que evita
  // el problema de la referencia (bloques grandes en un color arbitrario).
  const palette = dark
    ? {
        pageBg: '#24262C',
        ink: '#F5F6F8',
        muted: '#A7ACB6',
        panelBg: '#2F323A',
        panelBorder: '#3A3D46',
        rowBorder: '#34363D',
        chipBg: '#131417',
        chipFg: '#FFFFFF',
      }
    : {
        pageBg: '#FFFFFF',
        ink: '#15171C',
        muted: '#7A7F89',
        panelBg: '#EEF0F3',
        panelBorder: '#E4E6EB',
        rowBorder: '#EDEEF1',
        chipBg: '#15171C',
        chipFg: '#FFFFFF',
      }

  const totalFg = pickAccentOr(palette.chipBg, accent, palette.chipFg)

  const budgetCurrency = budget.currency ?? DEFAULT_CURRENCY
  const formatCurrency = (value: number) => formatCurrencyBase(value, budgetCurrency)

  const hasDiscount = Number(budget.discount ?? 0) > 0
  const hasTax = Number(budget.tax ?? 0) > 0
  const hasShipping = budget.shippingCost !== null && budget.shippingCost !== undefined
  const shippingValue = Number(budget.shippingCost ?? 0)

  const taxedBase = Math.max(0, Number(budget.subtotal ?? 0) - Number(budget.discount ?? 0))
  const taxPercentageDisplay = hasTax && taxedBase > 0
    ? Math.round((Number(budget.tax) / taxedBase) * 100 * 10) / 10
    : 0

  // 👇 Logo real si el tenant subió uno; si no, el motivo de doble anillo de
  // la referencia (con el trazo en el color de acento — el único lugar,
  // junto con el Total, donde el color del tenant aparece).
  const logoMarkup = opts?.logoDataUri
    ? `<img class="logo" src="${opts.logoDataUri}" alt="Logo" />`
    : `<svg class="logo-mark" width="${logoWidthPx}" height="${Math.round(logoWidthPx * 0.6)}" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
         <circle cx="14" cy="12" r="9.5" stroke="${accent}" stroke-width="2.5"/>
         <circle cx="26" cy="12" r="9.5" stroke="${accent}" stroke-width="2.5"/>
       </svg>`
  const watermark = opts?.watermarkDataUri ?? opts?.logoDataUri ?? ''

  const installationResponsibleLabel =
    budget.installationResponsible === 'company'
      ? `A cargo de ${opts?.companyName || 'la empresa'}`
      : budget.installationResponsible === 'client'
        ? 'A cargo del cliente'
        : budget.installationResponsible || '—'

  let safetyDetails: Array<{ title: string; value: string }> = []
  try {
    if (Array.isArray(budget.details)) {
      safetyDetails = budget.details
    } else if (typeof budget.details === 'string') {
      safetyDetails = JSON.parse(budget.details)
    }
  } catch (e) {
    console.error("Error parsing budget details for PDF (directa)", e)
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    @page { margin: 26px 28px; }

    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: ${palette.ink};
      background: ${palette.pageBg};
      position: relative;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    ${
      watermark
        ? `
    body::before{
      content:"";
      position: fixed;
      left: 0; top: 0; right: 0; bottom: 0;
      background-image: url('${watermark}');
      background-repeat: no-repeat;
      background-position: center;
      background-size: 480px auto;
      opacity: ${dark ? watermarkOpacity * 1.4 : watermarkOpacity};
      pointer-events: none;
      z-index: 0;
    }`
        : ''
    }

    .page { position: relative; z-index: 1; }

    .header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .logo { height: ${logoWidthPx}px; width: auto; object-fit: contain; }
    .brand-name { font-size: 12px; font-weight: bold; letter-spacing: 0.4px; text-transform: uppercase; color: ${palette.muted}; }

    h1.doc-title {
      font-size: 34px; font-weight: 900; margin: 0; text-align: right;
      letter-spacing: -1px; text-transform: uppercase; color: ${palette.ink};
    }

    .meta { margin: 16px 0 18px; font-size: 11.5px; }
    .meta div { margin-bottom: 3px; }
    .meta b { display: inline-block; width: 110px; color: ${palette.ink}; }
    .meta span { color: ${palette.muted}; }

    .parties { display: flex; gap: 20px; margin-bottom: 18px; }
    .parties > div { flex: 1 1 0; }
    .eyebrow {
      font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.6px; font-weight: bold;
      color: ${palette.ink}; margin: 0 0 4px;
    }
    .party-name { font-weight: bold; font-size: 12.5px; color: ${palette.ink}; }
    .party-sub { font-size: 11px; color: ${palette.muted}; margin-top: 1px; }

    table { width: 100%; border-collapse: collapse; margin-top: 2px; }
    thead th {
      text-align: left; font-weight: bold; font-size: 9.5px; letter-spacing: 0.5px; text-transform: uppercase;
      color: ${palette.muted}; background: ${palette.panelBg}; padding: 9px 8px;
    }
    thead th:first-child { background: ${palette.chipBg}; color: ${palette.chipFg}; text-align: center; }
    thead th.right { text-align: right; }
    tbody td { padding: 9px 8px; font-size: 12px; color: ${palette.ink}; border-bottom: 1px solid ${palette.rowBorder}; vertical-align: middle; }
    tbody td:first-child {
      background: ${palette.chipBg}; color: ${palette.chipFg}; text-align: center; font-weight: bold; width: 30px;
    }
    td.right { text-align: right; white-space: nowrap; }

    .below-table { display: flex; gap: 20px; margin-top: 16px; align-items: flex-start; }
    .below-table .box { flex: 1 1 0; margin-bottom: 0; }
    .summary { flex: 1 1 0; }
    .summary table { width: 100%; margin: 0; }
    .summary td { padding: 4px 4px; font-size: 12px; color: ${palette.muted}; border: none; }
    .summary .total td { color: ${palette.ink}; font-weight: bold; }
    .total-bar {
      display: flex; justify-content: space-between; align-items: center;
      background: ${palette.chipBg}; color: ${palette.chipFg}; border-radius: 6px;
      padding: 10px 14px; margin-top: 8px; font-weight: bold; font-size: 14.5px;
    }
    .total-bar span.amount { color: ${totalFg}; }

    .box { border: 1px solid ${palette.panelBorder}; background: ${palette.panelBg}; border-radius: 6px; padding: 10px 13px; font-size: 11.5px; color: ${palette.muted}; line-height: 1.7; margin-bottom: 6px; }
    .box b { color: ${palette.ink}; }

    a { color: ${palette.muted}; text-decoration: none; border-bottom: 1px solid ${palette.panelBorder}; }

    h2.section-title {
      font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.6px; font-weight: bold;
      color: ${palette.ink}; margin: 20px 0 6px;
    }

    .footer { position: fixed; bottom: 10px; left: 0; right: 0; font-size: 10px; color: ${palette.muted}; display: flex; justify-content: space-between; padding: 0 6px; }
    .page-num:after { content: 'Página ' counter(page) ' de ' counter(pages); }
    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  </style>
</head>

<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        ${logoMarkup}
        <div class="brand-name">${tenant?.name ?? 'Empresa'}</div>
      </div>
      <h1 class="doc-title">Presupuesto</h1>
    </div>

    <div class="meta">
      <div><b>N° de presupuesto</b><span>${(budget.budgetNumber ?? 0).toString().padStart(6, '0')}</span></div>
      <div><b>Fecha</b><span>${budget.createdAt ? new Date(budget.createdAt).toLocaleDateString('es-AR') : '—'}</span></div>
    </div>

    <div class="parties avoid-break">
      <div>
        <p class="eyebrow">Para</p>
        <div class="party-name">${budget.client?.company || budget.client?.name || '—'}</div>
        ${budget.client?.company && budget.client?.name ? `<div class="party-sub">${budget.client.name}</div>` : ''}
        ${budget.client?.phone ? `<div class="party-sub">${budget.client.phone}</div>` : ''}
        ${budget.client?.email ? `<div class="party-sub">${budget.client.email}</div>` : ''}
      </div>
      <div>
        <p class="eyebrow">De</p>
        <div class="party-name">${tenant?.name ?? 'Empresa'}</div>
        ${tenant?.phone ? `<div class="party-sub">${tenant.phone}</div>` : ''}
        ${tenant?.email ? `<div class="party-sub">${tenant.email}</div>` : ''}
        ${tenant?.website ? `<div class="party-sub"><a href="${tenant.website}">${tenant.website}</a></div>` : ''}
      </div>
    </div>

    <table class="avoid-break">
      <thead>
        <tr>
          <th>N°</th>
          <th>Concepto</th>
          <th class="right">Cant.</th>
          <th class="right">Precio unit.</th>
          <th class="right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${(budget.items ?? [])
          .map((item: any, i: number) => {
            const conceptName = item.customName || item.productService?.name || '—'
            const conceptUnit = item.productService?.unit || 'un.'
            return `
              <tr>
                <td>${i + 1}</td>
                <td>${conceptName}</td>
                <td class="right">${item.quantity ?? 0} ${conceptUnit}</td>
                <td class="right">${formatCurrency(Number(item.unitPrice ?? 0))}</td>
                <td class="right">${formatCurrency(Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0))}</td>
              </tr>
            `
          })
          .join('')}
      </tbody>
    </table>

    <div class="below-table avoid-break">
      <div class="box">
        <b>Condiciones comerciales</b><br />
        ${budget.validUntil ? `Válido hasta: <b>${new Date(budget.validUntil).toLocaleDateString('es-AR')}</b><br />` : ''}
        ${budget.paymentTerms ? `Pago: <b>${budget.paymentTerms}</b>` : (!budget.validUntil ? '—' : '')}
      </div>
      <div class="summary">
        <table>
          <tr><td>Subtotal</td><td class="right">${formatCurrency(Number(budget.subtotal ?? 0))}</td></tr>
          ${
            hasDiscount
              ? `<tr><td>Descuento</td><td class="right">− ${formatCurrency(Number(budget.discount ?? 0))}</td></tr>`
              : ''
          }
          ${
            hasTax
              ? `<tr><td>IVA (${taxPercentageDisplay}%)</td><td class="right">+ ${formatCurrency(Number(budget.tax ?? 0))}</td></tr>`
              : ''
          }
          ${
            hasShipping
              ? `<tr><td>Envío</td><td class="right">+ ${formatCurrency(shippingValue)}</td></tr>`
              : ''
          }
        </table>
        <div class="total-bar"><span>Total</span><span class="amount">${formatCurrency(Number(budget.total ?? 0))}</span></div>
      </div>
    </div>

    <h2 class="section-title">Datos de trabajo / instalación</h2>
    <div class="box avoid-break">
      Responsable: <b>${installationResponsibleLabel}</b><br />
      Personal de referencia: ${budget.installerReference || '—'}
    </div>

    ${
      safetyDetails.length > 0
        ? `<h2 class="section-title">Detalles adicionales</h2>` +
          safetyDetails
            .map(
              (detail) => `
        <div class="box avoid-break">
          <b>${detail.title}</b>
          <br />
          ${detail.value}
        </div>
        `
            )
            .join('')
        : ''
    }

    ${
      budget.notes
        ? `
    <h2 class="section-title">Notas</h2>
    <div class="box avoid-break">
      ${budget.notes}
    </div>
    `
        : ''
    }
  </div>

  <div class="footer">
    <div>
      ${tenant?.showFooterBranding ? `<span>Generado con <span style="font-weight:600;">budgets.webistudio.net</span></span>` : ''}
      ${tenant?.showWebsiteInPdf && tenant?.website ? `<span> · <a href="${tenant.website}">${tenant.website}</a></span>` : ''}
    </div>
    ${tenant?.showPageNumbers ? `<div class="page-num"></div>` : ''}
  </div>
</body>
</html>
`
}
