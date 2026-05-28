export const runtime = "nodejs"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { budgetPdfTemplate } from "@/lib/pdf/template"
import { generatePdf } from "@/lib/pdf/generator"
import fs from "fs/promises"
import path from "path"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        client: true,
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
       Cargar logos desde /public
       ======================== */

    const logoPath = path.join(process.cwd(), "public", "logo-ecoservicios.png")
    const watermarkPath = path.join(process.cwd(), "public", "logo-watermark.png")

    const logoBase64 = (await fs.readFile(logoPath)).toString("base64")
    const watermarkBase64 = (await fs.readFile(watermarkPath)).toString("base64")

    const logoDataUri = `data:image/png;base64,${logoBase64}`
    const watermarkDataUri = `data:image/png;base64,${watermarkBase64}`

    /* ========================
       Generar HTML
       ======================== */

    const html = budgetPdfTemplate(budget, {
      logoDataUri,
      watermarkDataUri,
    })

    const pdfUint8 = await generatePdf(html)
    const buffer = Buffer.from(pdfUint8)

    /* ========================
       Nombre del archivo PDF
       ======================== */

    const clientName = budget.client?.name || ""
    const clientLastName = budget.client?.lastName || ""

    const safeName = `${clientName} ${clientLastName}`
      .trim()
      .replace(/\s+/g, "_")     // espacios → _
      .replace(/[^\w\-]/g, "")  // limpia caracteres raros
      .toLowerCase() || "cliente"

    const fileName = `${safeName}_pto_${id.slice(0, 6)}.pdf`

    console.log("PDF filename:", fileName)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",

        // 👇 nombre correcto (BIEN FORMADO)
        "Content-Disposition": `attachment; filename="${fileName}"`,

        // 🚫 ANTI CACHE TOTAL
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