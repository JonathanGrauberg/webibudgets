//app\api\clients\[id]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'

// GET: Obtener un cliente por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Cambio a Promise
) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params // Esperamos la promesa
    
    const client = await prisma.client.findFirst({
      where: tenantWhereId(id, tenantId),
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
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json()

    // Handle seller assignment (backwards compatibility with assignedSeller field name)
    // Map from form field assignedSeller to DB field assignedSellerId
    let assignedSellerId: string | null | undefined = undefined
    const sellerIdFromForm = data?.assignedSeller || data?.assignedSellerId
    if (sellerIdFromForm && typeof sellerIdFromForm === 'string' && sellerIdFromForm.trim()) {
      assignedSellerId = sellerIdFromForm.trim()
      // Validate seller exists only if provided
      const seller = await prisma.seller.findFirst({
        where: {
          id: assignedSellerId,
          tenantId,
        },
      })
      if (!seller) {
        return NextResponse.json(
          { error: 'Seller not found' },
          { status: 404 }
        )
      }
    } else if (data.assignedSeller === '' || data.assignedSeller === null || data.assignedSellerId === '' || data.assignedSellerId === null) {
      // Explicitly set to null if clearing the assignment
      assignedSellerId = null
    }

    // Limpiamos los datos para evitar errores de tipos en Prisma
    const updateData: any = {
      name: data.name?.trim(),
      company: data.company?.trim() || null,
      dni:
        data?.identificationType === 'person'
          ? data?.identificationNumber?.trim() || null
          : null,

      cuit:
        data?.identificationType === 'company'
          ? data?.identificationNumber?.trim() || null
          : null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim(),
      address: data.address?.trim() || '—',
      city: data.city?.trim() || null, // 👈 nuevo
      province: data.province?.trim() || null, // 👈 nuevo
      type: data.type || null,
      peopleCount: data.peopleCount ? Number(data.peopleCount) : null,
      usageFrequency: data.usageFrequency || null,
      status: data.status || 'nuevo',
      notes: data.notes ?? '',
      locationUrl: data.locationUrl?.trim() || null,
      // Manejo seguro de fecha
      lastContactAt: data.lastContactAt && String(data.lastContactAt).trim() !== '' 
        ? new Date(data.lastContactAt) 
        : null,
    }

    // Only include assignedSellerId if it was explicitly set
    if (assignedSellerId !== undefined) {
      updateData.assignedSellerId = assignedSellerId
    }

    const updated = await prisma.client.updateMany({
      where: tenantWhereId(id, tenantId),
      data: updateData,
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Client not found or tenant mismatch' }, { status: 404 })
    }

    const updatedClient = await prisma.client.findFirst({
      where: tenantWhereId(id, tenantId),
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
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    
    const result = await prisma.client.deleteMany({
      where: tenantWhereId(id, tenantId),
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Client not found or tenant mismatch' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}