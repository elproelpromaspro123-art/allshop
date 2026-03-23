"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Filter, RefreshCw, Search, ShoppingBag } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AdminOrderRow, ApiResponse } from "@/types/api";

const currencyFormatter = new Intl.NumberFormat("es-CO");

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const payload = (await res.json()) as ApiResponse<AdminOrderRow[]>;

      if (!res.ok || !payload.ok || !Array.isArray(payload.data)) {
        throw new Error(payload.error || "No se pudieron cargar los pedidos.");
      }

      setOrders(payload.data);
      setError(null);
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
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
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
  const deliveredCount = orders.filter((order) => order.status === "delivered").length;

  const columns = useMemo<DataTableColumn<AdminOrderRow>[]>(
    () => [
      {
        key: "customer",
        header: "Cliente",
        render: (order) => (
          <div className="grid gap-1">
            <p className="font-semibold text-[var(--foreground)]">{order.customer_name}</p>
            <p className="text-xs text-[var(--muted-soft)]">{order.email}</p>
            <p className="text-xs text-[var(--muted-soft)]">{order.phone}</p>
          </div>
        ),
      },
      {
        key: "total",
        header: "Total",
        render: (order) => (
          <span className="font-semibold text-[var(--foreground)]">
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
          <span className="text-[var(--muted)]">
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
      description="Búsqueda, filtros y estado del pedido con el mismo contrato de datos en UI y API."
      toolbar={
        <Button variant="outline" size="sm" onClick={() => void fetchOrders()} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Actualizando" : "Actualizar"}
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={ShoppingBag} label="Pedidos" value={orders.length} detail="Total registrados" tone="indigo" />
        <MetricCard icon={Filter} label="Pendientes" value={pendingCount} detail="Requieren seguimiento" tone="amber" />
        <MetricCard icon={RefreshCw} label="Entregados" value={deliveredCount} detail="Estados completados" tone="emerald" />
      </div>

      <div className="panel-surface px-5 py-5 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <Input
            name="orders-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por cliente, correo o teléfono"
            label="Buscar pedido"
            icon={<Search className="h-4 w-4" />}
          />

          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            Filtrar estado
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-12 rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent-strong)] focus:ring-4 focus:ring-[var(--accent-ring)]"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="processing">Procesando</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="panel-surface px-6 py-10 text-center text-sm text-[var(--muted)]">
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
            <article className="panel-surface px-4 py-4">
              <div className="grid gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{order.customer_name}</p>
                    <p className="mt-1 text-xs text-[var(--muted-soft)]">{order.email}</p>
                    <p className="text-xs text-[var(--muted-soft)]">{order.phone}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-[var(--foreground)]">
                    ${currencyFormatter.format(order.total)}
                  </span>
                  <span className="text-[var(--muted)]">
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
              description="Ajusta la búsqueda o el filtro para volver a encontrar pedidos."
            />
          }
        />
      )}
    </AdminShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    processing: "border-sky-200 bg-sky-50 text-sky-800",
    shipped: "border-indigo-200 bg-indigo-50 text-indigo-800",
    delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
    cancelled: "border-red-200 bg-red-50 text-red-800",
    refunded: "border-slate-200 bg-slate-50 text-slate-700",
  };

  const labels: Record<string, string> = {
    pending: "Pendiente",
    processing: "Procesando",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${colors[status] || "border-slate-200 bg-slate-50 text-slate-700"}`}
    >
      {labels[status] || status}
    </span>
  );
}
