import { prisma } from '@/lib/prisma'
import { tenantWhereId } from '@/lib/tenant'

const FALLBACK_LOGO_URL = "https://budgets.webistudio.net/placeholder-logo.png"
const FALLBACK_WATERMARK_URL = "https://budgets.webistudio.net/watermark.png"

export async function loadBudgetForPdf(tenantId: string, id: string) {
  const budget = await prisma.budget.findFirst({
    where: tenantWhereId(id, tenantId),
    include: {
      client: true,
      tenant: true,
      items: { include: { productService: true } },
    },
  })

  if (!budget) return null

  const isTrial = budget.tenant?.plan === "free" || budget.tenant?.plan === "starter"

  let logoDataUri: string | undefined
  if (budget.tenant?.logoUrl) {
    try {
      const res = await fetch(budget.tenant.logoUrl)
      const arrayBuffer = await res.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString("base64")
      const contentType = res.headers.get("content-type") || "image/png"
      logoDataUri = `data:${contentType};base64,${base64}`
    } catch (e) {
      console.error("Error loading tenant logo:", e)
    }
  }
  if (!logoDataUri) {
    try {
      const res = await fetch(FALLBACK_LOGO_URL)
      const arrayBuffer = await res.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString("base64")
      logoDataUri = `data:image/png;base64,${base64}`
    } catch (e) {
      console.error("Error loading fallback logo via fetch:", e)
      logoDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
  }

  let watermarkDataUri: string | undefined
  if (budget.tenant?.watermarkUrl) {
    try {
      const res = await fetch(budget.tenant.watermarkUrl)
      const arrayBuffer = await res.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString("base64")
      const contentType = res.headers.get("content-type") || "image/png"
      watermarkDataUri = `data:${contentType};base64,${base64}`
    } catch (e) {
      console.error("Error loading tenant watermark:", e)
    }
  }
  if (!watermarkDataUri && isTrial) {
    try {
      const res = await fetch(FALLBACK_WATERMARK_URL)
      const arrayBuffer = await res.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString("base64")
      watermarkDataUri = `data:image/png;base64,${base64}`
    } catch (e) {
      console.error("Error loading fallback watermark via fetch:", e)
    }
  }

  const tenantForTemplate = budget.tenant
    ? {
        name: budget.tenant.name ?? undefined,
        phone: budget.tenant.phone ?? undefined,
        email: budget.tenant.email ?? undefined,
        address: budget.tenant.address ?? undefined,
        website: budget.tenant.website ?? undefined,
        primaryColor: (budget.tenant as any).primaryColor ?? undefined,
        watermarkOpacity: (budget.tenant as any).watermarkOpacity ?? undefined,
        showPageNumbers: (budget.tenant as any).showPageNumbers ?? undefined,
        showWebsiteInPdf: (budget.tenant as any).showWebsiteInPdf ?? undefined,
        showFooterBranding: (budget.tenant as any).showFooterBranding ?? undefined,
        features: (budget.tenant as any).features ?? undefined, // 👈 para chequear el feature 'vouchers' en las rutas
      }
    : undefined

  return {
    budget,
    isTrial,
    logoDataUri,
    watermarkDataUri,
    tenantForTemplate,
    companyName: budget.tenant?.name ?? undefined,
  }
}

export function buildPdfFileName(budget: any, suffix: string) {
  const clientName = budget.client?.name || ""
  const clientLastName = budget.client?.lastName || ""
  const budgetNumber = String(budget.budgetNumber ?? 0).padStart(6, '0')
  const safeName = `${clientName} ${clientLastName}`
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]/g, "")
    .toLowerCase() || "cliente"
  return `${safeName}_${suffix}_${budgetNumber}.pdf`
}

// 🌟 CSS común extraído de lib/pdf/template.ts — reusado por los 3 templates nuevos.
// template.ts sigue con su copia inline propia por ahora (no la tocamos para no arriesgar
// el PDF de presupuesto que ya está en producción); si querés, en otro momento lo migramos
// también para que las 4 plantillas compartan una sola fuente de estilos.
export function pdfBaseStyles(watermark: string | undefined, watermarkOpacity: number) {
  return `
    @page { margin: 26px 28px; }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #222;
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
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 10px; }
    .header-left h1 { font-size: 22px; margin: 0 0 2px; }
    .muted { color: #666; font-size: 11px; margin: 0; }
    .logo { height: 56px; width: auto; object-fit: contain; }
    .two-columns { display: flex; gap: 12px; align-items: flex-start; }
    .two-columns .box { flex: 1 1 0; }
    a { color: #0b63d6; text-decoration: none; }
    .footer { position: fixed; bottom: 10px; left: 0; right: 0; font-size: 10px; color: #666; display: flex; justify-content: space-between; padding: 0 6px; }
    .page-num:after { content: 'Página ' counter(page) ' de ' counter(pages); }
    h2 { font-size: 14px; margin-top: 18px; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .box { border: 1px solid #ddd; padding: 10px; border-radius: 6px; background: transparent; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; background: transparent; }
    th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
    th { background: rgba(0,0,0,0.04); text-align: left; font-size: 12px; }
    .right { text-align: right; }
    .total-row th { font-size: 13px; background: #efefef; }
    .small { font-size: 11px; }
    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
    .signature-line { margin-top: 60px; border-top: 1px solid #333; width: 260px; padding-top: 6px; font-size: 11px; color: #444; }
  `
}