export const runtime = "nodejs"
export const maxDuration = 60
//app\api\receipts\[id]\pdf\route.ts
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
        budget: { include: { client: true } }, // 👈 sin tenant acá, lo traemos aparte
        client: true, // 👈 nuevo — cliente directo, solo poblado si es standalone
        registeredByUser: { select: { name: true } },
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // 👇 nuevo — tenant siempre desde tenantId, nunca desde receipt.budget.tenant
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // 👇 nuevo — cliente: del presupuesto si lo hay, sino el directo del recibo standalone
    const client = receipt.budget?.client ?? receipt.client ?? null

    let logoDataUri: string | undefined
    if (tenant.logoUrl) { // 👈 antes: receipt.budget.tenant?.logoUrl
      try {
        const res = await fetch(tenant.logoUrl)
        const arrayBuffer = await res.arrayBuffer()
        logoDataUri = `data:${res.headers.get('content-type') || 'image/png'};base64,${Buffer.from(arrayBuffer).toString('base64')}`
      } catch (e) {
        console.error('Error loading tenant logo:', e)
      }
    }

    const html = await receiptPdfTemplate(receipt, { logoDataUri, tenant }) // 👈 sin el spread manual, el template ya resuelve el fallback

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