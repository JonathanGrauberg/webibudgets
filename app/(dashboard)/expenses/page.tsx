'use client'
//app\(dashboard)\expenses\page.tsx
import { useMemo, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogOverlay,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Loader2, Plus, Receipt, Wallet, Search, Pencil, Trash2, Briefcase } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'otro', label: 'Otro' },
]

type ExpenseCategory = { id: string; name: string }
type Expense = {
  id: string
  description: string
  amount: number
  currency: string
  date: string
  paymentMethod: string | null
  notes: string | null
  category: { id: string; name: string } | null
  budget: { id: string; budgetNumber: number; client?: { name: string; company: string | null } } | null
}
type BudgetOption = { id: string; budgetNumber: number; client?: { name: string; company: string | null } }

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
}

export default function ExpensesPage() {
  const { canEdit } = usePermissions()
  const canManage = canEdit('expenses')

  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'byBudget'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const queryParams = new URLSearchParams()
  if (scopeFilter !== 'all') queryParams.set('scope', scopeFilter)
  if (categoryFilter !== 'all') queryParams.set('categoryId', categoryFilter)
  const query = queryParams.toString()

  const { data: expenses = [], isLoading } = useSWR<Expense[]>(`/api/expenses${query ? `?${query}` : ''}`, fetcher)
  const { data: categories = [] } = useSWR<ExpenseCategory[]>('/api/expense-categories', fetcher)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const summary = useMemo(() => {
    const total = expenses.reduce((acc, e) => acc + e.amount, 0)
    const general = expenses.filter((e) => !e.budget).reduce((acc, e) => acc + e.amount, 0)
    const byBudget = expenses.filter((e) => e.budget).reduce((acc, e) => acc + e.amount, 0)
    return { total, general, byBudget }
  }, [expenses])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto? No se puede deshacer.')) return
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    mutate((key) => typeof key === 'string' && key.startsWith('/api/expenses'))
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
      <PageHeader title="Gastos" description="Gastos generales del negocio y gastos asociados a trabajos puntuales">
        {canManage && (
          <Button
            className="w-full gap-2 sm:w-auto"
            onClick={() => { setEditingExpense(null); setModalOpen(true) }}
          >
            <Plus className="h-4 w-4" />
            Nuevo gasto
          </Button>
        )}
      </PageHeader>

      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="h-4 w-4" /> Total gastado</div>
              <p className="mt-1 text-2xl font-semibold text-card-foreground">{formatCurrency(summary.total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Receipt className="h-4 w-4" /> Gastos generales</div>
              <p className="mt-1 text-2xl font-semibold text-card-foreground">{formatCurrency(summary.general)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Briefcase className="h-4 w-4" /> Asociados a trabajos</div>
              <p className="mt-1 text-2xl font-semibold text-card-foreground">{formatCurrency(summary.byBudget)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={scopeFilter} onValueChange={(v: any) => setScopeFilter(v)}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los gastos</SelectItem>
              <SelectItem value="general">Solo generales</SelectItem>
              <SelectItem value="byBudget">Solo asociados a trabajos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : expenses.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <Wallet className="h-10 w-10 text-slate-300" />
              <p className="text-sm text-muted-foreground">Todavía no cargaste ningún gasto.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* MOBILE: cards */}
            <div className="space-y-3 md:hidden">
              {expenses.map((e) => (
                <Card key={e.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-card-foreground">{e.description}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(e.date)}</p>
                      </div>
                      <span className="shrink-0 font-semibold text-card-foreground">{formatCurrency(e.amount)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {e.category ? (
                        <Badge variant="secondary">{e.category.name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin categoría</span>
                      )}
                      {e.budget ? (
                        <Badge variant="outline" className="gap-1">
                          <Briefcase className="h-3 w-3" />
                          #{String(e.budget.budgetNumber).padStart(6, '0')} — {e.budget.client?.company || e.budget.client?.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline">General</Badge>
                      )}
                    </div>

                    {canManage && (
                      <div className="flex gap-2 border-t border-border pt-3">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingExpense(e); setModalOpen(true) }}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => handleDelete(e.id)}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* DESKTOP/TABLET: tabla */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Asociado a</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        {canManage && <TableHead className="text-right">Acciones</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((e) => (
                        <TableRow key={e.id} className="hover:bg-muted/40">
                          <TableCell className="text-sm text-muted-foreground">{formatDate(e.date)}</TableCell>
                          <TableCell className="font-medium">{e.description}</TableCell>
                          <TableCell>
                            {e.category ? <Badge variant="secondary">{e.category.name}</Badge> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            {e.budget ? (
                              <Badge variant="outline" className="gap-1">
                                <Briefcase className="h-3 w-3" />
                                #{String(e.budget.budgetNumber).padStart(6, '0')} — {e.budget.client?.company || e.budget.client?.name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">General</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(e.amount)}</TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => { setEditingExpense(e); setModalOpen(true) }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(e.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <ExpenseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        categories={categories}
        editingExpense={editingExpense}
        onSaved={() => mutate((key) => typeof key === 'string' && key.startsWith('/api/expenses'))}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
function ExpenseModal({
  open, onOpenChange, categories, editingExpense, onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: ExpenseCategory[]
  editingExpense: Expense | null
  onSaved: () => void
}) {
  const isEditing = !!editingExpense

  const [description, setDescription] = useState(editingExpense?.description ?? '')
  const [amount, setAmount] = useState(editingExpense ? String(editingExpense.amount) : '')
  const [categoryId, setCategoryId] = useState(editingExpense?.category?.id ?? '')
  const [date, setDate] = useState(editingExpense?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState(editingExpense?.paymentMethod ?? 'efectivo')
  const [notes, setNotes] = useState(editingExpense?.notes ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Asociar a un trabajo (opcional)
  const [linkToBudget, setLinkToBudget] = useState(!!editingExpense?.budget)
  const [budgetSearch, setBudgetSearch] = useState('')
  const [budgetId, setBudgetId] = useState(editingExpense?.budget?.id ?? '')
  const { data: budgets = [] } = useSWR<BudgetOption[]>(linkToBudget ? '/api/budgets' : null, fetcher)
  const filteredBudgets = budgets.filter((b) => {
    const label = `${b.budgetNumber} ${b.client?.company ?? ''} ${b.client?.name ?? ''}`.toLowerCase()
    return label.includes(budgetSearch.toLowerCase())
  }).slice(0, 8)

  // Categoría nueva, inline
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    const res = await fetch('/api/expense-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    })
    if (res.ok) {
      const created = await res.json()
      await mutate('/api/expense-categories')
      setCategoryId(created.id)
      setNewCategoryName('')
      setCreatingCategory(false)
    }
  }

  const resetAndClose = () => {
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !amount) return
    setIsSubmitting(true)
    try {
      const body = {
        description: description.trim(),
        amount: Number(amount),
        categoryId: categoryId || null,
        date,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        budgetId: linkToBudget ? (budgetId || null) : null,
      }

      const url = isEditing ? `/api/expenses/${editingExpense!.id}` : '/api/expenses'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to save expense')

      onSaved()
      resetAndClose()
    } catch (err) {
      console.error(err)
      alert('No se pudo guardar el gasto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar gasto' : 'Nuevo gasto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Descripción *</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Alquiler del taller, compra de insumos..." required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            {!creatingCategory ? (
              <div className="flex gap-2">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={() => setCreatingCategory(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre de la categoría..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                />
                <Button type="button" onClick={handleCreateCategory}>Crear</Button>
                <Button type="button" variant="ghost" onClick={() => { setCreatingCategory(false); setNewCategoryName('') }}>
                  Cancelar
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Medio de pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asociar a un trabajo puntual */}
          <div className="rounded-lg border border-border p-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={linkToBudget} onChange={(e) => { setLinkToBudget(e.target.checked); if (!e.target.checked) setBudgetId('') }} />
              Asociar a un trabajo puntual (en vez de gasto general)
            </label>

            {linkToBudget && (
              <div className="mt-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Buscar presupuesto por cliente o número..." value={budgetSearch} onChange={(e) => setBudgetSearch(e.target.value)} />
                </div>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {filteredBudgets.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBudgetId(b.id)}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted ${budgetId === b.id ? 'bg-muted font-medium' : ''}`}
                    >
                      <span>#{String(b.budgetNumber).padStart(6, '0')} — {b.client?.company || b.client?.name}</span>
                    </button>
                  ))}
                  {budgetSearch && filteredBudgets.length === 0 && (
                    <p className="px-2.5 py-1.5 text-xs text-muted-foreground">Sin resultados</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}