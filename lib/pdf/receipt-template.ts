import { formatCurrency as formatCurrencyBase } from '@/lib/format'
import { DEFAULT_CURRENCY } from '@/lib/currencies'
import { pdfBaseStyles } from './shared'

export function receiptPdfTemplate(
  budget: any,
  opts?: { logoDataUri?: string; watermarkDataUri?: string; companyName?: string; tenant?: any }
) {
  const tenant = opts?.tenant
  const watermarkOpacity = tenant?.watermarkOpacity ?? 0.06
  const pdfPrimary = tenant?.primaryColor ?? '#0F172A'
  const budgetCurrency = budget.currency ?? DEFAULT_CURRENCY
  const formatCurrency = (value: number) => formatCurrencyBase(value, budgetCurrency)
  const watermark = opts?.watermarkDataUri ?? opts?.logoDataUri ?? ''
  const logo = opts?.logoDataUri ? `<img class="logo" src="${opts.logoDataUri}" alt="logo" />` : ''
  const budgetNumber = (budget.budgetNumber ?? 0).toString().padStart(6, '0')

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
        <h1>Recibo</h1>
        <p class="muted">Presupuesto N° ${budgetNumber}</p>
        <p class="muted">Fecha: ${new Date().toLocaleDateString('es-AR')}</p>
      </div>
      <div class="header-right">${logo}</div>
    </div>

    <div class="two-columns">
      <div class="box avoid-break">
        <strong>Recibí de</strong><br />
        ${budget.client?.company ?? '—'}<br />
        Contacto: ${budget.client?.name ?? '—'}<br />
        Dirección: ${budget.client?.address || '—'}
      </div>
      <div class="box avoid-break">
        <strong>${tenant?.name ?? 'Empresa'}</strong><br />
        Tel: ${tenant?.phone || '—'}<br />
        Email: ${tenant?.email || '—'}
      </div>
    </div>

    <h2>Detalle</h2>
    <table class="avoid-break">
      <tbody>
        <tr>
          <td>Concepto</td>
          <td class="right">Presupuesto N° ${budgetNumber}</td>
        </tr>
        <tr class="total-row">
          <th>Total recibido</th>
          <th class="right">${formatCurrency(Number(budget.total ?? 0))}</th>
        </tr>
      </tbody>
    </table>

    <div class="signature-line">Firma y aclaración</div>
  </div>
  <div class="footer">
    <div>${tenant?.showFooterBranding ? `<div class="text-xs">Generado en .budgets.webistudio.net</div>` : ''}</div>
    ${tenant?.showPageNumbers ? `<div class="text-xs page-num"></div>` : ''}
  </div>
</body>
</html>
`
}