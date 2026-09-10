// lib\pdf\template-cantonera.ts
//
// Tercera plantilla de PDF para presupuestos ("Cantonera") — feature PRO.
// Misma firma que budgetPdfTemplate (lib/pdf/template.ts) para poder
// intercambiarlas desde renderBudgetPdf() sin tocar el resto del flujo.
// El contenido (cliente, ítems, cálculo de m²/hs, instalación, condiciones,
// notas, footer) es el mismo que la plantilla clásica — lo único que cambia
// es el tratamiento visual.
//
// Filosofía de diseño (a diferencia de "Contraste"): el color del tenant
// NUNCA pinta un fondo grande, porque el tenant lo elige libre y un bloque
// de fondo con un color mal elegido (rojo fuerte, verde lima) queda feo o
// rompe la legibilidad. Acá el color solo aparece como detalle puntual —
// una cantonera chica en la esquina, un filete bajo el título, el borde
// izquierdo de las tarjetas, la línea bajo el header de la tabla, y el
// número del Total — siempre sobre blanco. Por eso no hace falta calcular
// contraste en ningún lado (a diferencia de "Contraste", que sí lo necesita
// porque usa el color como fondo).
//
// Sin descripción de ítem de más ni firma no aplica acá — esta plantilla
// mantiene el mismo detalle que la clásica (incluye descripción de ítem y
// el desglose "cuánto por cuánto"); la única plantilla con contenido
// reducido es "Contraste", por pedido explícito para ese diseño puntual.

import { formatCurrency as formatCurrencyBase } from '@/lib/format'
import { DEFAULT_CURRENCY } from '@/lib/currencies'
import { detectUnitType, computeQuantity } from '@/lib/units'

export function budgetPdfTemplateCantonera(
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
      logoSize?: number
      showPageNumbers?: boolean
      showWebsiteInPdf?: boolean
      showFooterBranding?: boolean
    }
  }
) {
  const tenant = opts?.tenant
  const logoWidthPx = Math.round(34 * ((tenant?.logoSize ?? 100) / 100))
  const watermarkOpacity = tenant?.watermarkOpacity ?? 0.06
  const accent = tenant?.primaryColor ?? '#0F172A'

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
    console.error("Error parsing budget details for PDF (cantonera)", e)
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
      color: #1B1D22;
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
      background-size: 520px auto;
      opacity: ${watermarkOpacity};
      pointer-events: none;
      z-index: 0;
    }`
        : ''
    }

    .page { position: relative; z-index: 1; }

    /* Cantonera — triángulo chico en la esquina, técnica border-trick (sin
       transform/rotación) así el área queda acotada a un cuadrado de 34px
       en la punta y nunca puede invadir el título. Dos capas de seguridad:
       1) el header tiene padding-right propio (42px) para que el texto del
          título nunca entre en el cuadrado de 34px de la cantonera; y
       2) el header es un contexto de apilamiento propio (position:relative +
          z-index) que se pinta encima de la cantonera aunque algo falle en
          el cálculo de espacio de arriba. */
    .trim {
      position: absolute; top: 0; right: 0; width: 0; height: 0;
      border-style: solid; border-width: 34px 34px 0 0;
      border-color: ${accent} transparent transparent transparent;
      z-index: 0;
    }

    .header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
      margin-bottom: 6px; padding-right: 42px;
      position: relative; z-index: 1;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .logo { height: ${logoWidthPx}px; width: auto; object-fit: contain; }
    .brand-name { font-size: 13px; font-weight: bold; color: #171A21; }

    .title-block { text-align: right; }
    .title-block h1 { font-size: 24px; margin: 0; letter-spacing: -0.3px; color: #171A21; }
    .title-rule { height: 3px; width: 46px; background: ${accent}; margin: 6px 0 8px auto; border-radius: 2px; }
    .muted { color: #7A7F89; font-size: 11px; margin: 0; }

    .eyebrow {
      font-size: 9.5px; letter-spacing: 0.6px; text-transform: uppercase; font-weight: bold;
      color: ${accent}; margin: 22px 0 8px;
    }

    .two-columns { display: flex; gap: 12px; align-items: stretch; }
    .card {
      flex: 1 1 0; border: 1px solid #E7E8EC; border-left: 3px solid ${accent};
      border-radius: 6px; background: #FBFBFC; padding: 10px 13px;
    }
    .card .name { font-weight: bold; font-size: 12.5px; color: #181B21; margin-bottom: 3px; }
    .card .line { font-size: 11.5px; color: #666B75; line-height: 1.65; }

    a { color: #666B75; text-decoration: none; border-bottom: 1px solid #D8DAE0; }

    table { width: 100%; border-collapse: collapse; margin-top: 2px; }
    thead th {
      text-align: left; font-weight: bold; font-size: 9.5px; letter-spacing: 0.5px; text-transform: uppercase;
      color: #767B85; padding: 0 4px 9px; border-bottom: 2px solid ${accent};
    }
    thead th.right { text-align: right; }
    tbody td { padding: 10px 4px; font-size: 12px; color: #2B2E35; border-bottom: 1px solid #EDEEF1; vertical-align: top; }
    tbody tr:nth-child(even) td { background: #FAFAFB; }
    td.right { text-align: right; white-space: nowrap; }
    .item-desc { font-size: 11px; color: #8D919B; margin-top: 2px; }

    .summary { display: flex; justify-content: flex-end; margin-top: 12px; }
    .summary table { width: 270px; margin: 0; }
    .summary td { padding: 5px 4px; font-size: 12px; color: #4B4F57; border: none; }
    .summary .total td { border-top: 2px solid ${accent}; padding-top: 10px; font-weight: bold; font-size: 14.5px; color: #171A21; }
    .summary .total td.right { color: ${accent}; }

    .box { border: 1px solid #E7E8EC; border-left: 3px solid ${accent}; border-radius: 6px; background: #FBFBFC; padding: 10px 13px; font-size: 11.5px; color: #4B4F57; line-height: 1.7; margin-bottom: 6px; }
    .box b { color: #181B21; }

    .footer { position: fixed; bottom: 10px; left: 0; right: 0; font-size: 10px; color: #9297A2; display: flex; justify-content: space-between; padding: 0 6px; }
    .page-num:after { content: 'Página ' counter(page) ' de ' counter(pages); }
    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  </style>
</head>

<body>
  <div class="page">
    <div class="trim"></div>

    <div class="header">
      <div class="brand">
        ${logo}
        <div class="brand-name">${tenant?.name ?? 'Empresa'}</div>
      </div>
      <div class="title-block">
        <h1>Presupuesto</h1>
        <div class="title-rule"></div>
        <p class="muted">
          N° ${(budget.budgetNumber ?? 0).toString().padStart(6, '0')} ·
          Fecha: ${budget.createdAt ? new Date(budget.createdAt).toLocaleDateString('es-AR') : '—'}
        </p>
      </div>
    </div>

    <p class="eyebrow">Datos</p>
    <div class="two-columns avoid-break">
      <div class="card">
        <div class="name">${budget.client?.company ?? '—'}</div>
        <div class="line">Contacto: ${budget.client?.name ?? '—'}</div>
        <div class="line">Tel: ${budget.client?.phone || '—'}</div>
        <div class="line">Email: ${budget.client?.email || '—'}</div>
        <div class="line">Dirección: ${budget.client?.address || '—'}${budget.client?.city ? `, ${budget.client.city}` : ''}</div>
      </div>
      <div class="card">
        <div class="name">${tenant?.name ?? 'Empresa'}</div>
        <div class="line">Tel: ${tenant?.phone || '—'}</div>
        <div class="line">Email: ${tenant?.email || '—'}</div>
        <div class="line">Dirección: ${tenant?.address || '—'}</div>
        ${tenant?.website ? `<div class="line">Sitio: <a href="${tenant.website}">${tenant.website}</a></div>` : ''}
      </div>
    </div>

    <p class="eyebrow">Detalle del presupuesto</p>
    <table class="avoid-break">
      <thead>
        <tr>
          <th>Concepto</th>
          <th class="right">Cant.</th>
          <th class="right">Precio unit.</th>
          <th class="right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${(budget.items ?? [])
          .map((item: any) => {
            const conceptName = item.customName || item.productService?.name || '—'
            const conceptDescription = item.customName ? 'Ítem personalizado a medida' : (item.productService?.description || '')
            const conceptUnit = item.productService?.unit || 'un.'

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
                const pieces = Number(item.pieces) || 1
                calcBreakdown = pieces > 1
                  ? `${pieces} × ${calcResult.label} = ${item.quantity} ${conceptUnit}`
                  : calcResult.label
              }
            }

            return `
              <tr>
                <td>
                  <strong>${conceptName}</strong><br />
                  <span class="item-desc">${conceptDescription}</span>
                </td>
                <td class="right">
                  ${item.quantity ?? 0} ${conceptUnit}
                  ${calcBreakdown ? `<br/><span class="item-desc">${calcBreakdown}</span>` : ''}
                </td>
                <td class="right">${formatCurrency(Number(item.unitPrice ?? 0))}</td>
                <td class="right">${formatCurrency(Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0))}</td>
              </tr>
            `
          })
          .join('')}
      </tbody>
    </table>

    <div class="summary avoid-break">
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

        <tr class="total"><td>Total</td><td class="right">${formatCurrency(Number(budget.total ?? 0))}</td></tr>
      </table>
    </div>

    <p class="eyebrow">Datos de trabajo / instalación</p>
    <div class="box avoid-break">
      Responsable: <b>${installationResponsibleLabel}</b><br />
      Personal de referencia: ${budget.installerReference || '—'}
    </div>

    ${
      budget.validUntil || budget.paymentTerms
        ? `
    <p class="eyebrow">Condiciones comerciales</p>
    <div class="box avoid-break">
      ${budget.validUntil ? `Presupuesto válido hasta: <b>${new Date(budget.validUntil).toLocaleDateString('es-AR')}</b><br />` : ''}
      ${budget.paymentTerms ? `Condiciones de pago: <b>${budget.paymentTerms}</b>` : ''}
    </div>
    `
        : ''
    }

    ${
      safetyDetails.length > 0
        ? `<p class="eyebrow">Detalles adicionales</p>` +
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
    <p class="eyebrow">Notas</p>
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
