import QRCode from 'qrcode'

export async function deliveryNotePdfTemplate(deliveryNote: any, opts: { logoDataUri?: string; tenant: any }) {
  const tenant = opts.tenant
  const isVoided = deliveryNote.status === 'voided'
  const deliveryNumberLabel = String(deliveryNote.deliveryNumber).padStart(8, '0')
  const budget = deliveryNote.budget
  const client = budget?.client

  const qrText = [
    `REMITO N° ${deliveryNumberLabel}`,
    tenant?.name ?? '',
    tenant?.cuit ? `CUIT ${tenant.cuit}` : '',
    `Fecha: ${new Date(deliveryNote.issueDate).toLocaleDateString('es-AR')}`,
  ].filter(Boolean).join(' | ')

  let qrDataUri = ''
  try {
    qrDataUri = await QRCode.toDataURL(qrText, { margin: 1, width: 120 })
  } catch (e) {
    console.error('QR generation failed:', e)
  }

  const hasTransport = deliveryNote.vehicle || deliveryNote.driverName || deliveryNote.licensePlate || deliveryNote.carrierCompany

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
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 7px 8px; font-size: 11px; }
  th { background: #f2f2f2; text-align: left; }
  .right { text-align: right; }
  .signatures { display: flex; justify-content: space-between; padding: 24px 16px 16px; }
  .sign-block { width: 45%; text-align: center; }
  .sign-line { border-top: 1px solid #1a1a1a; margin-bottom: 4px; padding-top: 30px; }
  .qr-block { display: flex; align-items: center; gap: 10px; }
  .no-price-note { font-size: 9px; color: #999; text-align: center; padding: 4px; font-style: italic; }
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
        ${tenant?.address ? `<p>${tenant.address}</p>` : ''}
        ${tenant?.phone ? `<p>Tel: ${tenant.phone}</p>` : ''}
      </div>
      <div class="doc-title-box">
        <h1>REMITO</h1>
        <p class="num">N° ${deliveryNumberLabel}</p>
        <p style="font-size:11px;margin-top:6px;">${new Date(deliveryNote.issueDate).toLocaleDateString('es-AR')}</p>
      </div>
    </div>

    <div class="section">
      <p class="label">Entregar a</p>
      <div class="grid-2">
        <div>
          <p class="value">${client?.company || client?.name || '—'}</p>
          <p style="font-size:11px;color:#555;">${client?.address || ''}</p>
        </div>
        <div>
          <p class="label">CUIT / DNI</p>
          <p class="value">${client?.cuit || client?.dni || '—'}</p>
        </div>
      </div>
    </div>

    <div class="section">
      <p class="label" style="margin-bottom:6px;">Detalle de entrega</p>
      <table>
        <thead>
          <tr><th>Descripción</th><th class="right" style="width:120px;">Cantidad</th></tr>
        </thead>
        <tbody>
          ${(budget?.items ?? [])
            .map((item: any) => {
              const name = item.customName || item.productService?.name || '—'
              const unit = item.productService?.unit || 'un.'
              return `<tr><td>${name}</td><td class="right">${item.quantity ?? 0} ${unit}</td></tr>`
            })
            .join('')}
        </tbody>
      </table>
      <p class="no-price-note">Este documento no incluye precios y no reemplaza una factura.</p>
    </div>

    ${hasTransport ? `
    <div class="section">
      <p class="label" style="margin-bottom:6px;">Transporte</p>
      <div class="grid-4">
        <div><p class="label">Vehículo</p><p class="value">${deliveryNote.vehicle || '—'}</p></div>
        <div><p class="label">Chofer</p><p class="value">${deliveryNote.driverName || '—'}</p></div>
        <div><p class="label">Patente</p><p class="value">${deliveryNote.licensePlate || '—'}</p></div>
        <div><p class="label">Transportista</p><p class="value">${deliveryNote.carrierCompany || '—'}</p></div>
      </div>
    </div>` : ''}

    ${deliveryNote.notes ? `
    <div class="section">
      <p class="label">Observaciones</p>
      <p style="font-size:11px;">${deliveryNote.notes}</p>
    </div>` : ''}

    <div class="section" style="display:flex; justify-content:space-between; align-items:center;">
      <div class="qr-block">
        ${qrDataUri ? `<img src="${qrDataUri}" width="70" height="70" alt="QR" />` : ''}
        <p style="font-size:9px;color:#888;max-width:160px;">Código de verificación del remito</p>
      </div>
      <div style="text-align:right;font-size:9px;color:#888;">
        Recibido por: ${deliveryNote.receivedByName || '________________'}<br/>
        DNI: ${deliveryNote.receivedByDni || '________________'}
      </div>
    </div>

    <div class="signatures">
      <div class="sign-block">
        <div class="sign-line"></div>
        <p style="font-size:10px;">Firma de quien entrega</p>
      </div>
      <div class="sign-block">
        <div class="sign-line"></div>
        <p style="font-size:10px;">Recibí conforme (firma y aclaración)</p>
      </div>
    </div>
  </div>
</body>
</html>
`
}