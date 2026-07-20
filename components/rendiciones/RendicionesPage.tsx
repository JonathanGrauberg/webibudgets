"use client";
//components\rendiciones\RendicionesPage.tsx
import { useMemo, useState } from "react";
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
import { Download, Info, RotateCcw, Calendar } from "lucide-react";

/* =========================================================
   Tipos — reflejan lo que devuelve el endpoint de Rendición
   (agregación ya resuelta en el server, no acá)
   ========================================================= */

export interface RendicionSellerRow {
  id: string; // RendicionSellerShare.id
  sellerId: string;
  sellerName: string;
  presupuestosCompletados: number;
  totalFacturado: number;
  ganancia: number;
  margenPromedio: number; // 0-100
  percentage: number; // % asignado, editable
  gananciaAPagar: number;
  isDefault: boolean;
}

export interface RendicionBudgetRow {
  id: string;
  clienteName: string;
  vendedorName: string;
  budgetNumber: number;
  fecha: string; // ISO date
  estado: string;
  total: number;
  costo: number;
  ganancia: number;
  margen: number; // 0-100
}

export interface RendicionData {
  id: string;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  presupuestosCompletados: number;
  totalFacturado: number;
  totalCosto: number;
  totalGanancia: number;
  margenPromedio: number;
  sellers: RendicionSellerRow[];
  budgets: RendicionBudgetRow[];
  currency?: string; // default ARS
}

interface RendicionesPageProps {
  data: RendicionData;
  onDateRangeChange?: (from: string, to: string) => void;
  onUpdatePercentage: (shareId: string, percentage: number) => void;
  onResetPercentage: (shareId: string) => void;
  onExport?: () => void;
  isLoading?: boolean;
}

/* =========================================================
   Helpers
   ========================================================= */

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

/* =========================================================
   KPI Card
   ========================================================= */

function KpiCard({
  label,
  value,
  sublabel,
  valueClassName,
}: {
  label: string;
  value: string;
  sublabel: string;
  valueClassName?: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p
          className={`mt-1 text-xl sm:text-2xl font-semibold ${
            valueClassName ?? "text-slate-900"
          }`}
        >
          {value}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">{sublabel}</p>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   Página principal
   ========================================================= */

export default function RendicionesPage({
  data,
  onDateRangeChange,
  onUpdatePercentage,
  onResetPercentage,
  onExport,
  isLoading,
}: RendicionesPageProps) {
  const currency = data.currency ?? "ARS";

  // Estado local de edición de porcentajes: se confirma en onBlur/Enter
  // para no disparar un update por cada tecla.
  const [draftPercentages, setDraftPercentages] = useState<
    Record<string, string>
  >({});

  const totalAsignado = useMemo(
    () => data.sellers.reduce((sum, s) => sum + s.percentage, 0),
    [data.sellers]
  );
  const totalGananciaAPagar = useMemo(
    () => data.sellers.reduce((sum, s) => sum + s.gananciaAPagar, 0),
    [data.sellers]
  );
  const asignacionDesbalanceada = Math.abs(totalAsignado - 100) > 0.05;

  function commitPercentage(shareId: string, raw: string) {
    const parsed = Number(raw.replace(",", "."));
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      onUpdatePercentage(shareId, parsed);
    }
    setDraftPercentages((prev) => {
      const next = { ...prev };
      delete next[shareId];
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Rendiciones</h1>
          <p className="mt-1 text-sm text-slate-500">
            Resumen de presupuestos completados y distribución de ganancias
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() =>
              onDateRangeChange?.(data.periodStart, data.periodEnd)
            }
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Calendar className="h-4 w-4 text-slate-400" />
            {formatDate(data.periodStart)} - {formatDate(data.periodEnd)}
          </button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={onExport}
            disabled={isLoading}
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Presupuestos completados"
          value={String(data.presupuestosCompletados)}
          sublabel="Total en el período"
        />
        <KpiCard
          label="Total facturado"
          value={formatCurrency(data.totalFacturado, currency)}
          sublabel="100% del total"
          valueClassName="text-emerald-600"
        />
        <KpiCard
          label="Costo total"
          value={formatCurrency(data.totalCosto, currency)}
          sublabel={`${((data.totalCosto / (data.totalFacturado || 1)) * 100).toFixed(
            1
          )}% del facturado`}
          valueClassName="text-blue-600"
        />
        <KpiCard
          label="Ganancia total"
          value={formatCurrency(data.totalGanancia, currency)}
          sublabel={`${data.margenPromedio.toFixed(1)}% del facturado`}
          valueClassName="text-emerald-600"
        />
        <KpiCard
          label="Margen promedio"
          value={formatPercent(data.margenPromedio)}
          sublabel="Promedio general"
          valueClassName="text-purple-600"
        />
      </div>

      {/* Rendición por vendedor + Distribución */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Rendición por vendedor */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Rendición por vendedor (presupuestos completados)
            </h2>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Presup.</TableHead>
                  <TableHead className="text-right">Facturado</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sellers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {s.sellerName
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                        {s.sellerName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-600">
                      {s.presupuestosCompletados}
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-600">
                      {formatCurrency(s.totalFacturado, currency)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-emerald-600">
                      {formatCurrency(s.ganancia, currency)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-purple-600">
                      {formatPercent(s.margenPromedio)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-50 font-semibold">
                  <TableCell>Total general</TableCell>
                  <TableCell className="text-right">
                    {data.presupuestosCompletados}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(data.totalFacturado, currency)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-700">
                    {formatCurrency(data.totalGanancia, currency)}
                  </TableCell>
                  <TableCell className="text-right text-purple-700">
                    {formatPercent(data.margenPromedio)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Distribución de ganancias */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              Distribución de ganancias (pago a vendedores)
              <Info className="h-3.5 w-3.5 text-slate-400" />
            </h2>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Editá los porcentajes para definir cómo se distribuye la
              ganancia total entre los vendedores.
            </div>

            <div className="space-y-2">
              {data.sellers.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {s.sellerName
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                    {s.sellerName}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-20">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={draftPercentages[s.id] ?? s.percentage}
                        onChange={(e) =>
                          setDraftPercentages((prev) => ({
                            ...prev,
                            [s.id]: e.target.value,
                          }))
                        }
                        onBlur={(e) => commitPercentage(s.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            commitPercentage(s.id, e.currentTarget.value);
                            e.currentTarget.blur();
                          }
                        }}
                        className="pr-6 text-right"
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        %
                      </span>
                    </div>

                    <span className="w-28 text-right text-sm font-semibold text-emerald-600">
                      {formatCurrency(s.gananciaAPagar, currency)}
                    </span>

                    {!s.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-700"
                        onClick={() => onResetPercentage(s.id)}
                        title="Volver al valor por defecto"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
              <span className="font-medium text-slate-600">
                Total asignado
              </span>
              <div className="flex items-center gap-4">
                <span
                  className={`font-semibold ${
                    asignacionDesbalanceada ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {formatPercent(totalAsignado)}
                </span>
                <span className="font-semibold text-emerald-700">
                  {formatCurrency(totalGananciaAPagar, currency)}
                </span>
              </div>
            </div>
            {asignacionDesbalanceada && (
              <p className="text-xs text-red-600">
                Los porcentajes asignados no suman 100%.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detalle de presupuestos completados */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Detalle de presupuestos completados
          </h2>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>N°</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Ganancia</TableHead>
                <TableHead className="text-right">Margen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.budgets.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium text-slate-800">
                    {b.clienteName}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {b.vendedorName}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    #{String(b.budgetNumber).padStart(6, "0")}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatDate(b.fecha)}
                  </TableCell>
                  <TableCell>
                    <Badge className="border-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      {b.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-700">
                    {formatCurrency(b.total, currency)}
                  </TableCell>
                  <TableCell className="text-right text-slate-500">
                    {formatCurrency(b.costo, currency)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">
                    {formatCurrency(b.ganancia, currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="border-none bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      {formatPercent(b.margen)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Info className="h-3.5 w-3.5" />
        Solo se incluyen presupuestos con estado &quot;Completado&quot;.
      </p>
    </div>
  );
}