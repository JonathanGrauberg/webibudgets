// app\api\products\route.ts 
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantCreateData, tenantWhere } from '@/lib/tenant'
import { normalizeCurrency, DEFAULT_CURRENCY } from '@/lib/currencies' // 👈 nuevo
import { hasFeature } from '@/lib/features'
import { resolveCustomCategoryId } from '@/lib/categories'


export async function GET(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const products = await prisma.productService.findMany({
      where: tenantWhere(tenantId),
      orderBy: { createdAt: 'desc' },
      include: {
        variants: { orderBy: { label: 'asc' } },
        customCategory: { select: { id: true, name: true } }, // 👈 nuevo
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()

    // 🌟 Moneda del producto: viene del form, o cae a la default del tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { currency: true },
    })
    const productCurrency = normalizeCurrency(data.currency, tenant?.currency ?? DEFAULT_CURRENCY)

    const product = await prisma.productService.create({
      data: tenantCreateData(
        {
          name: data.name,
          description: data.description ?? '',
          category: data.category,
          customCategoryId: await resolveCustomCategoryId(data.customCategoryId, tenantId),
          price: Number(data.price),
          currency: productCurrency, // 👈 nuevo
          cost: data.cost !== undefined && data.cost !== '' ? Number(data.cost) : null, // 👈 nuevo
          minStock: data.minStock !== undefined && data.minStock !== '' ? Number(data.minStock) : null,
          unit: data.unit,
          active: data.active ?? true,
        },
        tenantId
      ),
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

/* ==========================================================
   PATCH (Actualización Masiva de Precios por Porcentaje)
========================================================== */
export async function PATCH(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)

    // 🔒 Chequeo de feature flag antes de tocar nada
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, features: true },
    })

    if (!tenant || !hasFeature(tenant, 'bulkPriceUpdate')) {
      return NextResponse.json(
        { error: 'Esta función requiere el plan PRO.' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { percentage, category } = data
    const target: 'price' | 'cost' | 'profit' = ['cost', 'profit'].includes(data.target) ? data.target : 'price'
    const keepProfit = data.keepProfit === true

    if (percentage === undefined || isNaN(Number(percentage))) {
      return NextResponse.json(
        { error: 'Se requiere un porcentaje numérico válido.' },
        { status: 400 }
      )
    }

    // Calculamos el factor de multiplicación. Ej: 10% de aumento -> factor 1.10
    // Si mandaran un descuento de -5% -> factor 0.95
    const factor = 1 + (Number(percentage) / 100)

    // Armamos las condiciones del WHERE aislando estrictamente por tenant
    const whereConditions: any = {
      tenantId: tenantId,
      active: true, // Solo actualizamos los productos activos
    }

    // Si pasaron una categoría específica por el body, filtramos también por ella
    if (category) {
      whereConditions.category = category
    }

    // Costo / ganancia: dependen de otra columna, así que van con SQL directo.
    // Solo se tocan los productos que tienen costo cargado.
    //  - costo: cost × factor (y, si keepProfit, el precio sube lo mismo para no perder ganancia)
    //  - ganancia: (price − cost) × factor, o sea el precio = costo + nueva ganancia
    if (target !== 'price') {
      const categorySql = category ? Prisma.sql`AND "category" = ${category}::"ProductCategory"` : Prisma.empty
      const setSql =
        target === 'cost'
          ? keepProfit
            ? Prisma.sql`"cost" = "cost" * ${factor}, "price" = "price" + "cost" * ${factor - 1}`
            : Prisma.sql`"cost" = "cost" * ${factor}`
          : Prisma.sql`"price" = "cost" + ("price" - "cost") * ${factor}`
      const count = await prisma.$executeRaw`
        UPDATE "ProductService" SET ${setSql}, "updatedAt" = NOW()
        WHERE "tenantId" = ${tenantId} AND "active" = true AND "cost" IS NOT NULL ${categorySql}`
      return NextResponse.json({ message: 'Actualizado con éxito.', count })
    }

    // Ejecutamos la query masiva directamente en Postgres gracias a Prisma
    const result = await prisma.productService.updateMany({
      where: whereConditions,
      data: {
        price: {
          multiply: factor
        }
      }
    })

    return NextResponse.json({
      message: 'Precios actualizados con éxito.',
      count: result.count
    })

  } catch (error) {
    console.error('Error en actualización masiva de precios:', error)
    return NextResponse.json(
      { error: 'Error interno al actualizar precios masivamente.' },
      { status: 500 }
    )
  }
}