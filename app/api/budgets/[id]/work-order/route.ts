export const runtime = "nodejs"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { getTenantIdFromRequest } from '@/lib/tenant'
import { loadBudgetForPdf, buildPdfFileName } from '@/lib/pdf/shared'
import { generatePdf } from "@/lib/pdf/generator"
import { hasFeature } from "@/lib/features"
import { workOrderPdfTemplate } from "@/lib/pdf/work-order-template"
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params

    const loaded = await loadBudgetForPdf(tenantId, id)
    if (!loaded) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // 🌟 gate por feature del tenant, no solo por rol
    if (!hasFeature({ features: loaded.tenantForTemplate?.features }, 'vouchers')) {
      return NextResponse.json({ error: 'Módulo de documentos no habilitado' }, { status: 403 })
    }

    const html = workOrderPdfTemplate(loaded.budget, {
      logoDataUri: loaded.logoDataUri,
      ...(loaded.watermarkDataUri && { watermarkDataUri: loaded.watermarkDataUri }),
      tenant: loaded.tenantForTemplate,
      companyName: loaded.companyName,
    })

    const buffer = Buffer.from(await generatePdf(html))
    const fileName = buildPdfFileName(loaded.budget, 'orden_trabajo')

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    })
  } catch (error) {
    console.error("Receipt PDF error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}