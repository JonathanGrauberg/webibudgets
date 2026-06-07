import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantCreateData, tenantWhere } from '@/lib/tenant'

export async function GET(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)

    const clients = await prisma.client.findMany({
      where: tenantWhere(tenantId),
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(clients)
  } catch (error: any) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients', message: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()

    // Sanitización de campos básicos
    const name = typeof data?.name === 'string' ? data.name.trim() : ''
    const phone = typeof data?.phone === 'string' ? data.phone.trim() : ''
    
    // Si están vacíos, que sean NULL (importante para el email si es unique)
    const company = typeof data?.company === 'string' && data.company.trim() ? data.company.trim() : null
    const email = typeof data?.email === 'string' && data.email.trim() ? data.email.trim() : null

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields', missing: ['name', 'phone'] },
        { status: 400 }
      )
    }

    // Sincronizado con las opciones de tu formulario frontend
    const allowedClientType = new Set(['home', 'home_modular', 'cabin', 'hall', 'sanitary', 'company'])
    const type = allowedClientType.has(data?.type) ? data.type : null

    const allowedCommercialStatus = new Set([
      'nuevo', 'contactado', 'presupuesto_enviado', 'interesado', 
      'sin_respuesta', 'rechazado', 'cliente_activo', 'cliente_frecuente',
    ])
    const status = allowedCommercialStatus.has(data?.status) ? data.status : 'nuevo'

    // Handle seller assignment (backwards compatibility with assignedSeller field name)
    // Map from form field assignedSeller to DB field assignedSellerId
    let assignedSellerId: string | null = null
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
    }

    const client = await prisma.client.create({
      data: tenantCreateData(
        {
          name,
          lastName: data?.lastName ? String(data.lastName).trim() : null,
          company,
          dni:
            data?.identificationType === 'person' &&
            data?.identificationNumber
              ? String(data.identificationNumber).trim()
              : null,

          cuit:
            data?.identificationType === 'company' &&
            data?.identificationNumber
              ? String(data.identificationNumber).trim()
              : null,
          email,
          phone,
          address: typeof data?.address === 'string' && data.address.trim() ? data.address.trim() : '—',
          type,
          peopleCount: data?.peopleCount ? Number(data.peopleCount) || null : null,
          usageFrequency: data?.usageFrequency ? String(data.usageFrequency) : null,
          status,
          notes: typeof data?.notes === 'string' ? data.notes : '',
          locationUrl: data?.locationUrl ? String(data.locationUrl).trim() : null,
          assignedSellerId,
          // Evita el error 'Invalid Date' si el string viene vacío
          lastContactAt: data?.lastContactAt && String(data.lastContactAt).trim() !== '' 
            ? new Date(data.lastContactAt) 
            : null,
        },
        tenantId
      ),
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error: any) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client', message: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}