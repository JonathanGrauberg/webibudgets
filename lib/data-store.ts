import type { Client, ProductService } from './types'
import { mockClients, mockProducts } from './mock-data'

import { calculateBudget } from './budget-engine'
import { BudgetModel, BudgetItemModel } from './budget-model'

// ================== In-memory storage ==================

let clients: Client[] = [...mockClients]
let products: ProductService[] = [...mockProducts]
let budgets: BudgetModel[] = []   // ✅ solo modelo nuevo

// ================== Helpers ==================

const generateId = () => Math.random().toString(36).substring(2, 9)

const generateReferenceCode = () => {
  const year = new Date().getFullYear()
  const seq = String(budgets.length + 1).padStart(4, '0')
  return `ECO-${year}-${seq}`
}

// ================== CLIENTS ==================

export function getClients(): Client[] {
  return clients
}

export function getClient(id: string): Client | undefined {
  return clients.find(c => c.id === id)
}

export function createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client {
  const newClient: Client = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  clients.push(newClient)
  return newClient
}

export function updateClient(id: string, data: Partial<Client>): Client | undefined {
  const index = clients.findIndex(c => c.id === id)
  if (index === -1) return undefined
  
  clients[index] = {
    ...clients[index],
    ...data,
    updatedAt: new Date(),
  }
  return clients[index]
}

export function deleteClient(id: string): boolean {
  const index = clients.findIndex(c => c.id === id)
  if (index === -1) return false
  clients.splice(index, 1)
  return true
}

// ================== PRODUCTS ==================

export function getProducts(): ProductService[] {
  return products
}

export function getProduct(id: string): ProductService | undefined {
  return products.find(p => p.id === id)
}

export function createProduct(
  data: Omit<ProductService, 'id' | 'createdAt' | 'updatedAt'>
): ProductService {
  const newProduct: ProductService = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  products.push(newProduct)
  return newProduct
}

export function updateProduct(id: string, data: Partial<ProductService>): ProductService | undefined {
  const index = products.findIndex(p => p.id === id)
  if (index === -1) return undefined
  
  products[index] = {
    ...products[index],
    ...data,
    updatedAt: new Date(),
  }
  return products[index]
}

export function deleteProduct(id: string): boolean {
  const index = products.findIndex(p => p.id === id)
  if (index === -1) return false
  products.splice(index, 1)
  return true
}

// ================== BUDGETS (NUEVO ENGINE) ==================

export function getBudgets(): BudgetModel[] {
  return budgets
}

export function getBudget(id: string): BudgetModel | undefined {
  return budgets.find(b => b.id === id)
}

export function createBudget(data: {
  clientId: string
  items: {
    productServiceId?: string
    name: string
    description?: string
    quantity: number
    unitPrice: number
    discount?: number
    type: BudgetItemModel['type']
  }[]
  notes?: string
  discountType?: 'percentage' | 'fixed' | null
  discountValue?: number
  taxPercentage?: number
  paymentTerms?: string
  validUntil?: Date
  sellerName?: string
}): BudgetModel {

  const budgetId = crypto.randomUUID()

  const items: BudgetItemModel[] = data.items.map(item => ({
    id: crypto.randomUUID(),
    productServiceId: item.productServiceId,
    name: item.name,
    description: item.description,
    type: item.type,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount || 0,
    subtotal: 0,
  }))

  const calculation = calculateBudget({
    items,
    discountType: data.discountType ?? null,
    discountValue: data.discountValue ?? 0,
    taxPercentage: data.taxPercentage ?? 0,
  })

  const newBudget: BudgetModel = {
    id: budgetId,
    clientId: data.clientId,

    referenceCode: generateReferenceCode(),
    version: 1,

    items: calculation.items,

    subtotal: calculation.subtotal,
    discountType: data.discountType ?? null,
    discountValue: data.discountValue ?? 0,
    taxPercentage: data.taxPercentage ?? 0,
    taxAmount: calculation.taxAmount,
    total: calculation.total,

    status: 'draft',

    notes: data.notes,
    paymentTerms: data.paymentTerms,
    validUntil: data.validUntil,
    sellerName: data.sellerName,

    createdAt: new Date(),
    updatedAt: new Date(),
  }

  budgets.unshift(newBudget)
  return newBudget
}

export function updateBudgetStatus(id: string, status: BudgetModel['status']) {
  const budget = budgets.find(b => b.id === id)
  if (!budget) return undefined

  budget.status = status
  budget.updatedAt = new Date()

  return budget
}

export function deleteBudget(id: string): boolean {
  const index = budgets.findIndex(b => b.id === id)
  if (index === -1) return false
  budgets.splice(index, 1)
  return true
}

// ================== DASHBOARD STATS ==================

export function getDashboardStats() {
  const allBudgets = getBudgets()

  return {
    totalClients: clients.length,
    totalProducts: products.filter(p => p.active).length,
    totalBudgets: allBudgets.length,
    approvedBudgets: allBudgets.filter(b => b.status === 'approved').length,
    pendingBudgets: allBudgets.filter(
      b => b.status === 'sent' || b.status === 'draft'
    ).length,
    rejectedBudgets: allBudgets.filter(b => b.status === 'rejected').length,
    totalRevenue: allBudgets
      .filter(b => b.status === 'approved')
      .reduce((sum, b) => sum + b.total, 0),
  }
}
