export const runtime = "nodejs"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { receiptPdfTemplate } from "@/lib/pdf/receipt-template"
import { generatePdf } from "@/lib/pdf/generator"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params

    const receipt = await prisma.receipt.findFirst({
      where: { id, tenantId },
      include: {
        budget: { include: { client: true, tenant: true } },
        registeredByUser: { select: { name: true } },
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    let logoDataUri: string | undefined
    if (receipt.budget.tenant?.logoUrl) {
      try {
        const res = await fetch(receipt.budget.tenant.logoUrl)
        const arrayBuffer = await res.arrayBuffer()
        logoDataUri = `data:${res.headers.get('content-type') || 'image/png'};base64,${Buffer.from(arrayBuffer).toString('base64')}`
      } catch (e) {
        console.error('Error loading tenant logo:', e)
      }
    }

    const html = await receiptPdfTemplate(receipt, {
      logoDataUri,
      tenant: receipt.budget.tenant,
    })

    const buffer = Buffer.from(await generatePdf(html))
    const fileName = `recibo_${String(receipt.receiptNumber).padStart(6, '0')}.pdf`

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