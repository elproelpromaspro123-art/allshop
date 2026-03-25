"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, DollarSign, Package, ShoppingBag } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { ActionCard } from "@/components/ui/ActionCard";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { AdminDashboardPayload, ApiResponse } from "@/types/api";

const currencyFormatter = new Intl.NumberFormat("es-CO");

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/metrics", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las métricas operativas.");
        return res.json();
      })
      .then((payload: ApiResponse<AdminDashboardPayload>) => {
        if (!payload.ok || !payload.data) {
          throw new Error(
            payload.error || "No se pudieron cargar las métricas operativas.",
          );
        }
        setMetrics(payload.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudieron cargar las métricas operativas.");
        setLoading(false);
      });
  }, []);

  const recentOrders = metrics?.recentOrders ?? [];

  const columns = useMemo<DataTableColumn<AdminDashboardPayload["recentOrders"][number]>[]>(
    () => [
      {
        key: "id",
        header: "Pedido",
        render: (order) => (
          <div className="grid gap-1">
            <p className="font-semibold text-gray-900">{order.customer_name || "Cliente sin nombre"}</p>
            <p className="font-mono text-xs text-gray-400">{order.id.slice(0, 8)}...</p>
          </div>
        ),
      },
      {
        key: "total",
        header: "Total",
        render: (order) => <span className="font-semibold text-gray-900">${currencyFormatter.format(order.total)}</span>,
      },
      {
        key: "status",
        header: "Estado",
        render: (order) => <StatusBadge status={order.status} />,
      },
      {
        key: "created",
        header: "Fecha",
        render: (order) => (
          <span className="text-gray-500">
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

  if (loading) {
    return (
      <AdminShell
        eyebrow="Panel operativo"
        title="Dashboard"
        description="Cargando resumen general del estado actual de la tienda."
      >
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-6 py-10 text-center text-sm text-gray-500">
          Cargando métricas operativas...
        </div>
      </AdminShell>
    );
  }

  if (error || !metrics) {
    return (
      <AdminShell
        eyebrow="Panel operativo"
        title="Dashboard"
        description="Resumen general del estado de pedidos, ingresos y alertas."
      >
        <EmptyState
          icon={AlertCircle}
          title="No fue posible cargar el dashboard"
          description={error || "No se pudieron cargar las métricas del panel."}
          action={
            <Button asChild>
              <Link href="/panel-privado/orders">Ir a pedidos</Link>
            </Button>
          }
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      eyebrow="Panel operativo"
      title="Dashboard"
      description="Resumen claro de ventas, pedidos y alertas para actuar rápido sin ruido visual."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={DollarSign}
          label="Ingresos"
          value={`$${currencyFormatter.format(metrics.totalRevenue)}`}
          detail="Total acumulado"
          tone="emerald"
        />
        <MetricCard
          icon={ShoppingBag}
          label="Pedidos"
          value={metrics.totalOrders}
          detail="Todos los estados"
          tone="indigo"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Completados"
          value={metrics.deliveredOrders}
          detail="Entregados con éxito"
          tone="emerald"
        />
        <MetricCard
          icon={Package}
          label="Stock bajo"
          value={metrics.lowStockProducts}
          detail="Productos que requieren revisión"
          tone="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-5 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Actividad reciente</p>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl text-gray-900">Pedidos recientes</h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/panel-privado/orders">Ver pedidos</Link>
            </Button>
          </div>

          <DataTable
            rows={recentOrders}
            columns={columns}
            getRowKey={(order) => order.id}
            renderMobileRow={(order) => (
              <article className="rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-4">
                <div className="grid gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{order.customer_name || "Cliente sin nombre"}</p>
                      <p className="mt-1 font-mono text-xs text-gray-400">{order.id.slice(0, 8)}...</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">${currencyFormatter.format(order.total)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </article>
            )}
            emptyState={
              <EmptyState
                icon={ShoppingBag}
                title="Sin pedidos recientes"
                description="Cuando entren nuevos pedidos aparecerán aquí para revisión rápida."
              />
            }
          />
        </div>

        <div className="grid gap-4">
          <ActionCard
            icon={AlertCircle}
            title="Atención inmediata"
            description={
              metrics.lowStockProducts > 0
                ? `${metrics.lowStockProducts} productos tienen stock bajo y deberían revisarse hoy.`
                : "No hay alertas críticas de stock por el momento."
            }
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/panel-privado/inventory">Revisar inventario</Link>
              </Button>
            }
          />
          <ActionCard
            icon={ShoppingBag}
            title="Pedidos pendientes"
            description={`${metrics.pendingOrders} pedidos siguen esperando gestión o validación.`}
            tone="dark"
            action={
              <Button asChild size="sm">
                <Link href="/panel-privado/orders">Abrir pedidos</Link>
              </Button>
            }
          />
        </div>
      </div>
    </AdminShell>
  );
}
