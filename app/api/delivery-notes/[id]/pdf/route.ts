export const runtime = "nodejs"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { deliveryNotePdfTemplate } from "@/lib/pdf/delivery-note-template"
import { generatePdf } from "@/lib/pdf/generator"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params

    const deliveryNote = await prisma.deliveryNote.findFirst({
      where: { id, tenantId },
      include: {
        budget: {
          include: {
            client: true,
            tenant: true,
            items: { include: { productService: true } },
          },
        },
      },
    })

    if (!deliveryNote) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    let logoDataUri: string | undefined
    if (deliveryNote.budget.tenant?.logoUrl) {
      try {
        const res = await fetch(deliveryNote.budget.tenant.logoUrl)
        const arrayBuffer = await res.arrayBuffer()
        logoDataUri = `data:${res.headers.get('content-type') || 'image/png'};base64,${Buffer.from(arrayBuffer).toString('base64')}`
      } catch (e) {
        console.error('Error loading tenant logo:', e)
      }
    }

    const html = await deliveryNotePdfTemplate(deliveryNote, {
      logoDataUri,
      tenant: deliveryNote.budget.tenant,
    })

    const buffer = Buffer.from(await generatePdf(html))
    const fileName = `remito_${String(deliveryNote.deliveryNumber).padStart(6, '0')}.pdf`

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    })
  } catch (error) {
    console.error("Delivery note PDF error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}