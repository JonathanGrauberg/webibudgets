export function buildMapLinks(locationUrl?: string | null) {
  if (!locationUrl) return null

  // Si el link ya trae coordenadas embebidas (ej: .../@-34.60,-58.38,15z o ?q=-34.60,-58.38)
  const coordMatch = locationUrl.match(/(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/)

  if (coordMatch) {
    const [, lat, lng] = coordMatch
    return {
      google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      apple: `https://maps.apple.com/?ll=${lat},${lng}`,
    }
  }

  // Sin coordenadas extraíbles: Google funciona igual con la URL tal cual,
  // Apple Maps no tiene forma confiable de recibir una URL corta de Google
  return { google: locationUrl, apple: null }
}