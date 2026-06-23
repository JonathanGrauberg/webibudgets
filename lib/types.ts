// Types for WebiBudgets Management System

export interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  address: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

export type ProductCategory =
  | 'biodigesters'
  | 'grease_traps'
  | 'maintenance'
  | 'other'

export interface ProductService {
  id: string
  name: string
  description: string
  category: ProductCategory
  price: number
  unit: string
  active: boolean
  stock?: number
  createdAt: Date
  updatedAt: Date
}

export interface Seller {
  id: string
  name: string
  lastName: string
  dni?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  sector?: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Installer {
  id: string
  name: string
  lastName: string
  phone: string
  email?: string | null
  city?: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export type BudgetStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'expired'

export interface BudgetItem {
  id: string
  budgetId: string
  productServiceId: string
  productService?: ProductService
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface BudgetStatusHistory {
  id: string
  from: BudgetStatus
  to: BudgetStatus
  changedAt: Date
  user?: string | null
}

export interface BudgetDetail {
  id?: string
  title: string
  value: string
}

export interface Budget {
  id: string

  budgetNumber?: number | null

  clientId: string
  client?: Client

  sellerId?: string | null
  seller?: Seller | null

  installerId?: string | null
  installer?: Installer | null

  items: BudgetItem[]

  history?: BudgetStatusHistory[]

  status: BudgetStatus
  notes: string

  // 💰 Montos
  subtotal: number
  discount: number
  tax: number
  shippingCost?: number | null
  total: number

  // 🧾 Comerciales
  paymentTerms?: string | null
  sellerName?: string | null
  validUntil?: Date | null

  // 🛠 Instalación
  installationResponsible?: string | null
  installerReference?: string | null

  details?: BudgetDetail[]

  createdAt: Date
  updatedAt: Date
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  biodigesters: 'Equipos',
  grease_traps: 'Accesorios', 
  maintenance: 'Servicios',
  other: 'Otros',
}

export const STATUS_LABELS: Record<BudgetStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  completed: 'Completado',
  expired: 'Vencido',
}

export const STATUS_COLORS: Record<BudgetStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-slate-100 text-slate-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-slate-100 text-slate-800',
  expired: 'bg-orange-100 text-orange-700 border-orange-200',
}