export function budgetPdfTemplate(
  budget: any,
  opts?: { logoDataUri?: string; watermarkDataUri?: string }
) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value)

  const hasDiscount = Number(budget.discount ?? 0) > 0
  const hasTax = Number(budget.tax ?? 0) > 0
  const hasShipping = budget.shippingCost !== null && budget.shippingCost !== undefined
  const shippingValue = Number(budget.shippingCost ?? 0)

  // ✅ Logo arriba derecha (chico)
  const logo = opts?.logoDataUri ? `<img class="logo" src="${opts.logoDataUri}" alt="Ecoservicios" />` : ''

  // ✅ Marca de agua (logo grande, transparente)
  // - Si no pasás watermarkDataUri, usa el mismo logo como watermark
  const watermark = opts?.watermarkDataUri ?? opts?.logoDataUri ?? ''

  // Helpers para mostrar textos lindos (por si viene "company"/"client")
  const installationResponsibleLabel =
    budget.installationResponsible === 'company'
      ? 'A cargo de Ecoservicios'
      : budget.installationResponsible === 'client'
        ? 'A cargo del cliente'
        : budget.installationResponsible || '—'

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
      opacity: 0.06;
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
        <p class="muted">N° ${budget.id?.slice(0, 6) ?? ''}</p>
        <p class="muted">Fecha: ${budget.createdAt ? new Date(budget.createdAt).toLocaleDateString('es-AR') : '—'}</p>
      </div>

      <div class="header-right">
        ${logo}
      </div>
    </div>

    <h2>Datos del Cliente</h2>
    <div class="box avoid-break">
      <strong>${budget.client?.company ?? '—'}</strong><br />
      Cliente: ${budget.client?.name ?? '—'}<br />
      Tel: ${budget.client?.phone || '—'}<br />
      Email: ${budget.client?.email || '—'}<br />
      Dirección: ${budget.client?.address || '—'}
    </div>

    <h2>Detalle del Presupuesto</h2>
    <table class="avoid-break">
      <thead>
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
            (item: any) => `
        <tr>
          <td>
            <strong>${item.productService?.name ?? '—'}</strong><br />
            <span class="muted small">${item.productService?.description || ''}</span>
          </td>
          <td class="right">${item.quantity ?? 0}</td>
          <td class="right">${formatCurrency(Number(item.unitPrice ?? 0))}</td>
          <td class="right">${formatCurrency(Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0))}</td>
        </tr>
      `
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

    <h2>Datos de la Instalación</h2>
    <div class="box avoid-break">
      Responsable de instalación: <strong>${installationResponsibleLabel}</strong><br />
      Instalador de referencia: ${budget.installerReference || '—'}
    </div>

    <h2>Datos del Lugar</h2>
    <div class="box avoid-break">
      ${budget.siteDetails || '—'}
    </div>

    ${
      budget.technicalDetails
        ? `
    <h2>Observaciones Técnicas</h2>
    <div class="box avoid-break">
      ${budget.technicalDetails}
    </div>
    `
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
</body>
</html>
`
}