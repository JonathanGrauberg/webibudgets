//lib\pdf\delivery-note-template.ts
import { pdfBaseStyles } from './shared'

export function deliveryNotePdfTemplate(
  budget: any,
  opts?: { logoDataUri?: string; watermarkDataUri?: string; companyName?: string; tenant?: any }
) {
  const tenant = opts?.tenant
  const watermarkOpacity = tenant?.watermarkOpacity ?? 0.06
  const pdfPrimary = tenant?.primaryColor ?? '#0F172A'
  const watermark = opts?.watermarkDataUri ?? opts?.logoDataUri ?? ''
  const logo = opts?.logoDataUri ? `<img class="logo" src="${opts.logoDataUri}" alt="logo" />` : ''

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>${pdfBaseStyles(watermark, watermarkOpacity)}</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <h1>Remito</h1>
        <p class="muted">Presupuesto N° ${(budget.budgetNumber ?? 0).toString().padStart(6, '0')}</p>
        <p class="muted">Fecha: ${new Date().toLocaleDateString('es-AR')}</p>
      </div>
      <div class="header-right">${logo}</div>
    </div>

    <div class="box avoid-break">
      <strong>Entregar a</strong><br />
      ${budget.client?.company ?? '—'}<br />
      Contacto: ${budget.client?.name ?? '—'}<br />
      Dirección: ${budget.client?.address || '—'}
    </div>

    <h2>Detalle de entrega</h2>
    <table class="avoid-break">
      <thead style="background-color: ${pdfPrimary}; color: #fff;">
        <tr><th>Descripción</th><th class="right">Cantidad</th></tr>
      </thead>
      <tbody>
        ${(budget.items ?? [])
          .map((item: any) => {
            const name = item.customName || item.productService?.name || '—'
            const unit = item.productService?.unit || 'un.'
            return `<tr><td>${name}</td><td class="right">${item.quantity ?? 0} ${unit}</td></tr>`
          })
          .join('')}
      </tbody>
    </table>

    <div class="signature-line">Recibí conforme</div>
  </div>
</body>
</html>
`
}