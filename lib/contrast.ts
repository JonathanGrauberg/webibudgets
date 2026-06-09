// Contrast helpers based on WCAG 2.0

function hexToRgb(hex: string) {
  if (!hex) return null
  const h = hex.replace('#', '').trim()
  const short = h.length === 3
  const r = parseInt(short ? h[0] + h[0] : h.slice(0, 2), 16)
  const g = parseInt(short ? h[1] + h[1] : h.slice(2, 4), 16)
  const b = parseInt(short ? h[2] + h[2] : h.slice(4, 6), 16)
  return { r, g, b }
}

function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const [R, G, B] = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

export function calculateContrastRatio(hex1: string, hex2: string) {
  const c1 = hexToRgb(hex1)
  const c2 = hexToRgb(hex2)
  if (!c1 || !c2) return 1
  const L1 = luminance(c1)
  const L2 = luminance(c2)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2))
}

export function isAccessibleContrast(hex1: string, hex2: string, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal') {
  const ratio = calculateContrastRatio(hex1, hex2)
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7
  }
  // AA
  return size === 'large' ? ratio >= 3 : ratio >= 4.5
}

export function getContrastColor(bgHex: string) {
  const whiteContrast = calculateContrastRatio(bgHex, '#ffffff')
  const blackContrast = calculateContrastRatio(bgHex, '#000000')
  // Prefer the color that provides higher contrast
  return whiteContrast >= blackContrast ? '#ffffff' : '#000000'
}
