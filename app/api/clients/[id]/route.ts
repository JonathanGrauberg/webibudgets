import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Obtener un cliente por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Cambio a Promise
) {
  try {
    const { id } = await params // Esperamos la promesa
    
    const client = await prisma.client.findUnique({
      where: { id },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

// PUT: Actualizar cliente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Cambio a Promise
) {
  try {
    const { id } = await params
    const data = await request.json()

    // Limpiamos los datos para evitar errores de tipos en Prisma
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        company: data.company?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim(),
        address: data.address?.trim() || '—',
        type: data.type || null,
        peopleCount: data.peopleCount ? Number(data.peopleCount) : null,
        usageFrequency: data.usageFrequency || null,
        status: data.status || 'nuevo',
        notes: data.notes ?? '',
        locationUrl: data.locationUrl?.trim() || null,
        assignedSeller: data.assignedSeller || null,
        // Manejo seguro de fecha
        lastContactAt: data.lastContactAt && String(data.lastContactAt).trim() !== '' 
          ? new Date(data.lastContactAt) 
          : null,
      },
    })

    return NextResponse.json(updatedClient)
  } catch (error: any) {
    console.error('PUT Error:', error)
    return NextResponse.json(
      { error: 'Failed to update client', message: error.message }, 
      { status: 500 }
    )
  }
}

// DELETE: Eliminar cliente
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Cambio a Promise
) {
  try {
    const { id } = await params
    
    await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}