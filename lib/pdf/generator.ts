import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium-min"

const CHROMIUM_REMOTE_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar"

export async function generatePdf(html: string): Promise<Uint8Array> {
  const isDev = process.env.NODE_ENV !== "production"

  const executablePath = isDev
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : await chromium.executablePath(CHROMIUM_REMOTE_URL)

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: "shell", // ✅ valor correcto para Puppeteer en v137+
    defaultViewport: {
      deviceScaleFactor: 1,
      hasTouch: false,
      height: 1080,
      isLandscape: true,
      isMobile: false,
      width: 1920,
    },
  })

  const page = await browser.newPage()

  await page.setContent(html, {
    waitUntil: "domcontentloaded",
  })

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  })

  await browser.close()

  return pdf
}