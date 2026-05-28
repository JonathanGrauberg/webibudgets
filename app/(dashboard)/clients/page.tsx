'use client'

import { Suspense, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus, Search, Pencil, Trash2, Building2, Mail, Phone, MapPin } from 'lucide-react'
import { ClientForm } from '@/components/client-form'
import useSWR, { mutate } from 'swr'
import type { Client } from '@/lib/types'
import { useSearchParams } from 'next/navigation'
import Loading from './loading'

async function fetchClients() {
  const res = await fetch('/api/clients')
  if (!res.ok) throw new Error('Failed to fetch clients')
  return res.json()
}

export default function ClientsPage() {
  const searchParams = useSearchParams()
  const { data: clients = [], isLoading } = useSWR<Client[]>('/api/clients', fetchClients)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const filteredClients = clients.filter((client) => {
    const name = client.name?.toLowerCase() ?? ''
    const company = client.company?.toLowerCase() ?? ''
    const email = client.email?.toLowerCase() ?? ''
    const query = searchQuery.toLowerCase()

    return name.includes(query) || company.includes(query) || email.includes(query)
  })

  const handleCreate = () => {
    setEditingClient(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return

    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    mutate('/api/clients')
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setEditingClient(null)
    mutate('/api/clients')
  }

  return (
    <Suspense fallback={<Loading />}>
      <TooltipProvider>
        <div className="min-h-screen">
          <PageHeader title="Clientes" description="Gestiona tu base de clientes">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Cliente
                </Button>
              </TooltipTrigger>
              <TooltipContent>Agregar un nuevo cliente al sistema</TooltipContent>
            </Tooltip>
          </PageHeader>

          <div className="p-4 md:p-6 lg:p-8">
            {/* Search */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, empresa o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Cargando clientes...</p>
                </CardContent>
              </Card>
            ) : filteredClients.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-center text-muted-foreground">
                    {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                  </p>
                  {!searchQuery && (
                    <Button variant="link" onClick={handleCreate} className="mt-2">
                      Crear primer cliente
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* MOBILE: cards */}
                <div className="space-y-4 md:hidden">
                  {filteredClients.map((client) => (
                    <Card key={client.id}>
                      <CardContent className="space-y-4 p-4">
                        <div className="space-y-1">
                          <p className="font-medium text-card-foreground">{client.name}</p>

                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span>{client.company || 'Sin empresa'}</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="break-all">{client.email}</span>
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span>{client.phone}</span>
                          </div>

                          <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{client.address || 'Sin dirección'}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEdit(client)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Button>

                          <Button
                            variant="outline"
                            className="flex-1 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* DESKTOP/TABLET: table */}
                <Card className="hidden md:block">
                  <CardContent className="p-0">
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {filteredClients.map((client) => (
                            <TableRow key={client.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium text-card-foreground">{client.name}</p>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Building2 className="h-3 w-3" />
                                    {client.company || 'Sin empresa'}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    {client.email}
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {client.phone}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="text-sm text-muted-foreground">
                                {client.address}
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(client)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Editar cliente</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(client.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Eliminar cliente</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                </DialogTitle>
              </DialogHeader>

              <ClientForm
                client={editingClient}
                onSuccess={handleFormSuccess}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </Suspense>
  )
}