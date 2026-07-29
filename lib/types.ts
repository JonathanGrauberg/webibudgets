// lib/types.ts

export type TenantFeatureKey =
  | 'calculator'
  | 'commissions'
  | 'vouchers'
  | 'dashboardMetrics'
  | 'stockAnalytics'

export type TenantFeatures = Partial<Record<TenantFeatureKey, boolean>>

export interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  address: string
  city?: string | null
  province?: string | null
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
  customCategoryId: string | null
  price: number
  cost?: number | null
  currency: string
  unit: string
  active: boolean
  stock?: number
  createdAt: Date
  updatedAt: Date
  variants?: ProductVariant[]
}

export interface ProductVariant {
  id: string
  productServiceId: string
  label: string
  stock: number
  active: boolean
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
  productServiceId: string | null
  productService?: ProductService
  customName?: string | null
  quantity: number
  unitPrice: number
  subtotal: number
  widthCm?: number | null
  heightCm?: number | null
  hours?: number | null
  calculatedM2?: number | null
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

  active: boolean

  status: BudgetStatus
  notes: string

  // 💰 Montos
  currency: string
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

// -----------------------------------------------------------------------------
// 🧾 MÓDULO DE DOCUMENTOS / COMPROBANTES (Vouchers)
// -----------------------------------------------------------------------------

export interface Receipt {
  id: string
  receiptNumber?: number | null
  receipt_number?: number | null
  budgetId?: string | null
  budget_id?: string | null
  amount: number
  paymentMethod?: string | null
  payment_method?: string | null
  notes?: string | null
  status?: 'active' | 'cancelled' | 'anulado' | string
  createdAt?: Date | string
  updatedAt?: Date | string
  budget?: {
    id: string
    budgetNumber?: number | null
  }
}

export interface DeliveryNote {
  id: string
  deliveryNumber?: number | null
  budgetId?: string | null
  budget_id?: string | null
  notes?: string | null
  status?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface WorkOrder {
  id: string
  orderNumber?: number | null
  budgetId?: string | null
  budget_id?: string | null
  notes?: string | null
  status?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

// -----------------------------------------------------------------------------
// 🏷 MAPPINGS Y CONSTANTES
// -----------------------------------------------------------------------------

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