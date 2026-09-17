// app\api\rendiciones\[id]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { hasFeature } from '@/lib/features'
import { findCandidateBudgetIds } from '@/lib/rendicion-engine'

const BUDGET_INCLUDE_FOR_RENDICION = {
  client: { select: { name: true, company: true } },
  seller: { select: { name: true, lastName: true, userId: true } },
  items: { select: { quantity: true, cost: true, productService: { select: { cost: true } } } },
  receipts: { select: { amount: true, status: true, sourceBudgetPaymentId: true } },
  payments: { select: { amount: true, status: true } },
  cobros: { select: { amount: true, status: true } },
  expenses: { select: { amount: true } },
} as const

const INACTIVE_RECEIPT_STATUSES = new Set(['cancelled', 'anulado', 'voided', 'void', 'annulled'])

function isReceiptActive(status?: string | null) {
  if (!status) return true
  return !INACTIVE_RECEIPT_STATUSES.has(status)
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true, features: true },
  })
  const canSeeDistribution = !!tenant && hasFeature(tenant, 'commissions')

  const rendicion = await prisma.rendicion.findFirst({
    where: { id, tenantId },
    include: {
      budgets: {
        include: {
          budget: { include: BUDGET_INCLUDE_FOR_RENDICION },
        },
      },
    },
  })

  if (!rendicion) {
    return NextResponse.json({ error: 'Rendición no encontrada' }, { status: 404 })
  }

  // 🌟 nuevo — auto-descubrimiento de presupuestos nuevos: antes, un
  // recibo/pago cargado DESPUÉS de generar la rendición no aparecía hasta que
  // alguien volvía a tocar "Generar rendición" a mano (lo único que corría
  // esta búsqueda). Ahora cada lectura vuelve a buscar candidatos del mismo
  // período y los vincula solos — una rendición cerrada es un snapshot
  // congelado, así que esto solo corre mientras sigue en borrador.
  let rendicionBudgets = rendicion.budgets
  if (rendicion.status !== 'closed') {
    const candidateIds = await findCandidateBudgetIds(tenantId, rendicion.periodStart, rendicion.periodEnd)
    const yaVinculados = new Set(rendicionBudgets.map((rb) => rb.budgetId))
    const nuevos = candidateIds.filter((bid) => !yaVinculados.has(bid))

    if (nuevos.length > 0) {
      await prisma.rendicionBudget.createMany({
        data: nuevos.map((budgetId) => ({ rendicionId: rendicion.id, budgetId })),
        skipDuplicates: true,
      })
      const nuevosBudgets = await prisma.rendicionBudget.findMany({
        where: { rendicionId: rendicion.id, budgetId: { in: nuevos } },
        include: { budget: { include: BUDGET_INCLUDE_FOR_RENDICION } },
      })
      rendicionBudgets = [...rendicionBudgets, ...nuevosBudgets]
    }
  }

  const users = await prisma.user.findMany({
    where: { tenantId, active: true },
    select: { id: true, name: true, role: true, seller: { select: { id: true } } },
  })

  const tenantUsers = users.map(u => ({
    id: u.id,
    name: u.name,
    role: (u.role === 'admin' || u.role === 'owner') ? 'admin' : 'seller'
  }))

  const userBySellerId = new Map<string, { id: string; name: string; role: 'admin' | 'seller' }>()
  users.forEach(u => {
    if (u.seller?.id) {
      userBySellerId.set(u.seller.id, {
        id: u.id,
        name: u.name,
        role: (u.role === 'admin' || u.role === 'owner') ? 'admin' : 'seller',
      })
    }
  })

  // 👇 los presupuestos desactivados no se muestran en Rendiciones, aunque
  // hayan quedado vinculados a una rendición ya generada antes de
  // desactivarlos. Tampoco se exige que esté 100% saldado — un trabajo
  // grande pagado en cuotas debe poder repartirse a medida que entra cada
  // cuota, no recién cuando termina de pagarse del todo (ver
  // lib/rendicion-engine.ts, mismo criterio al generar una rendición nueva).
  const budgetRowsAll = rendicionBudgets
    .filter(({ budget: b }) => b.active !== false)
    .map(({ budget: b }) => {
      let cost = 0
      for (const item of b.items) {
        const itemCost = item.cost ?? item.productService?.cost ?? 0
        cost += itemCost * item.quantity
      }
      const gananciaBrutaTotal = b.total - cost

      // 👇 sourceBudgetPaymentId: un recibo "espejo" de un BudgetPayment ya
      // sumado abajo — contarlo acá también duplicaría la plata.
      const collectedReceipts = b.receipts
        .filter((r) => isReceiptActive(r.status) && !r.sourceBudgetPaymentId)
        .reduce((acc, r) => acc + Number(r.amount || 0), 0)
      const collectedPayments = b.payments
        .filter((p) => p.status === 'approved')
        .reduce((acc, p) => acc + Number(p.amount || 0), 0)
      const collectedCobros = b.cobros
        .filter((c) => c.status === 'paid')
        .reduce((acc, c) => acc + Number(c.amount || 0), 0)
      const collected = Math.min(collectedReceipts + collectedPayments + collectedCobros, b.total)
      const pctCobrado = b.total > 0 ? collected / b.total : 0

      const gastosAsociados = b.expenses.reduce((acc, e) => acc + e.amount, 0)
      const gananciaTotal = gananciaBrutaTotal - gastosAsociados
      // 👇 ganancia YA REPARTIBLE — proporcional a lo efectivamente cobrado,
      // no la ganancia completa de un trabajo que todavía no terminó de pagarse.
      const ganancia = gananciaTotal * pctCobrado
      const margen = b.total > 0 ? (ganancia / b.total) * 100 : 0

      return {
        id: b.id,
        clienteName: b.client?.company || b.client?.name || '—',
        vendedorName: b.seller ? `${b.seller.name} ${b.seller.lastName}` : 'Sin asignar',
        sellerId: b.sellerId ?? null,
        budgetNumber: b.budgetNumber ?? 0,
        fecha: b.createdAt.toISOString(),
        estado: b.status,
        total: b.total,
        collected,
        pctCobrado: pctCobrado * 100,
        costo: cost,
        gananciaTotal,
        ganancia,
        margen,
        gastosAsociados,
      }
    })
    .filter((b) => b.collected > 0) // 👈 solo entran trabajos con ALGO cobrado

  const budgetRows = budgetRowsAll

  const generalExpenses = await prisma.expense.findMany({
    where: {
      tenantId,
      budgetId: null,
      date: { gte: rendicion.periodStart, lte: rendicion.periodEnd },
    },
    select: { amount: true },
  })
  const totalGastosGenerales = generalExpenses.reduce((acc, e) => acc + e.amount, 0)

  // 🌟 Cobros sueltos — cargos de "Cobros" pagados SIN presupuesto vinculado
  // (ej: cuota mensual recurrente). No tienen costo ni vendedor conocido:
  // entran 100% como ganancia del período, y se muestran/reparten aparte
  // en su propio bloque ("Ingresos de cobros pagos"), con el mismo mecanismo
  // de reparto por % que un presupuesto (ver RendicionAsignacion.budgetId,
  // que es un string libre sin FK — reusamos ese campo con una clave
  // sintética en vez de un budgetId real).
  const cobrosSueltosPagados = await prisma.cobro.findMany({
    where: {
      tenantId,
      status: 'paid',
      budgetId: null,
      paidAt: { gte: rendicion.periodStart, lte: rendicion.periodEnd },
    },
    include: { client: { select: { name: true, company: true } } },
    orderBy: { paidAt: 'desc' },
  })
  const cobrosSueltosKey = `cobros_sueltos:${rendicion.id}`
  const cobrosSueltosTotal = cobrosSueltosPagados.reduce((acc, c) => acc + Number(c.amount || 0), 0)
  const cobrosSueltosItems = cobrosSueltosPagados.map((c) => ({
    id: c.id,
    clientName: c.client?.company || c.client?.name || '—',
    concept: c.concept,
    amount: c.amount,
    currency: c.currency,
    paidAt: (c.paidAt ?? c.periodMonth).toISOString(),
  }))

  const totalFacturado = budgetRows.reduce((acc, b) => acc + b.collected, 0) + cobrosSueltosTotal
  const totalCosto = budgetRows.reduce((acc, b) => acc + b.costo * (b.pctCobrado / 100), 0)
  const totalGanancia = budgetRows.reduce((acc, b) => acc + b.ganancia, 0) - totalGastosGenerales + cobrosSueltosTotal
  const margenPromedio = totalFacturado > 0 ? (totalGanancia / totalFacturado) * 100 : 0

  const budgetById = new Map(budgetRowsAll.map((b) => [b.id, b]))

  // 👇 el reparto es una propiedad del PRESUPUESTO, no de la rendición
  // puntual donde se guardó — se busca en cualquier rendición del tenant,
  // no solo en esta. Como puede haber lotes viejos de antes de este fix
  // (guardados desde otra rendición para el mismo presupuesto), nos
  // quedamos solo con el lote más reciente por presupuesto: todas las filas
  // que comparten el rendicionId de la fila más nueva de ese presupuesto
  // (un guardado = un rendicionId, aunque el createdAt de cada fila varíe
  // unos milisegundos entre sí dentro del mismo guardado).
  const asignacionesRaw = await prisma.rendicionAsignacion.findMany({
    where: { budgetId: { in: Array.from(budgetById.keys()) }, rendicion: { tenantId } },
  })
  const latestRowByBudget = new Map<string, { rendicionId: string; createdAt: number }>()
  asignacionesRaw.forEach((a) => {
    const t = a.createdAt.getTime()
    const cur = latestRowByBudget.get(a.budgetId)
    if (!cur || t > cur.createdAt) latestRowByBudget.set(a.budgetId, { rendicionId: a.rendicionId, createdAt: t })
  })
  const asignacionesDb = asignacionesRaw.filter(
    (a) => latestRowByBudget.get(a.budgetId)?.rendicionId === a.rendicionId
  )

  const asignacionesGuardadas = asignacionesDb
    .map((a) => {
      const u = userBySellerId.get(a.sellerId)
      const b = budgetById.get(a.budgetId)
      if (!u || !b) return null
      return {
        budgetId: a.budgetId,
        budgetNumber: String(b.budgetNumber).padStart(6, '0'),
        vendedorId: u.id,
        vendedorName: u.name,
        role: u.role,
        porcentaje: a.percentage,
        gananciaAsignada: a.monto,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  // 👇 reparto de los cobros sueltos — a diferencia de los presupuestos, la
  // clave (cobrosSueltosKey) ya incluye el rendicionId, así que alcanza con
  // buscar en ESTA rendición.
  const asignacionesCobrosSueltos = cobrosSueltosTotal > 0
    ? await prisma.rendicionAsignacion.findMany({ where: { budgetId: cobrosSueltosKey, rendicionId: rendicion.id } })
    : []
  const asignacionesCobrosSueltosMapped = asignacionesCobrosSueltos
    .map((a) => {
      const u = userBySellerId.get(a.sellerId)
      if (!u) return null
      return {
        budgetId: a.budgetId,
        budgetNumber: 'COBROS',
        vendedorId: u.id,
        vendedorName: u.name,
        role: u.role,
        porcentaje: a.percentage,
        gananciaAsignada: a.monto,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  asignacionesGuardadas.push(...asignacionesCobrosSueltosMapped)

  const acumuladoUsuarios: Record<string, { name: string; presupuestos: Set<string>; facturado: number; ganancia: number }> = {}

  tenantUsers.forEach(u => {
    acumuladoUsuarios[u.id] = { name: u.name, presupuestos: new Set(), facturado: 0, ganancia: 0 }
  })

  asignacionesGuardadas.forEach((a) => {
    const acc = acumuladoUsuarios[a.vendedorId]
    if (!acc) return
    if (a.budgetId === cobrosSueltosKey) {
      acc.ganancia += a.gananciaAsignada
      acc.facturado += cobrosSueltosTotal * (a.porcentaje / 100)
      acc.presupuestos.add(a.budgetId)
      return
    }
    const b = budgetById.get(a.budgetId)
    if (!b) return
    acc.ganancia += a.gananciaAsignada
    acc.facturado += b.collected * (a.porcentaje / 100)
    acc.presupuestos.add(a.budgetId)
  })

  const sellersRows = Object.entries(acumuladoUsuarios).map(([userId, data]) => ({
    id: userId,
    sellerId: users.find(u => u.id === userId)?.seller?.id || '',
    sellerName: data.name,
    presupuestosCompletados: data.presupuestos.size,
    totalFacturado: data.facturado,
    ganancia: data.ganancia,
    margenPromedio: data.facturado > 0 ? (data.ganancia / data.facturado) * 100 : 0
  })).sort((a, b) => b.ganancia - a.ganancia)

  // 👇 nuevo — "¿cuánto facturó cada uno este mes?" — a diferencia de
  // "sellers" de arriba (que depende de que alguien haya guardado un reparto
  // manual de ganancias por presupuesto), esto sale directo de quién es el
  // vendedor/dueño cargado en cada presupuesto saldado. Sirve para 1, 2 o N
  // integrantes sin configurar nada. Se muestra siempre (no requiere PRO
  // "commissions" — es una lectura simple, no un reparto de ganancias).
  const facturacionPorIntegrante = (() => {
    const acc: Record<string, { sellerName: string; totalFacturado: number; cantidad: number }> = {}
    budgetRows.forEach((b) => {
      const key = b.sellerId ?? 'sin_asignar'
      if (!acc[key]) acc[key] = { sellerName: b.vendedorName, totalFacturado: 0, cantidad: 0 }
      acc[key].totalFacturado += b.collected // 👈 lo efectivamente cobrado, no el total nominal del trabajo
      acc[key].cantidad += 1
    })
    return Object.entries(acc)
      .map(([sellerId, v]) => ({ sellerId, ...v }))
      .sort((a, b) => b.totalFacturado - a.totalFacturado)
  })()

  return NextResponse.json({
    id: rendicion.id,
    periodStart: rendicion.periodStart.toISOString(),
    periodEnd: rendicion.periodEnd.toISOString(),
    status: rendicion.status,
    presupuestosCompletados: budgetRows.length,
    totalFacturado,
    totalCosto,
    totalGanancia,
    totalGastosGenerales,
    margenPromedio,
    sellers: canSeeDistribution ? sellersRows : [],
    facturacionPorIntegrante,
    budgets: budgetRows,
    tenantUsers: canSeeDistribution ? tenantUsers : [],
    asignacionesGuardadas: canSeeDistribution ? asignacionesGuardadas : [],
    cobrosSueltos: cobrosSueltosTotal > 0
      ? { id: cobrosSueltosKey, total: cobrosSueltosTotal, count: cobrosSueltosItems.length, items: cobrosSueltosItems }
      : null,
    currency: 'ARS',
  })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json()

    if (data.status !== 'closed') {
      return NextResponse.json({ error: 'Solo se admite cerrar una rendición' }, { status: 400 })
    }

    const result = await prisma.rendicion.updateMany({
      where: { id, tenantId, status: 'draft' },
      data: { status: 'closed', closedAt: new Date() },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Rendición no encontrada o ya estaba cerrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error closing rendicion:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}