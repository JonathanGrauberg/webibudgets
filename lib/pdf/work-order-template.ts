//lib\pdf\work-order-template.ts
import QRCode from 'qrcode'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  paused: 'Pausada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  voided: 'Anulada',
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

const PRIORITY_COLOR: Record<string, string> = {
  low: '#6b7280',
  medium: '#2563eb',
  high: '#d97706',
  urgent: '#dc2626',
}

export async function workOrderPdfTemplate(workOrder: any, opts: { logoDataUri?: string; tenant: any }) {
  const tenant = opts.tenant
  const isVoided = workOrder.status === 'voided'
  const budget = workOrder.budget
  const client = budget?.client

  // QR: prioriza la URL de ubicación cargada en la propia OT; si no hay, cae al código de verificación
  // 👇 antes: priorizaba locationUrl directo. Ahora SIEMPRE apunta a la página de verificación,
  // que exige login + mismo tenant antes de mostrar mapa, checklist o cualquier dato.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://budgets.webistudio.net'
  const qrText = `${baseUrl}/verify/work-order/${workOrder.id}`

  let qrDataUri = ''
  try {
    qrDataUri = await QRCode.toDataURL(qrText, { margin: 1, width: 110 })
  } catch (e) {
    console.error('QR generation failed:', e)
  }

  const materialsRows = (workOrder.materials ?? [])
    .map((m: any) => `
      <tr>
        <td>${m.customName || m.productService?.name || '—'}</td>
        <td class="right">${m.quantity} ${m.unit || ''}</td>
      </tr>
    `).join('')

  const tasksRows = (workOrder.tasks ?? [])
    .map((t: any) => `<li>${t.label}</li>`).join('')

  const toolsRows = (workOrder.tools ?? [])
    .map((t: any) => `
      <tr><td style="width:22px;text-align:center;">${t.checked ? '☑' : '☐'}</td><td>${t.label}</td></tr>
    `).join('')

  const checklistRows = (workOrder.checklist ?? [])
    .map((c: any) => `
      <tr><td style="width:22px;text-align:center;">${c.completed ? '☑' : '☐'}</td><td>${c.label}</td></tr>
    `).join('')

  const helpersNames = (workOrder.helpers ?? []).map((h: any) => h.user?.name).filter(Boolean).join(', ')

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<style>
  @page { margin: 16mm 15mm; }
  body { font-family: Arial, sans-serif; font-size: 11.5px; color: #1a1a1a; }
  .doc-frame { border: 1.5px solid #1a1a1a; }
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1.5px solid #1a1a1a; padding: 14px 16px; }
  .doc-title-box { text-align: right; }
  .doc-title-box h1 { font-size: 18px; margin: 0 0 4px; letter-spacing: 1px; }
  .doc-title-box .num { font-size: 14px; font-weight: bold; }
  .status-row { display: flex; gap: 6px; justify-content: flex-end; margin-top: 6px; }
  .badge { display:inline-block; font-size: 9.5px; padding: 2px 9px; border-radius: 10px; background: #eee; font-weight: 600; }
  .badge.priority { color: #fff; }
  .section { padding: 11px 16px; border-bottom: 1px solid #ddd; }
  .section:last-child { border-bottom: none; }
  .label { font-size: 9px; text-transform: uppercase; letter-spacing: .05em; color: #777; margin-bottom: 2px; }
  .value { font-size: 12px; font-weight: 500; }
  .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #555; font-weight: bold; margin-bottom: 8px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 5px 8px; font-size: 10.5px; }
  th { background: #f2f2f2; text-align: left; }
  .right { text-align: right; }
  ul.task-list { margin: 0; padding-left: 18px; }
  ul.task-list li { margin-bottom: 3px; font-size: 11px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .two-col > div { padding: 11px 16px; }
  .two-col > div:first-child { border-right: 1px solid #ddd; }
  .qr-block { display: flex; align-items: center; gap: 10px; }
  .qr-block p { font-size: 8.5px; color: #888; max-width: 150px; margin: 0; }
  .signatures { display: flex; justify-content: space-between; padding: 22px 16px 14px; }
  .sign-block { width: 45%; text-align: center; }
  .sign-line { border-top: 1px solid #1a1a1a; margin-bottom: 4px; padding-top: 26px; }
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
      <div>
        <h2 style="margin:0 0 4px;">${tenant?.name ?? 'Empresa'}</h2>
        ${tenant?.cuit ? `<p style="margin:1px 0;font-size:11px;color:#333;">CUIT: ${tenant.cuit}</p>` : ''}
        ${tenant?.phone ? `<p style="margin:1px 0;font-size:11px;color:#333;">Tel: ${tenant.phone}</p>` : ''}
      </div>
      <div class="doc-title-box">
        <h1>ORDEN DE TRABAJO</h1>
        <p class="num">N° ${String(workOrder.workOrderNumber).padStart(6, '0')}</p>
        <div class="status-row">
          <span class="badge">${STATUS_LABEL[workOrder.status] ?? workOrder.status}</span>
          <span class="badge priority" style="background:${PRIORITY_COLOR[workOrder.priority] || '#666'}">
            Prioridad: ${PRIORITY_LABEL[workOrder.priority] || workOrder.priority}
          </span>
        </div>
      </div>
    </div>

    <!-- Cliente + Fecha/Horario -->
    <div class="two-col">
      <div>
        <p class="section-title">Cliente</p>
        <p class="value">${client?.company || client?.name || '—'}</p>
        ${client?.name && client?.company ? `<p style="font-size:11px;color:#555;">Contacto: ${client.name}</p>` : ''}
        ${client?.phone ? `<p style="font-size:11px;color:#555;">Tel: ${client.phone}</p>` : ''}
        ${client?.email ? `<p style="font-size:11px;color:#555;">${client.email}</p>` : ''}
        <p style="font-size:11px;color:#555;margin-top:4px;">${client?.address || ''}${client?.city ? `, ${client.city}` : ''}${client?.province ? `, ${client.province}` : ''}</p>
      </div>
      <div>
        <p class="section-title">Fecha y horario</p>
        <p class="value">${workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Sin programar'}</p>
        ${(workOrder.scheduledTimeFrom || workOrder.scheduledTimeTo) ? `<p style="font-size:11px;color:#555;">${workOrder.scheduledTimeFrom || '—'} a ${workOrder.scheduledTimeTo || '—'} hs</p>` : ''}
        ${workOrder.estimatedHours ? `<p style="font-size:11px;color:#555;">Duración estimada: ${workOrder.estimatedHours} hs</p>` : ''}
        ${workOrder.branch ? `<p style="font-size:11px;color:#555;">Sucursal: ${workOrder.branch}</p>` : ''}
      </div>
    </div>

    ${workOrder.title || workOrder.description ? `
    <div class="section">
      ${workOrder.title ? `<p class="value" style="font-size:13px;">${workOrder.title}</p>` : ''}
      ${workOrder.description ? `<p style="font-size:11px;color:#444;margin-top:3px;">${workOrder.description}</p>` : ''}
    </div>` : ''}

    ${tasksRows ? `
    <div class="section">
      <p class="section-title">Trabajo a realizar</p>
      <ul class="task-list">${tasksRows}</ul>
    </div>` : ''}

    ${materialsRows ? `
    <div class="section">
      <p class="section-title">Materiales a llevar</p>
      <table>
        <thead><tr><th>Material</th><th class="right" style="width:100px;">Cantidad</th></tr></thead>
        <tbody>${materialsRows}</tbody>
      </table>
    </div>` : ''}

    ${toolsRows ? `
    <div class="two-col">
      <div>
        <p class="section-title">Herramientas</p>
        <table>${toolsRows}</table>
      </div>
      <div>
        <p class="section-title">Personal asignado</p>
        <p class="label">Responsable</p>
        <p class="value">${workOrder.assignedToUser?.name || '—'}</p>
        ${helpersNames ? `<p class="label" style="margin-top:8px;">Ayudantes</p><p class="value">${helpersNames}</p>` : ''}
      </div>
    </div>` : `
    <div class="section">
      <p class="section-title">Personal asignado</p>
      <div class="grid-2">
        <div><p class="label">Responsable</p><p class="value">${workOrder.assignedToUser?.name || '—'}</p></div>
        ${helpersNames ? `<div><p class="label">Ayudantes</p><p class="value">${helpersNames}</p></div>` : ''}
      </div>
    </div>`}

    ${checklistRows ? `
    <div class="section">
      <p class="section-title">Checklist de ejecución</p>
      <table>${checklistRows}</table>
    </div>` : ''}

    ${workOrder.notes ? `
    <div class="section">
      <p class="section-title">Observaciones para el técnico</p>
      <p style="font-size:11px;">${workOrder.notes}</p>
    </div>` : ''}

    <div class="section" style="display:flex; justify-content:space-between; align-items:center;">
      <div class="qr-block">
        ${qrDataUri ? `<img src="${qrDataUri}" width="65" height="65" alt="QR" />` : ''}
        <p>Escaneá para ver ubicación, checklist y detalles (requiere iniciar sesión)</p>
      </div>
      <div style="text-align:right;font-size:9px;color:#888;">
        Presupuesto N° ${String(budget?.budgetNumber ?? 0).padStart(6, '0')}<br/>
        Creada: ${new Date(workOrder.createdAt).toLocaleDateString('es-AR')}
      </div>
    </div>

    <div class="signatures">
      <div class="sign-block"><div class="sign-line"></div><p style="font-size:10px;">Técnico — Firma y hora</p></div>
      <div class="sign-block"><div class="sign-line"></div><p style="font-size:10px;">Cliente conforme — Firma y hora</p></div>
    </div>
  </div>
</body>
</html>
`
}