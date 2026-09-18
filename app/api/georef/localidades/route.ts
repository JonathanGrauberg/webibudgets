// app/api/georef/localidades/route.ts
//
// Proxy simple a la API Georef (datos.gob.ar, gobierno argentino) para
// buscar localidades por provincia + texto — así el frontend no depende
// directo de un dominio externo, y si el día de mañana cambia la fuente
// de datos, se cambia solo acá.
import { NextResponse } from 'next/server'

const GEOREF_BASE = 'https://apis.datos.gob.ar/georef/api/localidades'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const provincia = searchParams.get('provincia')?.trim()
  const q = searchParams.get('q')?.trim()

  if (!provincia || !q || q.length < 2) {
    return NextResponse.json({ localidades: [] })
  }

  const url = new URL(GEOREF_BASE)
  url.searchParams.set('provincia', provincia)
  url.searchParams.set('nombre', q)
  url.searchParams.set('campos', 'nombre')
  url.searchParams.set('max', '15')
  url.searchParams.set('aplanar', 'true')

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) })
    if (!res.ok) {
      return NextResponse.json({ localidades: [] })
    }
    const data = await res.json()
    const nombres: string[] = Array.from(
      new Set((data.localidades ?? []).map((l: { nombre: string }) => l.nombre))
    )
    return NextResponse.json({ localidades: nombres })
  } catch {
    // 👇 la API externa puede estar caída o lenta — el autocompletar cae a
    // texto libre en el front, así que acá basta con no romper la request.
    return NextResponse.json({ localidades: [] })
  }
}
