// lib\pdf\template-contraste.ts
//
// Segunda plantilla de PDF para presupuestos ("Contraste") — feature PRO.
// Misma firma que budgetPdfTemplate (lib/pdf/template.ts) para poder
// intercambiarlas desde renderBudgetPdf() sin tocar el resto del flujo.
//
// A diferencia de la plantilla clásica (un solo acento puntual), esta usa
// bloques de color de verdad: fondo con el Color Principal del tenant,
// tarjetas con el Color Secundario, y detalles (título, numeritos de fila,
// total) con el Color de Acento. Funciona porque usa el trío completo que
// el propio tenant arma en "Sistema de Colores", no un color aislado — y
// el texto de cada superficie se recalcula con getContrastColor para que
// siempre se lea, sea cual sea la combinación elegida.
//
// Por pedido explícito (sesión de diseño previa): sin descripción de ítem
// en la tabla y sin línea de firma (se suma cuando esté la firma táctil).

import { getContrastColor, calculateContrastRatio } from '@/lib/contrast'
import { formatCurrency as formatCurrencyBase } from '@/lib/format'
import { DEFAULT_CURRENCY } from '@/lib/currencies'

/**
 * Devuelve `accent` si contrasta lo suficiente contra `bg`; si no, cae a
 * `fallback` (pensado para ser siempre legible, ej. getContrastColor(bg)).
 * minRatio 2.3 es deliberadamente laxo (no es texto de body ni WCAG AA
 * estricto) — alcanza para evitar el caso roto: acento casi invisible
 * sobre un fondo del mismo tono/luminosidad.
 */
function pickAccentOr(bg: string, accent: string, fallback: string, minRatio = 2.3) {
  try {
    return calculateContrastRatio(bg, accent) >= minRatio ? accent : fallback
  } catch {
    return fallback
  }
}

export function budgetPdfTemplateContraste(
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
      secondaryColor?: string
      accentColor?: string
      watermarkOpacity?: number
      logoSize?: number
      showPageNumbers?: boolean
      showWebsiteInPdf?: boolean
      showFooterBranding?: boolean
    }
  }
) {
  const tenant = opts?.tenant
  const logoWidthPx = Math.round(38 * ((tenant?.logoSize ?? 100) / 100))
  const watermarkOpacity = tenant?.watermarkOpacity ?? 0.06

  const primary = tenant?.primaryColor ?? '#0F172A'
  const secondary = tenant?.secondaryColor ?? '#F2F2F2'
  const accent = tenant?.accentColor ?? '#FCC107'

  const onPrimary = getContrastColor(primary)
  const onSecondary = getContrastColor(secondary)
  const badgeFg = getContrastColor(accent)
  // 🐛 fix — "Para/De" y los títulos de sección (h2.section-title) van sobre el
  // fondo PRIMARIO (negro), no sobre la tarjeta secundaria. Antes se calculaba
  // el acento contra "secondary", así que con un secundario claro + acento
  // también claro (ej. blanco + dorado) el fallback daba un gris casi negro
  // — invisible sobre fondo negro. Ambos (título y estos labels) van contra
  // "primary", por eso reusan la misma variable.
  const titleColor = pickAccentOr(primary, accent, onPrimary)

  // 🌟 Moneda del presupuesto: la propia del budget, con fallback por si es un registro viejo
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

  const logo = opts?.logoDataUri ? `<img class="logo" src="${opts.logoDataUri}" alt="Logo" />` : ''
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
    console.error("Error parsing budget details for PDF (contraste)", e)
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
      color: ${onPrimary};
      background: ${primary};
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
      background-size: 420px auto;
      opacity: ${watermarkOpacity};
      pointer-events: none;
      z-index: 0;
    }`
        : ''
    }

    .page { position: relative; z-index: 1; }

    .header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; padding-bottom: 14px; margin-bottom: 18px;
      border-bottom: 1px solid ${onPrimary}2e;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .logo { height: ${logoWidthPx}px; width: auto; object-fit: contain; }
    .brand-name { font-size: 14px; font-weight: bold; }

    .title-block { text-align: right; }
    .title-block h1 {
      font-size: 26px; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;
      color: ${titleColor};
    }
    .muted { opacity: 0.65; font-size: 11px; margin: 4px 0 0; }

    .parties { display: flex; gap: 20px; margin-bottom: 18px; }
    .parties > div { flex: 1 1 0; }
    .eyebrow {
      font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.6px; font-weight: bold;
      color: ${titleColor}; margin: 0 0 4px;
    }
    .party-name { font-weight: bold; font-size: 12.5px; }
    .party-sub { font-size: 11px; opacity: 0.7; margin-top: 1px; }

    .card { background: ${secondary}; color: ${onSecondary}; border-radius: 6px; padding: 2px 14px; margin-bottom: 16px; }

    table { width: 100%; border-collapse: collapse; }
    thead th {
      text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.4px;
      opacity: 0.55; padding: 10px 6px 7px; font-weight: bold;
    }
    thead th.right, td.right { text-align: right; }
    td { padding: 9px 6px; font-size: 11.5px; border-top: 1px solid ${onSecondary}1a; vertical-align: top; }
    tbody tr:first-child td { border-top: none; }
    .badge {
      display: inline-block; width: 18px; height: 18px; line-height: 18px; text-align: center;
      border-radius: 50%; background: ${accent}; color: ${badgeFg}; font-size: 9.5px; font-weight: bold;
    }

    .summary { width: 260px; margin-left: auto; margin-top: 2px; }
    .summary-line { display: flex; justify-content: space-between; font-size: 11.5px; padding: 4px 3px; opacity: 0.8; }
    .total {
      display: flex; justify-content: space-between; align-items: center;
      background: ${accent}; color: ${badgeFg}; border-radius: 5px; padding: 9px 13px;
      margin-top: 7px; font-weight: bold; font-size: 14px;
    }

    h2.section-title {
      font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.6px; font-weight: bold;
      color: ${titleColor}; margin: 20px 0 6px;
    }
    .box { background: ${secondary}; color: ${onSecondary}; border-radius: 6px; padding: 10px 14px; font-size: 11px; line-height: 1.7; margin-bottom: 4px; }
    .box b { font-weight: bold; }

    a { color: inherit; }

    .footer {
      position: fixed; bottom: 10px; left: 0; right: 0; font-size: 9.5px; opacity: 0.55;
      display: flex; justify-content: space-between; padding: 0 6px;
    }
    .page-num:after { content: 'Página ' counter(page) ' de ' counter(pages); }
    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  </style>
</head>

<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        ${logo}
        <div class="brand-name">${tenant?.name ?? 'Empresa'}</div>
      </div>
      <div class="title-block">
        <h1>Presupuesto</h1>
        <p class="muted">
          N° ${(budget.budgetNumber ?? 0).toString().padStart(6, '0')} ·
          ${budget.createdAt ? new Date(budget.createdAt).toLocaleDateString('es-AR') : '—'}
        </p>
      </div>
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

    <div class="card avoid-break">
      <table>
        <thead>
          <tr>
            <th style="width:26px"></th>
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
                  <td><span class="badge">${i + 1}</span></td>
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
    </div>

    <div class="summary avoid-break">
      <div class="summary-line"><span>Subtotal</span><span>${formatCurrency(Number(budget.subtotal ?? 0))}</span></div>

      ${
        hasDiscount
          ? `<div class="summary-line"><span>Descuento</span><span>− ${formatCurrency(Number(budget.discount ?? 0))}</span></div>`
          : ''
      }

      ${
        hasTax
          ? `<div class="summary-line"><span>IVA (${taxPercentageDisplay}%)</span><span>+ ${formatCurrency(Number(budget.tax ?? 0))}</span></div>`
          : ''
      }

      ${
        hasShipping
          ? `<div class="summary-line"><span>Envío</span><span>+ ${formatCurrency(shippingValue)}</span></div>`
          : ''
      }

      <div class="total"><span>Total</span><span>${formatCurrency(Number(budget.total ?? 0))}</span></div>
    </div>

    <h2 class="section-title">Datos de trabajo / instalación</h2>
    <div class="box avoid-break">
      Responsable: <b>${installationResponsibleLabel}</b><br />
      Personal de referencia: ${budget.installerReference || '—'}
    </div>

    ${
      budget.validUntil || budget.paymentTerms
        ? `
    <h2 class="section-title">Condiciones comerciales</h2>
    <div class="box avoid-break">
      ${budget.validUntil ? `Presupuesto válido hasta: <b>${new Date(budget.validUntil).toLocaleDateString('es-AR')}</b><br />` : ''}
      ${budget.paymentTerms ? `Condiciones de pago: <b>${budget.paymentTerms}</b>` : ''}
    </div>
    `
        : ''
    }

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
      ${tenant?.showFooterBranding ? `Generado con budgets.webistudio.net` : ''}
      ${tenant?.showWebsiteInPdf && tenant?.website ? ` · ${tenant.website}` : ''}
    </div>
    ${tenant?.showPageNumbers ? `<div class="page-num"></div>` : ''}
  </div>
</body>
</html>
`
}
