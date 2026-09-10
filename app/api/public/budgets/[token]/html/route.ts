export const runtime = "nodejs"
//app\api\public\budgets\[token]\html\route.ts
//
// Sin login. Devuelve el MISMO HTML que se usa para generar el PDF (ver
// app/api/public/budgets/[token]/pdf/route.ts) pero sin pasar por
// Puppeteer — se sirve tal cual para mostrarlo en un <iframe> dentro del
// portal público. Así el portal muestra EXACTAMENTE lo mismo que el
// cliente vería si descarga el PDF, sin mantener dos plantillas separadas.
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { renderBudgetPdf } from "@/lib/pdf/render-budget-pdf"

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
      return new NextResponse("Presupuesto no encontrado", { status: 404 })
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
          showPageNumbers: false, // 👈 no tiene sentido "Página X de Y" en una web
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

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        // 👇 solo lo puede embeber nuestro propio dominio (el portal), no
        // cualquier sitio de terceros con un iframe apuntando a esta URL.
        "X-Frame-Options": "SAMEORIGIN",
      },
    })
  } catch (error) {
    console.error("Public HTML preview error:", error)
    return new NextResponse("Error generando la vista previa", { status: 500 })
  }
}
