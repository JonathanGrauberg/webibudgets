export const runtime = "nodejs"
export const maxDuration = 60
//app\api\public\budgets\[token]\pdf\route.ts
//
// Sin login — versión pública de app/api/budgets/[id]/pdf/route.ts, misma
// lógica de armado del PDF, solo que busca por publicToken en vez de por
// sesión/tenant.
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { renderBudgetPdf } from "@/lib/pdf/render-budget-pdf"
import { generatePdf } from "@/lib/pdf/generator"
import { PDFDocument } from 'pdf-lib'

const FALLBACK_LOGO_URL = "https://budgets.webistudio.net/placeholder-logo.png"
const FALLBACK_WATERMARK_URL = "https://budgets.webistudio.net/watermark.png"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const budget = await prisma.budget.findUnique({
      where: { publicToken: token },
      include: {
        client: true,
        tenant: true,
        items: { include: { productService: true } },
      },
    })

    if (!budget || !budget.active) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

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
          secondaryColor: (budget.tenant as any).secondaryColor ?? undefined,
          accentColor: (budget.tenant as any).accentColor ?? undefined,
          watermarkOpacity: (budget.tenant as any).watermarkOpacity ?? undefined,
          logoSize: (budget.tenant as any).logoSize ?? undefined,
          showPageNumbers: (budget.tenant as any).showPageNumbers ?? undefined,
          showWebsiteInPdf: (budget.tenant as any).showWebsiteInPdf ?? undefined,
          showFooterBranding: (budget.tenant as any).showFooterBranding ?? undefined,
          pdfTemplate: (budget.tenant as any).pdfTemplate ?? undefined,
          pdfTemplateDark: (budget.tenant as any).pdfTemplateDark ?? undefined,
        }
      : undefined

    const html = renderBudgetPdf(budget, {
      logoDataUri,
      ...(watermarkDataUri && { watermarkDataUri }),
      isTrial,
      tenant: tenantForTemplate,
      companyName: budget.tenant?.name ?? undefined,
    })

    const pdfUint8 = await generatePdf(html)
    let buffer = Buffer.from(pdfUint8)

    if (budget.attachConditionsPdf && budget.tenant?.conditionsPdfUrl) {
      try {
        const finalPdf = await PDFDocument.create()
        const mainPdf = await PDFDocument.load(buffer)
        const mainPages = await finalPdf.copyPages(mainPdf, mainPdf.getPageIndices())
        mainPages.forEach((p) => finalPdf.addPage(p))

        const base64Data = budget.tenant.conditionsPdfUrl.split(',')[1]
        const conditionsBytes = Buffer.from(base64Data, 'base64')
        const conditionsPdf = await PDFDocument.load(conditionsBytes)
        const conditionsPages = await finalPdf.copyPages(conditionsPdf, conditionsPdf.getPageIndices())
        conditionsPages.forEach((p) => finalPdf.addPage(p))

        buffer = Buffer.from(await finalPdf.save())
      } catch (e) {
        console.error('Error merging conditions PDF, se envía solo el presupuesto:', e)
      }
    }

    const clientName = budget.client?.name || ""
    const clientLastName = budget.client?.lastName || ""
    const budgetNumber = String(budget.budgetNumber ?? 0).padStart(6, '0')
    const version = (budget.revisionNumber ?? 0) + 1
    const versionSuffix = version > 1 ? `_v${version}` : ''

    const safeName = `${clientName} ${clientLastName}`
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "")
      .toLowerCase() || "cliente"

    const fileName = `${safeName}_pto_${budgetNumber}${versionSuffix}.pdf`

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Surrogate-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Public PDF error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
