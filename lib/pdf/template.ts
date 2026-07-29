// lib\pdf\template.ts
import { getContrastColor } from '@/lib/contrast'
import { formatCurrency as formatCurrencyBase } from '@/lib/format'
import { DEFAULT_CURRENCY } from '@/lib/currencies' 
import { detectUnitType, computeQuantity } from '@/lib/units' // 👈 nuevo

export function budgetPdfTemplate(
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
      watermarkOpacity?: number
      showPageNumbers?: boolean
      showWebsiteInPdf?: boolean
      showFooterBranding?: boolean
    }
  }
) {

  const tenant = opts?.tenant
  const watermarkOpacity = tenant?.watermarkOpacity ?? 0.06
  const pdfPrimary = tenant?.primaryColor ?? '#0F172A'
  const pdfHeaderText = getContrastColor(pdfPrimary)

  // 🌟 Moneda del presupuesto: la propia del budget, con fallback por si es un registro viejo
  const budgetCurrency = budget.currency ?? DEFAULT_CURRENCY
  const formatCurrency = (value: number) => formatCurrencyBase(value, budgetCurrency)

  const hasDiscount = Number(budget.discount ?? 0) > 0
  const hasTax = Number(budget.tax ?? 0) > 0
  const hasShipping = budget.shippingCost !== null && budget.shippingCost !== undefined
  const shippingValue = Number(budget.shippingCost ?? 0)

  // Logo arriba derecha (chico)
  const logo = opts?.logoDataUri ? `<img class="logo" src="${opts.logoDataUri}" alt="WebiBudgets" />` : ''

  // Marca de agua (logo grande, transparente)
  const watermark = opts?.watermarkDataUri ?? opts?.logoDataUri ?? ''

  // Helpers para mostrar textos lindos (por si viene "company"/"client")
  const installationResponsibleLabel =
    budget.installationResponsible === 'company'
      ? `A cargo de ${opts?.companyName || 'la empresa'}`
      : budget.installationResponsible === 'client'
        ? 'A cargo del cliente'
        : budget.installationResponsible || '—'

  // Normalizar detalles para evitar que rompa si no es un array nativo
  let safetyDetails: Array<{ title: string; value: string }> = []
  try {
    if (Array.isArray(budget.details)) {
      safetyDetails = budget.details
    } else if (typeof budget.details === 'string') {
      safetyDetails = JSON.parse(budget.details)
    }
  } catch (e) {
    console.error("Error parsing budget details for PDF", e)
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    /* ===== Base ===== */
    @page { margin: 26px 28px; }

    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #222;
      position: relative;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ===== Watermark ===== */
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
      background-size: 520px auto;
      opacity: ${watermarkOpacity};
      pointer-events: none;
      z-index: 0;
    }`
        : ''
    }

    /* ===== Layout wrappers ===== */
    .page { position: relative; z-index: 1; }

    /* ===== Header ===== */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 10px;
    }
    .header-left h1 { font-size: 22px; margin: 0 0 2px; }
    .muted { color: #666; font-size: 11px; margin: 0; }

    .logo {
      height: 56px;
      width: auto;
      object-fit: contain;
    }

    /* Two columns side-by-side for client/company */
    .two-columns {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .two-columns .box {
      flex: 1 1 0;
    }

    a { color: #0b63d6; text-decoration: none; }

    /* Footer / page numbers */
    .footer { position: fixed; bottom: 10px; left: 0; right: 0; font-size: 10px; color: #666; display: flex; justify-content: space-between; padding: 0 6px; }
    .page-num:after { content: 'Página ' counter(page) ' de ' counter(pages); }

    /* ===== Sections ===== */
    h2 {
      font-size: 14px;
      margin-top: 18px;
      margin-bottom: 6px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4px;
    }

    .box {
      border: 1px solid #ddd;
      padding: 10px;
      border-radius: 6px;
      background: transparent;
      margin-bottom: 6px;
    }

    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 8px;
      background: transparent;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      vertical-align: top;
    }

    th {
      background: rgba(0,0,0,0.04);
      text-align: left;
      font-size: 12px;
    }

    .right {
      text-align: right;
    }

    .total-row th {
      font-size: 13px;
      background: #efefef;
    }

    .small { font-size: 11px; }

    /* Evita cortes feos */
    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  </style>
</head>

<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <h1>Presupuesto</h1>
        <p class="muted">
          N° ${(budget.budgetNumber ?? 0).toString().padStart(6, '0')}
        </p>
        <p class="muted">Fecha: ${budget.createdAt ? new Date(budget.createdAt).toLocaleDateString('es-AR') : '—'}</p>
      </div>

      <div class="header-right">
        ${logo}
      </div>
    </div>

    <h2>Datos</h2>

    <div class="two-columns">
      <div class="box avoid-break">
        <strong>Cliente</strong><br />
        ${budget.client?.company ?? '—'}<br />
        Contacto: ${budget.client?.name ?? '—'}<br />
        Tel: ${budget.client?.phone || '—'}<br />
        Email: ${budget.client?.email || '—'}<br />
        Dirección: ${budget.client?.address || '—'}
      </div>

      <div class="box avoid-break">
        <strong>${tenant?.name ?? 'Empresa'}</strong><br />
        Tel: ${tenant?.phone || '—'}<br />
        Email: ${tenant?.email || '—'}<br />
        Dirección: ${tenant?.address || '—'}
        ${tenant?.website ? `<br/>Sitio: <a href="${tenant.website}">${tenant.website}</a>` : ''}
      </div>
    </div>

    <h2>Detalle del Presupuesto</h2>
    <table class="avoid-break">
      <thead style="background-color: ${pdfPrimary}; color: ${pdfHeaderText};">
        <tr>
          <th>Concepto</th>
          <th class="right">Cant.</th>
          <th class="right">Precio Unit.</th>
          <th class="right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${(budget.items ?? [])
        .map(
          (item: any) => {
            const conceptName = item.customName || item.productService?.name || '—'
            const conceptDescription = item.customName ? 'Ítem personalizado a medida' : (item.productService?.description || '')
            const conceptUnit = item.productService?.unit || 'un.'

            // 🌟 Descripción "cuánto por cuánto" de la calculadora (solo si hay medidas cargadas)
            const unitType = detectUnitType(conceptUnit)
            let calcBreakdown = ''
            if (unitType !== 'unit') {
              const calcResult = computeQuantity(conceptUnit, {
                a: item.widthCm ?? null,
                b: item.heightCm ?? null,
                c: item.depthCm ?? null,
                direct: unitType === 'time' ? (item.hours ?? null) : (item.direct ?? null),
              })
              if (calcResult.isComplete && calcResult.label) {
                calcBreakdown = calcResult.label
              }
            }

            return `
              <tr>
                <td>
                  <strong>${conceptName}</strong><br />
                  <span class="muted small">${conceptDescription}</span>
                </td>
                <td class="right">
                  ${item.quantity ?? 0} ${conceptUnit}
                  ${calcBreakdown ? `<br/><span class="muted small">${calcBreakdown}</span>` : ''}
                </td>
                <td class="right">${formatCurrency(Number(item.unitPrice ?? 0))}</td>
                <td class="right">${formatCurrency(Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0))}</td>
              </tr>
            `
          }
        )
        .join('')}
      </tbody>
    </table>

    <h2>Resumen</h2>
    <table class="avoid-break">
      <tbody>
        <tr>
          <td>Subtotal</td>
          <td class="right">${formatCurrency(Number(budget.subtotal ?? 0))}</td>
        </tr>

        ${
          hasDiscount
            ? `
        <tr>
          <td>Descuento</td>
          <td class="right">- ${formatCurrency(Number(budget.discount ?? 0))}</td>
        </tr>`
            : ''
        }

        ${
          hasTax
            ? `
        <tr>
          <td>Impuestos</td>
          <td class="right">+ ${formatCurrency(Number(budget.tax ?? 0))}</td>
        </tr>`
            : ''
        }

        ${
          hasShipping
            ? `
        <tr>
          <td>Envío</td>
          <td class="right">+ ${formatCurrency(shippingValue)}</td>
        </tr>`
            : ''
        }

        <tr class="total-row">
          <th>Total</th>
          <th class="right">${formatCurrency(Number(budget.total ?? 0))}</th>
        </tr>
      </tbody>
    </table>

    <h2>Datos de Trabajo / Instalación</h2>
    <div class="box avoid-break">
      Responsable: <strong>${installationResponsibleLabel}</strong><br />
      Personal de referencia: ${budget.installerReference || '—'}
    </div>

    ${
      budget.validUntil || budget.paymentTerms
        ? `
    <h2>Condiciones comerciales</h2>
    <div class="box avoid-break">
      ${budget.validUntil ? `Presupuesto válido hasta: <strong>${new Date(budget.validUntil).toLocaleDateString('es-AR')}</strong><br />` : ''}
      ${budget.paymentTerms ? `Condiciones de pago: <strong>${budget.paymentTerms}</strong>` : ''}
    </div>
    `
        : ''
    }

    ${
      safetyDetails.length > 0
        ? `<h2>Detalles adicionales</h2>` + 
          safetyDetails.map(
            (detail) => `
        <div class="box avoid-break">
          <strong>${detail.title}</strong>
          <br />
          ${detail.value}
        </div>
        `
          ).join('')
        : ''
    }

    ${
      budget.notes
        ? `
    <h2>Notas</h2>
    <div class="box avoid-break">
      ${budget.notes}
    </div>
    `
        : ''
    }
  </div>
  <div class="footer">
    <div>
      ${tenant?.showFooterBranding ? `<div class="text-xs">Generado con <span style="font-weight:600;font-size:11px;">budgets.webistudio.net</span></div>` : ''}
      ${tenant?.showWebsiteInPdf && tenant?.website ? `<div class="text-xs"><a href="${tenant.website}">${tenant.website}</a></div>` : ''}
    </div>
    ${tenant?.showPageNumbers ? `<div class="text-xs page-num"></div>` : ''}
  </div>
</body>
</html>
`
}