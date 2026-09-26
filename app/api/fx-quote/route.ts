// app/api/fx-quote/route.ts
//
// Cotización de referencia USD/ARS — puramente informativa, para que el
// usuario vea el valor del día y decida por su cuenta (ej. al aceptar un
// presupuesto en dólares). .budgets NO convierte ni recalcula nada con
// esto — sería fingir que "maneja" la moneda cuando en realidad solo le
// pone el nombre. Proxeamos la API pública dolarapi.com (sin key, sin
// costo) para evitar pegarle directo desde el cliente y poder cachear.
import { NextResponse } from 'next/server'

export const revalidate = 300 // 👈 5 min de caché — no hace falta más fresco que eso para esto

export async function GET() {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares', {
      next: { revalidate: 300 },
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'No se pudo obtener la cotización' }, { status: 502 })
    }
    const data: Array<{ casa: string; nombre: string; compra: number; venta: number; fechaActualizacion: string }> = await res.json()

    const oficial = data.find((d) => d.casa === 'oficial')
    const blue = data.find((d) => d.casa === 'blue')

    if (!oficial && !blue) {
      return NextResponse.json({ error: 'Respuesta inesperada de la cotización' }, { status: 502 })
    }

    return NextResponse.json({ oficial, blue })
  } catch (err) {
    console.error('[fx-quote]', err)
    return NextResponse.json({ error: 'No se pudo obtener la cotización' }, { status: 502 })
  }
}
