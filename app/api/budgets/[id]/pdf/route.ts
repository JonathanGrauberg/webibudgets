export const runtime = "nodejs"
export const maxDuration = 60
// app\api\budgets\[id]\pdf\route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'
import { budgetPdfTemplate } from "@/lib/pdf/template"
import { generatePdf } from "@/lib/pdf/generator"

const FALLBACK_LOGO_URL = "https://budgets.webistudio.net/placeholder-logo.png"
const FALLBACK_WATERMARK_URL = "https://budgets.webistudio.net/watermark.png"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params

    const budget = await prisma.budget.findFirst({
      where: tenantWhereId(id, tenantId),
      include: {
        client: true,
        tenant: true,
        items: {
          include: {
            productService: true,
          },
        },
      },
    })

    if (!budget) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    /* ========================
       Trial check
    ======================== */
    const isTrial = budget.tenant?.plan === "free" || budget.tenant?.plan === "starter"

    /* ========================
       LOGO dinámico
    ======================== */
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

    /* ========================
       WATERMARK solo trial
    ======================== */
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

    /* ========================
       HTML Generation
    ======================== */
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
        }
      : undefined

    const html = budgetPdfTemplate(budget, {
      logoDataUri,
      ...(watermarkDataUri && { watermarkDataUri }),
      isTrial,
      tenant: tenantForTemplate,
      companyName: budget.tenant?.name ?? undefined
    })

    const pdfUint8 = await generatePdf(html)
    const buffer = Buffer.from(pdfUint8)

    /* ========================
       Nombre del archivo de descarga
    ======================== */
    const clientName = budget.client?.name || ""
    const clientLastName = budget.client?.lastName || ""

    const budgetNumber = String(
      budget.budgetNumber ?? 0
    ).padStart(6, '0')

    const safeName = `${clientName} ${clientLastName}`
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "")
      .toLowerCase() || "cliente"

    const fileName = `${safeName}_pto_${budgetNumber}.pdf`

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
    console.error("PDF error FULL:", error)

    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}