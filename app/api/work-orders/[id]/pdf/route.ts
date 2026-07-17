export const runtime = "nodejs"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { workOrderPdfTemplate } from "@/lib/pdf/work-order-template"
import { generatePdf } from "@/lib/pdf/generator"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, tenantId },
      include: {
        checklist: { orderBy: { order: 'asc' } },
        assignedToUser: true,
        budget: { include: { client: true, tenant: true, items: { include: { productService: true } } } },
      },
    })

    if (!workOrder) return NextResponse.json({ error: "Not found" }, { status: 404 })

    let logoDataUri: string | undefined
    if (workOrder.budget.tenant?.logoUrl) {
      try {
        const res = await fetch(workOrder.budget.tenant.logoUrl)
        const arrayBuffer = await res.arrayBuffer()
        logoDataUri = `data:${res.headers.get('content-type') || 'image/png'};base64,${Buffer.from(arrayBuffer).toString('base64')}`
      } catch (e) {
        console.error('Error loading tenant logo:', e)
      }
    }

    const html = await workOrderPdfTemplate(workOrder, { logoDataUri, tenant: workOrder.budget.tenant })
    const buffer = Buffer.from(await generatePdf(html))
    const fileName = `orden_trabajo_${String(workOrder.workOrderNumber).padStart(6, '0')}.pdf`

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    })
  } catch (error) {
    console.error("Work order PDF error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}