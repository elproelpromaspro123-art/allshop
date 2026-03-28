"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Filter,
  RefreshCw,
  Search,
  ShoppingBag,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AdminOrderRow, ApiResponse } from "@/types/api";

const currencyFormatter = new Intl.NumberFormat("es-CO");
const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "processing", label: "Procesando" },
  { value: "shipped", label: "Enviados" },
  { value: "delivered", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
] as const;

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const refreshingRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);

    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const payload = (await res.json()) as ApiResponse<AdminOrderRow[]>;

      if (!res.ok || !payload.ok || !Array.isArray(payload.data)) {
        throw new Error(payload.error || "No se pudieron cargar los pedidos.");
      }

      setOrders(payload.data);
      setError(null);
      setLastUpdated(new Date().toISOString());
    } catch (loadError) {
      setOrders([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los pedidos.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
    const timer = window.setInterval(() => void fetchOrders(), 45_000);
    return () => window.clearInterval(timer);
  }, [fetchOrders]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
          order.id.toLowerCase().includes(normalizedSearch) ||
          order.customer_name.toLowerCase().includes(normalizedSearch) ||
          order.email.toLowerCase().includes(normalizedSearch) ||
          order.phone.includes(searchTerm);

        const matchesStatus =
          statusFilter === "all" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [orders, searchTerm, statusFilter],
  );

  const pendingCount = orders.filter((order) => order.status === "pending").length;
  const processingCount = orders.filter(
    (order) => order.status === "processing",
  ).length;
  const shippedCount = orders.filter((order) => order.status === "shipped").length;
  const deliveredCount = orders.filter((order) => order.status === "delivered").length;
  const cancelledCount = orders.filter((order) => order.status === "cancelled").length;
  const visibleRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const lastUpdatedLabel = lastUpdated
    ? new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(lastUpdated))
    : "sin datos";

  const columns = useMemo<DataTableColumn<AdminOrderRow>[]>(
    () => [
      {
        key: "customer",
        header: "Cliente",
        render: (order) => (
          <div className="grid gap-1">
            <p className="font-semibold text-gray-900">{order.customer_name}</p>
            <p className="text-xs text-gray-400">{order.email}</p>
            <p className="text-xs text-gray-400">{order.phone}</p>
          </div>
        ),
      },
      {
        key: "total",
        header: "Total",
        render: (order) => (
          <span className="font-semibold text-gray-900">
            ${currencyFormatter.format(order.total)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Estado",
        render: (order) => <StatusBadge status={order.status} />,
      },
      {
        key: "date",
        header: "Fecha",
        render: (order) => (
          <span suppressHydrationWarning className="text-gray-500">
            {new Date(order.created_at).toLocaleDateString("es-CO", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <AdminShell
      eyebrow="Panel operativo"
      title="Pedidos"
      description="Busqueda, filtros y estado del pedido con el mismo contrato de datos en UI y API."
      toolbar={
        <>
          <span suppressHydrationWarning className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500">
            Actualizado {lastUpdatedLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchOrders()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualizando" : "Actualizar"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ShoppingBag}
          label="Pedidos"
          value={orders.length}
          detail="Total registrados"
          tone="indigo"
        />
        <MetricCard
          icon={Filter}
          label="Pendientes"
          value={pendingCount}
          detail="Requieren seguimiento"
          tone="amber"
        />
        <MetricCard
          icon={RefreshCw}
          label="Procesando"
          value={processingCount}
          detail={`${shippedCount} en ruta ahora`}
          tone="indigo"
        />
        <MetricCard
          icon={RefreshCw}
          label="Entregados"
          value={deliveredCount}
          detail={`${cancelledCount} cancelados`}
          tone="emerald"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatusSummary label="Pendientes" value={pendingCount} tone="amber" />
        <StatusSummary label="Procesando" value={processingCount} tone="sky" />
        <StatusSummary label="Enviados" value={shippedCount} tone="indigo" />
        <StatusSummary label="Cancelados" value={cancelledCount} tone="emerald" />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-5 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <Input
            name="orders-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por id, cliente, correo o telefono"
            label="Buscar pedido"
            icon={<Search className="h-4 w-4" />}
          />

          <label className="grid gap-2 text-sm font-medium text-gray-700">
            Filtrar estado
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-colors focus:border-emerald-700 focus:ring-4 focus:ring-emerald-500/12"
            >
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUS_OPTIONS.map((option) => {
              const active = statusFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500">
            {filteredOrders.length} visibles · ${currencyFormatter.format(visibleRevenue)} · {cancelledCount} cancelados
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-6 py-10 text-center text-sm text-gray-500">
          Cargando pedidos...
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="No fue posible cargar los pedidos"
          description={error}
          action={
            <Button onClick={() => void fetchOrders()}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <DataTable
          rows={filteredOrders}
          columns={columns}
          getRowKey={(order) => order.id}
          renderMobileRow={(order) => (
            <article className="rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-4">
              <div className="grid gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{order.customer_name}</p>
                    <p className="mt-1 text-xs text-gray-400">{order.email}</p>
                    <p className="text-xs text-gray-400">{order.phone}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-gray-900">
                    ${currencyFormatter.format(order.total)}
                  </span>
                   <span suppressHydrationWarning className="text-gray-500">
                     {new Date(order.created_at).toLocaleDateString("es-CO", {
                       year: "numeric",
                       month: "short",
                       day: "numeric",
                     })}
                   </span>
                </div>
              </div>
            </article>
          )}
          emptyState={
            <EmptyState
              icon={ShoppingBag}
              title="No hay pedidos coincidentes"
              description="Ajusta la busqueda o el filtro para volver a encontrar pedidos."
            />
          }
        />
      )}
    </AdminShell>
  );
}

function StatusSummary({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "sky" | "indigo" | "emerald";
}) {
  const toneClasses = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  } as const;

  return (
    <article className={`rounded-[1.1rem] border px-4 py-3 ${toneClasses[tone]}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold tracking-tight">{value}</p>
    </article>
  );
}
