'use client'

import { useEffect, useMemo, useState } from 'react'
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
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Pencil, Plus, Trash2, Mail, Phone, MapPin, Wrench } from 'lucide-react'

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
  const [installers, setInstallers] = useState<Installer[]>([])
  const [loading, setLoading] = useState(true)
  const [includeInactive, setIncludeInactive] = useState(false)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Installer | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

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

  const openCreate = () => {
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

      if (!res.ok) throw new Error('Failed to save installer')

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

  const activeCount = useMemo(
    () => installers.filter((i) => i.active).length,
    [installers]
  )

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Instaladores"
        description={`Activos: ${activeCount}`}
      >
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo instalador
        </Button>
      </PageHeader>

      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Listado</CardTitle>

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
              <div className="py-10 text-center text-muted-foreground">
                Cargando...
              </div>
            ) : installers.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                No hay instaladores
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
                                ? 'bg-green-100 text-green-800'
                                : 'bg-muted text-muted-foreground'
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
                          <TableHead className="text-right">Acciones</TableHead>
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
                              {i.email || i.phone || '—'}
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge
                                className={
                                  i.active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-muted text-muted-foreground'
                                }
                              >
                                {i.active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>

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

      <Dialog open={open} onOpenChange={setOpen}>
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
                onCheckedChange={(v) => setForm({ ...form, active: v })}
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
    </div>
  )
}