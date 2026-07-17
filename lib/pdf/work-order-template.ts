export async function workOrderPdfTemplate(workOrder: any, opts: { logoDataUri?: string; tenant: any }) {
  const tenant = opts.tenant
  const isVoided = workOrder.status === 'voided' // 👈 nuevo
  const budget = workOrder.budget
  const client = budget?.client

  const STATUS_LABEL: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En curso',
    paused: 'Pausada', // 👈 nuevo
    completed: 'Completada',
    cancelled: 'Cancelada',
    voided: 'Anulada', // 👈 nuevo
  }

  const checklistHtml = (workOrder.checklist ?? [])
    .map((item: any) => `
      <tr>
        <td style="width:24px;text-align:center;">${item.completed ? '☑' : '☐'}</td>
        <td>${item.label}</td>
      </tr>
    `).join('')

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
  .status-badge { display:inline-block; font-size:10px; padding:2px 8px; border-radius:10px; background:#eee; margin-top:4px; }
  .section { padding: 12px 16px; border-bottom: 1px solid #ddd; }
  .section:last-child { border-bottom: none; }
  .label { font-size: 9px; text-transform: uppercase; letter-spacing: .05em; color: #777; margin-bottom: 2px; }
  .value { font-size: 12px; font-weight: 500; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px 16px; }
  table { width: 100%; border-collapse: collapse; }
  td { border: 1px solid #ddd; padding: 6px 8px; font-size: 11px; }
  .signatures { display: flex; justify-content: space-between; padding: 24px 16px 16px; }
  .sign-block { width: 45%; text-align: center; }
  .sign-line { border-top: 1px solid #1a1a1a; margin-bottom: 4px; padding-top: 30px; }
</style>
</head>
<body>
 ${isVoided ? `<div class="voided-stamp">ANULADO</div>` : ''}
  <div class="doc-frame">
    <div class="doc-header">
      <div>
        <h2 style="margin:0 0 4px;">${tenant?.name ?? 'Empresa'}</h2>
        ${tenant?.cuit ? `<p style="margin:1px 0;font-size:11px;color:#333;">CUIT: ${tenant.cuit}</p>` : ''}
      </div>
      <div class="doc-title-box">
        <h1>ORDEN DE TRABAJO</h1>
        <p class="num">N° ${String(workOrder.workOrderNumber).padStart(6, '0')}</p>
        <span class="status-badge">${STATUS_LABEL[workOrder.status] ?? workOrder.status}</span>
      </div>
    </div>

    <div class="section">
      <p class="label">Cliente</p>
      <p class="value">${client?.company || client?.name || '—'}</p>
    </div>

    <div class="section">
      <p class="label" style="margin-bottom:6px;">Datos generales</p>
      <div class="grid-4">
        <div><p class="label">Técnico</p><p class="value">${workOrder.assignedToUser?.name || '—'}</p></div>
        <div><p class="label">Fecha programada</p><p class="value">${workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toLocaleDateString('es-AR') : '—'}</p></div>
        <div><p class="label">Hs. estimadas</p><p class="value">${workOrder.estimatedHours ?? '—'}</p></div>
        <div><p class="label">Hs. reales</p><p class="value">${workOrder.actualHours ?? '—'}</p></div>
      </div>
    </div>

    ${workOrder.description ? `
    <div class="section">
      <p class="label">Descripción del trabajo</p>
      <p style="font-size:11px;">${workOrder.description}</p>
    </div>` : ''}

    <div class="section">
      <p class="label" style="margin-bottom:6px;">Checklist</p>
      <table>${checklistHtml || '<tr><td>Sin ítems de checklist</td></tr>'}</table>
    </div>

    ${workOrder.notes ? `
    <div class="section">
      <p class="label">Observaciones</p>
      <p style="font-size:11px;">${workOrder.notes}</p>
    </div>` : ''}

    ${workOrder.status === 'paused' && workOrder.pauseReason ? `
    <div class="section">
      <p class="label">Motivo de la pausa</p>
      <p style="font-size:11px;">${workOrder.pauseReason}</p>
    </div>` : ''}

    <div class="signatures">
      <div class="sign-block"><div class="sign-line"></div><p style="font-size:10px;">Técnico</p></div>
      <div class="sign-block"><div class="sign-line"></div><p style="font-size:10px;">Cliente / conformidad</p></div>
    </div>
  </div>
</body>
</html>
`
}