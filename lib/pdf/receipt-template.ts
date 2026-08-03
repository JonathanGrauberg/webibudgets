//lib\pdf\receipt-template.ts
import { formatCurrency as formatCurrencyBase } from '@/lib/format'
import QRCode from 'qrcode'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia bancaria',
  cheque: 'Cheque',
  tarjeta: 'Tarjeta',
  mercado_pago: 'Mercado Pago',
  otro: 'Otro',
}

export async function receiptPdfTemplate(receipt: any, opts: { logoDataUri?: string; tenant: any }) {
  const tenant = opts.tenant
  const formatCurrency = (v: number) => formatCurrencyBase(v, receipt.currency)
  const isVoided = receipt.status === 'voided'
  const receiptNumberLabel = String(receipt.receiptNumber).padStart(8, '0')

  const qrText = [
    `RECIBO N° ${receiptNumberLabel}`,
    tenant?.name ?? '',
    tenant?.cuit ? `CUIT ${tenant.cuit}` : '',
    `Monto: ${formatCurrency(receipt.amount)}`,
    `Fecha: ${new Date(receipt.issueDate).toLocaleDateString('es-AR')}`,
  ].filter(Boolean).join(' | ')

  let qrDataUri = ''
  try {
    qrDataUri = await QRCode.toDataURL(qrText, { margin: 1, width: 120 })
  } catch (e) {
    console.error('QR generation failed:', e)
  }

  const client = receipt.budget?.client ?? receipt.client // 👈 antes: solo receipt.budget?.client

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<style>
  @page { margin: 18mm 16mm; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; }
  .doc-frame { border: 1.5px solid #1a1a1a; }
  .doc-header { display: flex; justify-content: space-between; border-bottom: 1.5px solid #1a1a1a; padding: 14px 16px; }
  .doc-title-box { text-align: right; border-left: 1.5px solid #1a1a1a; padding-left: 16px; min-width: 180px; }
  .doc-title-box h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: 1px; }
  .doc-title-box .num { font-size: 15px; font-weight: bold; }
  .issuer h2 { font-size: 15px; margin: 0 0 4px; }
  .issuer p { margin: 1px 0; font-size: 11px; color: #333; }
  .section { padding: 12px 16px; border-bottom: 1px solid #ddd; }
  .section:last-child { border-bottom: none; }
  .label { font-size: 9px; text-transform: uppercase; letter-spacing: .05em; color: #777; margin-bottom: 2px; }
  .value { font-size: 12px; font-weight: 500; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px 20px; }
  .amount-box { text-align: center; padding: 18px; background: #f7f7f7; }
  .amount-box .amount { font-size: 28px; font-weight: bold; }
  .amount-box .concept { font-size: 11px; color: #555; margin-top: 4px; }
  .signatures { display: flex; justify-content: space-between; padding: 24px 16px 16px; }
  .sign-block { width: 45%; text-align: center; }
  .sign-line { border-top: 1px solid #1a1a1a; margin-bottom: 4px; padding-top: 30px; }
  .qr-block { display: flex; align-items: center; gap: 10px; }
  .voided-stamp {
    position: fixed; top: 40%; left: 15%; transform: rotate(-18deg);
    font-size: 60px; font-weight: bold; color: rgba(200,0,0,0.35);
    border: 6px solid rgba(200,0,0,0.35); padding: 6px 24px; z-index: 5;
  }
</style>
</head>
<body>
  ${isVoided ? `<div class="voided-stamp">ANULADO</div>` : ''}
  <div class="doc-frame">
    <div class="doc-header">
      <div class="issuer">
        <h2>${tenant?.name ?? 'Empresa'}</h2>
        ${tenant?.cuit ? `<p>CUIT: ${tenant.cuit}</p>` : ''}
        ${tenant?.condicionIva ? `<p>${tenant.condicionIva}</p>` : ''}
        ${tenant?.address ? `<p>${tenant.address}</p>` : ''}
        ${tenant?.phone ? `<p>Tel: ${tenant.phone}</p>` : ''}
      </div>
      <div class="doc-title-box">
        <h1>RECIBO</h1>
        <p class="num">N° ${receiptNumberLabel}</p>
        <p style="font-size:11px;margin-top:6px;">${new Date(receipt.issueDate).toLocaleDateString('es-AR')}</p>
        ${receipt.issuePlace ? `<p style="font-size:10px;color:#666;">${receipt.issuePlace}</p>` : ''}
      </div>
    </div>

    <div class="section">
      <p class="label">Recibí de</p>
      <div class="grid-2">
        <div>
          <p class="value">${client?.company || client?.name || '—'}</p>
          <p style="font-size:11px;color:#555;">${client?.name ?? ''}</p>
        </div>
        <div>
          <p class="label">CUIT / DNI</p>
          <p class="value">${client?.cuit || client?.dni || '—'}</p>
        </div>
      </div>
    </div>

    <div class="amount-box">
      <div class="amount">${formatCurrency(receipt.amount)}</div>
      <div class="concept">${receipt.concept}</div>
    </div>

    <div class="section">
      <div class="grid-3">
        <div>
          <p class="label">Medio de pago</p>
          <p class="value">${PAYMENT_METHOD_LABELS[receipt.paymentMethod] ?? receipt.paymentMethod}</p>
        </div>
        <div>
          <p class="label">N° de operación</p>
          <p class="value">${receipt.paymentReference || '—'}</p>
        </div>
        <div>
          <p class="label">Saldo pendiente</p>
          <p class="value">${receipt.pendingBalance != null ? formatCurrency(receipt.pendingBalance) : '—'}</p>
        </div>
      </div>
    </div>

    ${receipt.notes ? `
    <div class="section">
      <p class="label">Observaciones</p>
      <p style="font-size:11px;">${receipt.notes}</p>
    </div>` : ''}

    <div class="section" style="display:flex; justify-content:space-between; align-items:center;">
      <div class="qr-block">
        ${qrDataUri ? `<img src="${qrDataUri}" width="70" height="70" alt="QR" />` : ''}
        <p style="font-size:9px;color:#888;max-width:160px;">Código de verificación del recibo</p>
      </div>
      <div style="text-align:right;font-size:9px;color:#888;">
        ${receipt.registeredByUser?.name ? `Registrado por: ${receipt.registeredByUser.name}<br/>` : ''}
        ${receipt.branch ? `Sucursal: ${receipt.branch}<br/>` : ''}
        ${receipt.cashRegister ? `Caja: ${receipt.cashRegister}` : ''}
      </div>
    </div>

    <div class="signatures">
      <div class="sign-block">
        <div class="sign-line"></div>
        <p style="font-size:10px;">Firma del receptor</p>
      </div>
      <div class="sign-block">
        <div class="sign-line"></div>
        <p style="font-size:10px;">Firma del cliente (aclaración)</p>
      </div>
    </div>
  </div>
</body>
</html>
`
}