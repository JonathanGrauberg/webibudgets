"use client";
// components\rendiciones\RendicionesPage.tsx
import { useMemo, useState, useEffect, Fragment, type ReactNode } from "react";
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
import { Download, Info, Calendar, CheckCircle2, UserCheck, Search, ChevronDown, ChevronUp, Lock, Unlock, Crown, AlertTriangle, Wallet } from "lucide-react";
import { UpgradeModal } from '@/components/feature-gate'

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
  estado: string; // 👈 estado del TRABAJO (draft/sent/approved/completed) — ya no es el criterio de filtrado, es solo informativo
  total: number;
  costo: number;
  ganancia: number;
  margen: number;
  saldado: boolean; // 👈 nuevo — true si la suma de recibos activos cubre el total. Este es el criterio real de esta tabla ahora.
}

export interface AsignacionConfirmada {
  budgetId: string;
  budgetNumber: string;
  vendedorId: string;
  vendedorName: string;
  role: "admin" | "seller";
  porcentaje: number;
  gananciaAsignada: number;
  pagado?: boolean;
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
  budgets: RendicionBudgetRow[]; // 👈 ahora representa trabajos SALDADOS, no solo "completados"
  budgetsNoLongerCompleted?: RendicionBudgetRow[]; // trabajos que estaban saldados al generar la rendición pero dejaron de estarlo (ej: se anuló un recibo)
  tenantUsers?: TenantUser[];
  asignacionesGuardadas?: AsignacionConfirmada[];
  currency?: string; 
}

interface RendicionesPageProps {
  data: RendicionData;
  tenantUsers: TenantUser[];
  currentUserId?: string; // 👈 nuevo — para calcular "Tu saldo"
  onDateRangeChange?: (from: string, to: string) => void;
  onUpdatePercentage: () => void;
  onResetPercentage: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  hasCommissions: boolean;
  hasExportData: boolean;
  hasAuditHistory: boolean;
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

const ESTADO_PRESUPUESTO_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  approved: "Aprobado",
  completed: "Completado",
};

function formatEstadoPresupuesto(estado: string) {
  return ESTADO_PRESUPUESTO_LABELS[estado] ?? estado;
}

const WORK_STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function WorkStatusBadge({ estado }: { estado: string }) {
  const style = WORK_STATUS_STYLES[estado] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <Badge variant="outline" className={`${style} font-medium`}>
      {formatEstadoPresupuesto(estado)}
    </Badge>
  );
}

type RepartoPaymentStatus = "pendiente" | "calculado" | "pagado";

function getRepartoStatus(
  budgetId: string,
  asignaciones: AsignacionConfirmada[]
): RepartoPaymentStatus {
  const repartos = asignaciones.filter((a) => a.budgetId === budgetId);
  if (repartos.length === 0) return "pendiente";
  return repartos.every((r) => r.pagado === true) ? "pagado" : "calculado";
}

function RepartoStatusBadge({ status }: { status: RepartoPaymentStatus }) {
  if (status === "pagado") {
    return <Badge className="bg-emerald-100 text-emerald-800 border-none">Pagado</Badge>;
  }
  if (status === "calculado") {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        Calculado
      </Badge>
    );
  }
  return <Badge variant="outline" className="text-slate-400">Pendiente</Badge>;
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

// 👇 nuevo — tarjeta destacada de "Tu saldo": lo que ya quedó guardado y
// repartido a nombre del usuario que está mirando la pantalla, no lo que
// "le tocaría en teoría" si todo estuviera repartido.
function MiSaldoCard({ monto, currency, periodStart, periodEnd }: { monto: number; currency: string; periodStart: string; periodEnd: string }) {
  return (
    <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-blue-900">Tu saldo</p>
          <p className="mt-1 text-2xl font-bold text-blue-700 sm:text-3xl">{formatCurrency(monto, currency)}</p>
          <p className="mt-1 text-xs text-blue-600/80">
            Tu parte ya repartida en trabajos saldados, del {formatDate(periodStart)} al {formatDate(periodEnd)}.
          </p>
        </div>
        <Wallet className="h-9 w-9 shrink-0 text-blue-300" />
      </CardContent>
    </Card>
  );
}

function CollapsibleCard({
  defaultOpen = true,
  accentClassName = "",
  icon,
  title,
  subtitle,
  headerRight,
  children,
}: {
  defaultOpen?: boolean;
  accentClassName?: string;
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={`overflow-hidden border-slate-200 shadow-sm ${accentClassName}`}>
      <div
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer select-none items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50/60 sm:px-5 sm:py-4"
      >
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerRight && <div onClick={(e) => e.stopPropagation()}>{headerRight}</div>}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>
      {open && <div className="border-t border-slate-100">{children}</div>}
    </Card>
  );
}

export default function RendicionesPage({
  data, tenantUsers = [], currentUserId, onDateRangeChange, onUpdatePercentage, onExport, isLoading,
  hasCommissions, hasExportData, hasAuditHistory,
}: RendicionesPageProps) {
  const currency = data.currency ?? "ARS";

  const [selectedBudget, setSelectedBudget] = useState<RendicionBudgetRow | null>(null);
  const [distribucionDraft, setDistribucionDraft] = useState<Record<string, number>>({});
  const [asignacionesGuardadas, setAsignacionesGuardadas] = useState<AsignacionConfirmada[]>(data.asignacionesGuardadas || []);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBudgets, setExpandedBudgets] = useState<Record<string, boolean>>({});
  const [upgradeFeature, setUpgradeFeature] = useState<'commissions' | 'exportData' | 'auditHistory' | null>(null);

  useEffect(() => {
    if (data.asignacionesGuardadas) {
      setAsignacionesGuardadas(data.asignacionesGuardadas);
    }
  }, [data.asignacionesGuardadas]);

  const handleSelectBudget = (budget: RendicionBudgetRow) => {
    if (!hasCommissions) {
      setUpgradeFeature('commissions');
      return;
    }
    setSelectedBudget(budget);
    const yaAsignadas = asignacionesGuardadas.filter(a => a.budgetId === budget.id);

    const baseDraft: Record<string, number> = {};

    if (yaAsignadas.length > 0) {
      tenantUsers.forEach(u => {
        const encontrada = yaAsignadas.find(a => a.vendedorId === u.id);
        baseDraft[u.id] = encontrada ? encontrada.porcentaje : 0;
      });
      setIsEditMode(false);
    } else {
      const admins = tenantUsers.filter(u => u.role === "admin");
      const vendedorDelPresupuesto = tenantUsers.find(u => u.name === budget.vendedorName);

      if (vendedorDelPresupuesto && vendedorDelPresupuesto.role === "admin") {
        tenantUsers.forEach(u => {
          baseDraft[u.id] = u.id === vendedorDelPresupuesto.id ? 100 : 0;
        });
      } else if (vendedorDelPresupuesto && admins.length > 0) {
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
      onUpdatePercentage();

      alert("¡Distribución guardada con éxito y registrada en el historial!");
    } catch (error) {
      console.error(error);
      alert(`No se pudo guardar la distribución: ${String(error)}`);
    }
  };

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

  // 👇 nuevo — "Tu saldo": solo lo que ya está guardado y repartido a tu nombre,
  // no una proyección de lo que "te tocaría" si todo estuviera dividido.
  const miSaldo = useMemo(() => {
    if (!currentUserId) return 0;
    return asignacionesGuardadas
      .filter((a) => a.vendedorId === currentUserId)
      .reduce((acc, a) => acc + a.gananciaAsignada, 0);
  }, [asignacionesGuardadas, currentUserId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Rendiciones</h1>
          <p className="mt-1 text-sm text-slate-500">Resumen de trabajos saldados y distribución de ganancias</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button type="button" onClick={() => onDateRangeChange?.(data.periodStart, data.periodEnd)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50">
            <Calendar className="h-4 w-4 text-slate-400" />
            {formatDate(data.periodStart)} - {formatDate(data.periodEnd)}
          </button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (!hasExportData) { setUpgradeFeature('exportData'); return; }
              onExport?.();
            }}
            disabled={isLoading}
          >
            <Download className="h-4 w-4" />
            Exportar
            {!hasExportData && <Crown className="h-3.5 w-3.5 text-amber-500" />}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Trabajos saldados" value={String(data.presupuestosCompletados)} sublabel="En el período" />
        <KpiCard label="Total facturado" value={formatCurrency(data.totalFacturado, currency)} sublabel="Cobrado en el período, sin importar reparto" />
        <KpiCard label="Ganancia neta" value={formatCurrency(data.totalGanancia, currency)} sublabel="Total - costo" valueClassName="text-emerald-600" />
        <KpiCard label="Margen promedio" value={formatPercent(data.margenPromedio)} sublabel="Sobre lo facturado" />
      </div>

      {/* 👇 nuevo — Tu saldo, solo si sabemos quién está mirando la pantalla */}
      {currentUserId && (
        <MiSaldoCard monto={miSaldo} currency={currency} periodStart={data.periodStart} periodEnd={data.periodEnd} />
      )}

      {/* Resumen + Distribución — panel activo de trabajo, no se colapsa */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm relative overflow-hidden">
          <CardHeader className="pb-2">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              Resumen Acumulado por Distribución Real
              {!hasCommissions && <Crown className="h-3.5 w-3.5 text-amber-500" />}
            </h2>
          </CardHeader>
          <CardContent className={`overflow-x-auto p-0 ${!hasCommissions ? 'blur-sm pointer-events-none select-none' : ''}`}>
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
          {!hasCommissions && (
            <button
              type="button"
              onClick={() => setUpgradeFeature('commissions')}
              className="absolute inset-0 flex items-center justify-center bg-white/40"
            >
              <span className="rounded-full bg-black/80 text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-amber-400" /> Desbloquear con PRO
              </span>
            </button>
          )}
        </Card>

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
            {!hasCommissions ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-amber-200 bg-amber-50/40 p-8 text-center text-sm text-amber-700">
                <Crown className="mb-2 h-8 w-8 text-amber-400" />
                Desbloqueá la distribución automática de ganancias entre socios e integrantes en el plan PRO.
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => setUpgradeFeature('commissions')}
                >
                  Ver plan PRO
                </Button>
              </div>
            ) : !selectedBudget ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                <UserCheck className="mb-2 h-8 w-8 text-slate-300" />
                Hacé click en cualquier trabajo de la tabla de abajo para desglosar sus ganancias.
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

      {/* Tabla Principal — TRABAJOS SALDADOS, la más importante: queda abierta por default, con acento de color */}
      <CollapsibleCard
        defaultOpen
        accentClassName="border-t-4 border-t-blue-600"
        icon={<Wallet className="h-5 w-5 text-blue-600 shrink-0" />}
        title="Detalle de trabajos saldados"
        subtitle="Hacé click en una fila para abrir el panel de distribución de arriba"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor Inicial</TableHead>
                <TableHead>N°</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ganancia</TableHead>
                <TableHead className="text-center">Estado del trabajo</TableHead>
                <TableHead className="text-center">Estado del reparto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.budgets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-slate-400">
                    Todavía no hay trabajos saldados en este período.
                  </TableCell>
                </TableRow>
              ) : (
                data.budgets.map((b) => {
                  const repartoStatus = getRepartoStatus(b.id, asignacionesGuardadas);
                  return (
                    <TableRow key={b.id} className={`cursor-pointer transition-colors ${selectedBudget?.id === b.id ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50/80'}`} onClick={() => handleSelectBudget(b)}>
                      <TableCell className="font-medium text-slate-800">{b.clienteName}</TableCell>
                      <TableCell className="text-slate-600">{b.vendedorName}</TableCell>
                      <TableCell className="text-slate-600">#{String(b.budgetNumber).padStart(6, "0")}</TableCell>
                      <TableCell className="text-slate-600">{formatDate(b.fecha)}</TableCell>
                      <TableCell className="text-right text-slate-700">{formatCurrency(b.total, currency)}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">{formatCurrency(b.ganancia, currency)}</TableCell>
                      <TableCell className="text-center">
                        <WorkStatusBadge estado={b.estado} />
                      </TableCell>
                      <TableCell className="text-center">
                        <RepartoStatusBadge status={repartoStatus} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <p className="flex items-center gap-1.5 px-4 py-3 text-xs text-slate-400 border-t border-slate-100">
          <Info className="h-3.5 w-3.5" /> Solo se incluyen trabajos con el cobro totalmente saldado (según los recibos activos cargados).
        </p>
      </CollapsibleCard>

      {/* Trabajos que dejaron de estar saldados */}
      {(data.budgetsNoLongerCompleted?.length ?? 0) > 0 && (
        <CollapsibleCard
          defaultOpen={false}
          accentClassName="border-t-4 border-t-amber-400"
          icon={<AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />}
          title="Trabajos que dejaron de estar saldados"
          subtitle="Estaban saldados cuando se generó esta rendición, pero su cobro cambió después (ej: se anuló un recibo). No se incluyen en los totales de arriba ni en la tabla principal."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor Inicial</TableHead>
                <TableHead>N°</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ganancia</TableHead>
                <TableHead className="text-center">Estado actual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.budgetsNoLongerCompleted!.map((b) => (
                <TableRow key={b.id} className="bg-amber-50/30">
                  <TableCell className="font-medium text-slate-800">{b.clienteName}</TableCell>
                  <TableCell className="text-slate-600">{b.vendedorName}</TableCell>
                  <TableCell className="text-slate-600">#{String(b.budgetNumber).padStart(6, "0")}</TableCell>
                  <TableCell className="text-slate-600">{formatDate(b.fecha)}</TableCell>
                  <TableCell className="text-right text-slate-700">{formatCurrency(b.total, currency)}</TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">{formatCurrency(b.ganancia, currency)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Cobro pendiente
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CollapsibleCard>
      )}

      {/* Historial de Ganancias Distribuidas */}
      {asignacionesGuardadas.length > 0 && (
        <CollapsibleCard
          defaultOpen={false}
          accentClassName="border-t-4 border-t-emerald-500"
          title="Historial de Ganancias Distribuidas"
          subtitle="Agrupado por presupuesto para una auditoría limpia"
          headerRight={
            <div className="relative w-44 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por N° Presupuesto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          }
        >
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
        </CollapsibleCard>
      )}

      {asignacionesGuardadas.length > 0 && !hasAuditHistory && (
        <Card className="border-slate-200 shadow-sm border-t-4 border-t-amber-400">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Crown className="h-4 w-4 text-amber-500 shrink-0" />
              El historial detallado de quién cobró cuánto en cada presupuesto está disponible en el plan PRO.
            </div>
            <Button size="sm" variant="outline" onClick={() => setUpgradeFeature('auditHistory')}>
              Ver plan PRO
            </Button>
          </CardContent>
        </Card>
      )}

      <UpgradeModal
        feature={upgradeFeature ?? 'commissions'}
        open={!!upgradeFeature}
        onOpenChange={(open) => !open && setUpgradeFeature(null)}
      />
    </div>
  );
}