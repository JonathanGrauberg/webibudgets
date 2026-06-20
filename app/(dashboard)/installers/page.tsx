'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogOverlay
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Pencil, 
  Plus, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Wrench, 
  AlertCircle, 
  Sparkles, 
  ArrowUpRight 
} from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { PLAN_LIMITS } from '@/lib/plan'

type Installer = {
  id: string
  name: string
  lastName: string
  phone: string
  email?: string | null
  city?: string | null
  active: boolean
  createdAt: string
}

const emptyForm = {
  name: '',
  lastName: '',
  phone: '',
  email: '',
  city: '',
  active: true,
}

export default function InstallersPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { canEdit } = usePermissions()
  const canEditInstallers = canEdit('installers')

  const [installers, setInstallers] = useState<Installer[]>([])
  const [loading, setLoading] = useState(true)
  const [includeInactive, setIncludeInactive] = useState(false)

  const [open, setOpen] = useState(false)
  const [openUpgrade, setOpenUpgrade] = useState(false) // 🚨 Modal de upgrade premium
  const [editing, setEditing] = useState<Installer | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  const tenantLimits = useMemo(() => {
  const planKey = (session?.user as any)?.plan || 'starter'
  const limits = PLAN_LIMITS[planKey as keyof typeof PLAN_LIMITS]
  
  let maxInstallers = 0
  // 🌟 Agregamos 'vip' para que también sea ilimitado (999)
  if (planKey === 'business' || planKey === 'vip') maxInstallers = 999 
  else if (planKey === 'pro') maxInstallers = 5    
  else maxInstallers = 0                          

  return {
    plan: planKey,
    maxInstallers,
  }
}, [session])

  const fetchInstallers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/installers?includeInactive=${includeInactive}`)
      const data = await res.json()
      setInstallers(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstallers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive])

  const activeCount = useMemo(
    () => installers.filter((i) => i.active).length,
    [installers]
  )

  // ¿Llegamos al tope máximo permitido?
  const isLimitReached = useMemo(() => {
    if (tenantLimits.plan === 'business') return false
    return activeCount >= tenantLimits.maxInstallers
  }, [activeCount, tenantLimits])

  // Interceptar el click en CUALQUIER intento de creación
  const openCreate = () => {
    if (isLimitReached) {
      setOpenUpgrade(true)
      return
    }
    setEditing(null)
    setForm({ ...emptyForm })
    setOpen(true)
  }

  const openEdit = (i: Installer) => {
    setEditing(i)
    setForm({
      name: i.name ?? '',
      lastName: i.lastName ?? '',
      phone: i.phone ?? '',
      email: i.email ?? '',
      city: i.city ?? '',
      active: i.active ?? true,
    })
    setOpen(true)
  }

  const onSave = async () => {
    // 🛡️ BLINDAJE LÓGICO 1: Si es una creación y el límite ya está alcanzado, frenar.
    if (!editing && isLimitReached) {
      setOpen(false)
      setOpenUpgrade(true)
      return
    }

    // 🛡️ BLINDAJE LÓGICO 2: Si está editando uno INACTIVO y lo quiere pasar a ACTIVO sin cupo.
    if (editing && !editing.active && form.active && isLimitReached) {
      setOpen(false)
      setOpenUpgrade(true)
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() ? form.email.trim() : null,
        city: form.city.trim() ? form.city.trim() : null,
      }

      const url = editing ? `/api/installers/${editing.id}` : '/api/installers'
      const method = editing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        if (errorData.error === 'plan_limit_reached') {
          setOpen(false)
          setOpenUpgrade(true)
          return
        }
        throw new Error('Failed to save installer')
      }

      setOpen(false)
      await fetchInstallers()
    } catch (e) {
      console.error(e)
      alert('No se pudo guardar el instalador')
    } finally {
      setSaving(false)
    }
  }

  const onDisable = async (id: string) => {
    if (!confirm('¿Desactivar instalador?')) return
    const res = await fetch(`/api/installers/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      alert('No se pudo desactivar')
      return
    }
    await fetchInstallers()
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Instaladores"
        description="Gestioná los equipos técnicos y profesionales que ejecutan tus obras."
      >
        {canEditInstallers && (
          <Button 
            onClick={openCreate} 
            className={`w-full sm:w-auto transition-all duration-300 ${
              isLimitReached 
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md' 
                : 'bg-primary text-white'
            }`}
          >
            {isLimitReached ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Expandir límite
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo instalador
              </>
            )}
          </Button>
        )}
      </PageHeader>

      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Listado</CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
  Activos en lista: {activeCount} / {tenantLimits.maxInstallers === 999 ? '∞' : tenantLimits.maxInstallers}
                {isLimitReached && (
                  <span className="inline-flex items-center text-amber-600 cursor-help group relative">
                    <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
                    <span className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-zinc-950 text-white text-[11px] font-normal p-2 rounded-lg shadow-xl whitespace-nowrap z-50 border border-zinc-800">
                      Plan {tenantLimits.plan.toUpperCase()}: Límite alcanzado ({activeCount}/{tenantLimits.maxInstallers})
                    </span>
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Ver inactivos</span>
              <Switch
                checked={includeInactive}
                onCheckedChange={setIncludeInactive}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                Cargando...
              </div>
            ) : installers.length === 0 ? (
              <div className="py-16 px-4 text-center max-w-sm mx-auto flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-muted text-muted-foreground">
                  <Wrench className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">No hay instaladores activos</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isLimitReached 
                      ? `Alcanzaste el tope de tu plan actual (${tenantLimits.maxInstallers}). Expandí tu plan para cargar más personal técnico.`
                      : 'Empezá registrando los instaladores / trabajadores'
                    }
                  </p>
                </div>
                {isLimitReached ? (
                  <Button 
                    size="sm" 
                    className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md" 
                    onClick={() => setOpenUpgrade(true)}
                  >
                    Expandir plan para activar <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  canEditInstallers && (
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="mr-1.5 h-4 w-4" /> Registrar el primero
                    </Button>
                  )
                )}
              </div>
            ) : (
              <>
                {/* MOBILE: cards */}
                <div className="space-y-4 p-4 md:hidden">
                  {installers.map((i) => (
                    <Card key={i.id} className={!i.active ? 'opacity-60' : ''}>
                      <CardContent className="space-y-4 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-card-foreground">
                              {i.name} {i.lastName}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                              <Wrench className="h-4 w-4 shrink-0" />
                              <span>Instalador</span>
                            </div>
                          </div>

                          <Badge
                            className={
                              i.active
                                ? 'bg-zinc-100 text-zinc-800 border-transparent shadow-none'
                                : 'bg-muted text-muted-foreground border-transparent shadow-none'
                            }
                          >
                            {i.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4 shrink-0" />
                            <span>{i.phone || 'Sin teléfono'}</span>
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="break-all">{i.email || 'Sin email'}</span>
                          </div>

                          {i.city && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span>{i.city}</span>
                            </div>
                          )}
                        </div>

                        {canEditInstallers && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => openEdit(i)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Button>

                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => onDisable(i.id)}
                              disabled={!i.active}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Desactivar
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* DESKTOP/TABLET: table */}
                <div className="hidden md:block">
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Ciudad</TableHead>
                          <TableHead>Contacto</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                          {canEditInstallers && (
                            <TableHead className="text-right">Acciones</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {installers.map((i) => (
                          <TableRow key={i.id} className={!i.active ? 'opacity-60' : ''}>
                            <TableCell className="font-medium">
                              {i.name} {i.lastName}
                            </TableCell>

                            <TableCell>{i.city || '—'}</TableCell>

                            <TableCell className="text-sm text-muted-foreground">
                              <div className="flex flex-col gap-0.5">
                                {i.phone && <span className="text-foreground">{i.phone}</span>}
                                {i.email && <span>{i.email}</span>}
                                {!i.phone && !i.email && <span>—</span>}
                              </div>
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge
                                className={
                                  i.active
                                    ? 'bg-zinc-100 text-zinc-800 border-transparent shadow-none'
                                    : 'bg-muted text-muted-foreground border-transparent shadow-none'
                                }
                              >
                                {i.active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>

                            {canEditInstallers && (
                              <TableCell className="space-x-2 text-right">
                                <Button variant="outline" size="sm" onClick={() => openEdit(i)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onDisable(i.id)}
                                  disabled={!i.active}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FORMULARIO DE CREACIÓN/EDICIÓN */}
      {canEditInstallers && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Editar instalador' : 'Nuevo instalador'}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Ciudad</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">Activo</p>
                  <p className="text-xs text-muted-foreground">
                    Si lo desactivás, no se puede asignar a nuevos presupuestos
                  </p>
                </div>

                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => {
                    if (v === true && isLimitReached) {
                      if (!editing || !editing.active) {
                        setOpen(false)        
                        setOpenUpgrade(true)  
                        return
                      }
                    }
                    setForm({ ...form, active: v })
                  }}
                />
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>

              <Button
                onClick={onSave}
                disabled={
                  saving ||
                  !form.name.trim() ||
                  !form.lastName.trim() ||
                  !form.phone.trim()
                }
                className="w-full sm:w-auto"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 🚨 MODAL PREMIUM RE-ESTRUCTURADO AL ORIGINAL */}
      <Dialog open={openUpgrade} onOpenChange={setOpenUpgrade}>
        <DialogOverlay className="bg-black/80 backdrop-blur-[4px]" />
        <DialogContent className="sm:max-w-md text-center p-6 gap-0">
          <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-between p-3 mb-4">
            <Sparkles className="h-6 w-6 fill-amber-100" />
          </div>
          
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight text-center">
              Límite de instaladores alcanzado
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Tu plan <span className="font-bold text-foreground uppercase">{tenantLimits.plan}</span> te permite gestionar un tope máximo de <span className="font-bold text-foreground">{tenantLimits.maxInstallers} instaladores</span> activos en simultáneo.
          </p>

          <div className="bg-zinc-50 border rounded-xl p-4 my-5 text-left text-xs text-zinc-600 space-y-2">
            <p className="font-medium text-zinc-900">¿Qué podés hacer?</p>
            <p>• Tips: podes agregarlo en las notas del presupuesto.</p>
            <p>• Escalar tu plan para contar con soporte multiplaza y mayor volumen.</p>
          </div>

          {/* DialogFooter original restablecido perfectamente */}
          <DialogFooter className="flex-col gap-2 sm:flex-col mt-2">
            <Button 
              onClick={() => router.push('/pricing')} 
              className="w-full bg-gray-200 hover:bg-primary text-primary hover:text-white font-semibold gap-1.5 shadow-md shadow-indigo-600/10"
            >
              Ver planes de expansión <ArrowUpRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={() => setOpenUpgrade(false)} className="w-full text-zinc-500 hover:text-white text-xs">
              Entendido, volver luego
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}