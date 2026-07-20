"use client";
// components\rendiciones\RendicionesPage.tsx
import { useMemo, useState, useEffect, Fragment } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Info, Calendar, CheckCircle2, UserCheck, Search, ChevronDown, ChevronUp, Lock, Unlock } from "lucide-react";

export interface RendicionSellerRow {
  id: string; 
  sellerId: string;
  sellerName: string;
  presupuestosCompletados: number;
  totalFacturado: number;
  ganancia: number;
  margenPromedio: number; 
  percentage: number; 
  gananciaAPagar: number;
  isDefault: boolean;
}

export interface RendicionBudgetRow {
  id: string;
  clienteName: string;
  vendedorName: string;
  budgetNumber: number;
  fecha: string; 
  estado: string;
  total: number;
  costo: number;
  ganancia: number;
  margen: number; 
}

export interface AsignacionConfirmada {
  budgetId: string;
  budgetNumber: string;
  vendedorId: string;
  vendedorName: string;
  role: "admin" | "seller";
  porcentaje: number;
  gananciaAsignada: number;
}

export interface TenantUser {
  id: string;
  name: string;
  role: "admin" | "seller";
}

export interface RendicionData {
  id: string;
  periodStart: string; 
  periodEnd: string; 
  presupuestosCompletados: number;
  totalFacturado: number;
  totalCosto: number;
  totalGanancia: number;
  margenPromedio: number;
  sellers: RendicionSellerRow[];
  budgets: RendicionBudgetRow[];
  tenantUsers?: TenantUser[];
  asignacionesGuardadas?: AsignacionConfirmada[];
  currency?: string; 
}

interface RendicionesPageProps {
  data: RendicionData;
  tenantUsers: TenantUser[]; 
  onDateRangeChange?: (from: string, to: string) => void;
  onUpdatePercentage: () => void; 
  onResetPercentage: () => void;
  onExport?: () => void;
  isLoading?: boolean;
}

function formatCurrency(value: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function KpiCard({ label, value, sublabel, valueClassName }: { label: string; value: string; sublabel: string; valueClassName?: string }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className={`mt-1 text-xl sm:text-2xl font-semibold ${valueClassName ?? "text-slate-900"}`}>{value}</p>
        <p className="mt-0.5 text-xs text-slate-400">{sublabel}</p>
      </CardContent>
    </Card>
  );
}

export default function RendicionesPage({ data, tenantUsers = [], onDateRangeChange, onUpdatePercentage, onExport, isLoading }: RendicionesPageProps) {
  const currency = data.currency ?? "ARS";

  const [selectedBudget, setSelectedBudget] = useState<RendicionBudgetRow | null>(null);
  const [distribucionDraft, setDistribucionDraft] = useState<Record<string, number>>({});
  const [asignacionesGuardadas, setAsignacionesGuardadas] = useState<AsignacionConfirmada[]>(data.asignacionesGuardadas || []);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  
  // Estados para el Historial Agrupado
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBudgets, setExpandedBudgets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (data.asignacionesGuardadas) {
      setAsignacionesGuardadas(data.asignacionesGuardadas);
    }
  }, [data.asignacionesGuardadas]);

  const handleSelectBudget = (budget: RendicionBudgetRow) => {
  setSelectedBudget(budget);
  const yaAsignadas = asignacionesGuardadas.filter(a => a.budgetId === budget.id);
  
  const baseDraft: Record<string, number> = {};
  
  if (yaAsignadas.length > 0) {
    // Si ya existe en la BD, respetamos los valores guardados (Modo Lectura)
    tenantUsers.forEach(u => {
      const encontrada = yaAsignadas.find(a => a.vendedorId === u.id);
      baseDraft[u.id] = encontrada ? encontrada.porcentaje : 0;
    });
    setIsEditMode(false);
  } else {
    // 🌟 LÓGICA INTELIGENTE: Autocompletar 100% balanceado de entrada
    const admins = tenantUsers.filter(u => u.role === "admin");
    const vendedorDelPresupuesto = tenantUsers.find(u => u.name === budget.vendedorName);

    if (vendedorDelPresupuesto && vendedorDelPresupuesto.role === "admin") {
      // Caso 1: El vendedor es admin, se lleva el 100% solo
      tenantUsers.forEach(u => {
        baseDraft[u.id] = u.id === vendedorDelPresupuesto.id ? 100 : 0;
      });
    } else if (vendedorDelPresupuesto && admins.length > 0) {
      // Caso 2: Vendedor externo (50%) + El otro 50% repartido entre los admins del sistema
      const porcentajePorAdmin = 50 / admins.length;
      
      tenantUsers.forEach(u => {
        if (u.id === vendedorDelPresupuesto.id) {
          baseDraft[u.id] = 50;
        } else if (u.role === "admin") {
          baseDraft[u.id] = porcentajePorAdmin;
        } else {
          baseDraft[u.id] = 0;
        }
      });
    } else {
      // Caso de contingencia (Sin admins o sin vendedor asignado)
      tenantUsers.forEach(u => {
        baseDraft[u.id] = u.name === budget.vendedorName ? 100 : 0;
      });
    }
    setIsEditMode(true);
  }
  
  setDistribucionDraft(baseDraft);
};

  const handlePercentChange = (userId: string, val: string) => {
    const parsed = parseFloat(val) || 0;
    setDistribucionDraft(prev => ({ ...prev, [userId]: parsed }));
  };

  const handleGuardarAsignacion = async () => {
    if (!selectedBudget) return;

    const sumaPorcentajes = Object.values(distribucionDraft).reduce((a, b) => a + b, 0);
    if (Math.abs(sumaPorcentajes - 100) > 0.01) {
      alert("La suma de los porcentajes debe ser exactamente 100% para este presupuesto.");
      return;
    }

    const nuevasAsignaciones: AsignacionConfirmada[] = Object.entries(distribucionDraft)
      .filter(([_, pct]) => pct > 0)
      .map(([userId, pct]) => {
        const usuario = tenantUsers.find(u => u.id === userId);
        return {
          budgetId: selectedBudget.id,
          budgetNumber: String(selectedBudget.budgetNumber).padStart(6, "0"),
          vendedorId: userId,
          vendedorName: usuario?.name ?? "Desconocido",
          role: usuario?.role ?? "seller",
          porcentaje: pct,
          gananciaAsignada: selectedBudget.ganancia * (pct / 100),
        };
      });

    try {
      const response = await fetch(`/api/rendiciones/${data.id}/distribuir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetId: selectedBudget.id,
          distribuciones: nuevasAsignaciones.map((a) => ({
            userId: a.vendedorId,
            porcentaje: a.porcentaje,
            monto: a.gananciaAsignada,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al guardar en el servidor");
      }

      setAsignacionesGuardadas((prev) => [
        ...prev.filter((a) => a.budgetId !== selectedBudget.id),
        ...nuevasAsignaciones,
      ]);

      setSelectedBudget(null);
      setDistribucionDraft({});
      onUpdatePercentage(); // Actualiza SWR para refrescar el panel acumulado de la izquierda automáticamente
      
      alert("¡Distribución guardada con éxito y registrada en el historial!");
    } catch (error) {
      console.error(error);
      alert(`No se pudo guardar la distribución: ${String(error)}`);
    }
  };

  // 🌟 LÓGICA DEL PUNTO 2: Agrupación inteligente de los datos del historial
  const historialAgrupado = useMemo(() => {
    const grupos: Record<string, { budgetNumber: string; totalGanancia: number; repartos: AsignacionConfirmada[] }> = {};
    
    asignacionesGuardadas.forEach(a => {
      if (!grupos[a.budgetId]) {
        grupos[a.budgetId] = { budgetNumber: a.budgetNumber, totalGanancia: 0, repartos: [] };
      }
      grupos[a.budgetId].totalGanancia += a.gananciaAsignada;
      grupos[a.budgetId].repartos.push(a);
    });

    return Object.entries(grupos).filter(([_, g]) => 
      g.budgetNumber.includes(searchQuery)
    );
  }, [asignacionesGuardadas, searchQuery]);

  const toggleExpand = (budgetId: string) => {
    setExpandedBudgets(prev => ({ ...prev, [budgetId]: !prev[budgetId] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Rendiciones</h1>
          <p className="mt-1 text-sm text-slate-500">Resumen de presupuestos completados y distribución de ganancias</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button type="button" onClick={() => onDateRangeChange?.(data.periodStart, data.periodEnd)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50">
            <Calendar className="h-4 w-4 text-slate-400" />
            {formatDate(data.periodStart)} - {formatDate(data.periodEnd)}
          </button>
          <Button variant="outline" className="gap-2" onClick={onExport} disabled={isLoading}>
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Presupuestos completados" value={String(data.presupuestosCompletados)} sublabel="Total en el período" />
        <KpiCard label="Total facturado" value={formatCurrency(data.totalFacturado, currency)} sublabel="100% del total" valueClassName="text-emerald-600" />
        <KpiCard label="Costo total" value={formatCurrency(data.totalCosto, currency)} sublabel={`${((data.totalCosto / (data.totalFacturado || 1)) * 100).toFixed(1)}% del facturado`} valueClassName="text-blue-600" />
        <KpiCard label="Ganancia total" value={formatCurrency(data.totalGanancia, currency)} sublabel={`${data.margenPromedio.toFixed(1)}% del facturado`} valueClassName="text-emerald-600" />
        <KpiCard label="Margen promedio" value={formatPercent(data.margenPromedio)} sublabel="Promedio general" valueClassName="text-purple-600" />
      </div>

      {/* Distribución */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Resumen Izquierdo Acumulado por Ganancias Reales */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <h2 className="text-sm font-semibold text-slate-900">Resumen Acumulado por Distribución Real</h2>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Integrante</TableHead>
                  <TableHead className="text-right">Presup. Coparticipados</TableHead>
                  <TableHead className="text-right">Volumen Aportado</TableHead>
                  <TableHead className="text-right">Ganancia Real</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sellers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-slate-800">{s.sellerName}</TableCell>
                    <TableCell className="text-right text-sm text-slate-600">{s.presupuestosCompletados}</TableCell>
                    <TableCell className="text-right text-sm text-slate-600">{formatCurrency(s.totalFacturado, currency)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-emerald-600">{formatCurrency(s.ganancia, currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* DISTRIBUCIÓN DINÁMICA CON INTEGRIDAD Y BLOQUEO (Punto 1) */}
        <Card className={`border-slate-200 shadow-sm ring-2 ring-offset-0 transition-all duration-200 ${selectedBudget ? 'ring-blue-500' : 'ring-transparent'}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                {selectedBudget 
                  ? `Rendición de Presupuesto N° ${String(selectedBudget.budgetNumber).padStart(6, "0")}`
                  : "Distribución de ganancias"
                }
              </h2>
              {selectedBudget && !isEditMode && (
                <Badge className="bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-1" variant="outline">
                  <Lock className="h-3 w-3" /> Solo Lectura
                </Badge>
              )}
            </div>
            {selectedBudget && (
              <p className="text-xs text-emerald-600 font-medium mt-1">
                Ganancia neta a distribuir: {formatCurrency(selectedBudget.ganancia, currency)}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-5">
            {!selectedBudget ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                <UserCheck className="mb-2 h-8 w-8 text-slate-300" />
                Hacé click en cualquier presupuesto de la tabla inferior para desglosar sus ganancias.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {tenantUsers.map((u) => {
                    const pctActual = distribucionDraft[u.id] || 0;
                    const plataAsignada = selectedBudget.ganancia * (pctActual / 100);

                    return (
                      <div key={u.id} className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between bg-white">
                        <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                          {u.name} 
                          <Badge className={`text-[10px] ${u.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"}`} variant="outline">
                            {u.role === "admin" ? "admin" : "vendedor"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="relative w-20">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              disabled={!isEditMode}
                              value={distribucionDraft[u.id] ?? ""}
                              onChange={(e) => handlePercentChange(u.id, e.target.value)}
                              className="pr-6 text-right disabled:opacity-80 disabled:bg-slate-50 font-medium"
                            />
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                          </div>
                          <span className="w-28 text-right text-sm font-semibold text-emerald-600">
                            {formatCurrency(plataAsignada, currency)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Validador e Historial de Modificaciones Interno */}
                {(() => {
                  const suma = Object.values(distribucionDraft).reduce((a, b) => a + b, 0);
                  const desbalanceado = Math.abs(suma - 100) > 0.01;
                  return (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                        <span className="font-medium text-slate-600">Total Asignado</span>
                        <span className={`font-semibold ${desbalanceado ? "text-red-600" : "text-emerald-600"}`}>
                          {formatPercent(suma)} / 100%
                        </span>
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedBudget(null); setIsEditMode(true); }}>
                          Cancelar
                        </Button>
                        {!isEditMode ? (
                          <Button size="sm" variant="outline" className="gap-1 border-amber-300 hover:bg-amber-50 text-amber-800" onClick={() => setIsEditMode(true)}>
                            <Unlock className="h-4 w-4" /> Activar Modificación
                          </Button>
                        ) : (
                          <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" disabled={desbalanceado} onClick={handleGuardarAsignacion}>
                            <CheckCircle2 className="h-4 w-4" /> Guardar Distribución
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla Principal */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <h2 className="text-sm font-semibold text-slate-900">Detalle de presupuestos completados <span className="text-xs font-normal text-slate-400">(Hacé click para abrir en panel de control)</span></h2>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor Inicial</TableHead>
                <TableHead>N°</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ganancia</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.budgets.map((b) => {
                const yaAsignado = asignacionesGuardadas.some(a => a.budgetId === b.id);
                return (
                  <TableRow key={b.id} className={`cursor-pointer transition-colors ${selectedBudget?.id === b.id ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50/80'}`} onClick={() => handleSelectBudget(b)}>
                    <TableCell className="font-medium text-slate-800">{b.clienteName}</TableCell>
                    <TableCell className="text-slate-600">{b.vendedorName}</TableCell>
                    <TableCell className="text-slate-600">#{String(b.budgetNumber).padStart(6, "0")}</TableCell>
                    <TableCell className="text-slate-600">{formatDate(b.fecha)}</TableCell>
                    <TableCell className="text-right text-slate-700">{formatCurrency(b.total, currency)}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">{formatCurrency(b.ganancia, currency)}</TableCell>
                    <TableCell className="text-center">
                      {yaAsignado ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-none">Distribuido</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400">Pendiente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 🌟 HISTORIAL AGRUPADO, COLAPSABLE Y FILTRABLE (Punto 2) */}
{asignacionesGuardadas.length > 0 && (
  <Card className="border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
    <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Historial de Ganancias Distribuidas</h2>
        <p className="text-xs text-slate-400">Agrupado por presupuesto para una auditoría limpia</p>
      </div>
      <div className="relative w-full sm:w-60">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por N° Presupuesto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Presupuesto</TableHead>
            <TableHead className="text-right">Ganancia Total Distribuida</TableHead>
            <TableHead className="text-center">Integrantes Coparticipes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historialAgrupado.map(([budgetId, grupo]) => {
            const isOpen = !!expandedBudgets[budgetId];
            return (
              <Fragment key={budgetId}>
                {/* Fila Principal de Resumen de Presupuesto */}
                <TableRow className="bg-slate-50/60 font-medium cursor-pointer hover:bg-slate-50" onClick={() => toggleExpand(budgetId)}>
                  <TableCell className="text-center">
                    {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500 mx-auto" /> : <ChevronDown className="h-4 w-4 text-slate-500 mx-auto" />}
                  </TableCell>
                  <TableCell className="text-slate-900 font-semibold">#{grupo.budgetNumber}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(grupo.totalGanancia, currency)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-slate-200 text-slate-800 text-[11px]">
                      {grupo.repartos.length} {grupo.repartos.length === 1 ? 'Persona' : 'Personas'}
                    </Badge>
                  </TableCell>
                </TableRow>

                {/* Desglose Colapsable Interno */}
                {isOpen && (
                  <TableRow className="bg-emerald-50/5 hover:bg-emerald-50/5">
                    <TableCell colSpan={4} className="p-0 border-t-0">
                      <div className="bg-slate-50/30 px-12 py-3 border-l-4 border-l-emerald-500 space-y-2">
                        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">Desglose del Reparto:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {grupo.repartos.map((r, idx) => (
                            <div key={idx} className="flex items-center justify-between border bg-white rounded-md p-2 text-sm shadow-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-800">{r.vendedorName}</span>
                                <Badge variant="outline" className={`text-[10px] ${r.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                  {r.role}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-slate-500 mr-2">({formatPercent(r.porcentaje)})</span>
                                <span className="font-semibold text-emerald-600">{formatCurrency(r.gananciaAsignada, currency)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
)}

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Info className="h-3.5 w-3.5" /> Solo se incluyen presupuestos con estado &quot;Completado&quot;.
      </p>
    </div>
  );
}