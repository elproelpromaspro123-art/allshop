"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ActionCard } from "@/components/ui/ActionCard";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import type { AdminDashboardPayload, ApiResponse } from "@/types/api";

const currencyFormatter = new Intl.NumberFormat("es-CO");
const percentFormatter = new Intl.NumberFormat("es-CO", {
  style: "percent",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return `$${currencyFormatter.format(Math.max(0, Math.floor(value || 0)))}`;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const refreshingRef = useRef(false);

  const loadMetrics = useCallback(async (signal?: AbortSignal) => {
    if (refreshingRef.current) return;

    refreshingRef.current = true;
    setRefreshing(true);

    try {
      const response = await fetch("/api/admin/metrics", {
        cache: "no-store",
        signal,
      });
      const payload = (await response.json()) as ApiResponse<AdminDashboardPayload>;

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(
          payload.error || "No se pudieron cargar las metricas operativas.",
        );
      }

      setMetrics(payload.data);
      setError(null);
      setLastUpdated(new Date().toISOString());
    } catch (loadError) {
      if ((loadError as Error).name === "AbortError") return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar las metricas operativas.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadMetrics(controller.signal);
    const timer = window.setInterval(() => void loadMetrics(), 45_000);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [loadMetrics]);

  const recentOrders = metrics?.recentOrders ?? [];

  const attentionCount =
    (metrics?.pendingOrders || 0) + (metrics?.processingOrders || 0);
  const logisticsCount =
    (metrics?.shippedOrders || 0) + (metrics?.deliveredOrders || 0);
  const inventoryPressure = metrics?.inventoryPressure || 0;
  const catalogCoverage = metrics?.catalogCoverage || 0;
  const lastUpdatedLabel = lastUpdated
    ? new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(lastUpdated))
    : "sin datos";

  const columns = useMemo<DataTableColumn<AdminDashboardPayload["recentOrders"][number]>[]>(
    () => [
      {
        key: "id",
        header: "Pedido",
        render: (order) => (
          <div className="grid gap-1">
            <p className="font-semibold text-gray-900">
              {order.customer_name || "Cliente sin nombre"}
            </p>
            <p className="font-mono text-xs text-gray-400">{order.id.slice(0, 8)}...</p>
          </div>
        ),
      },
      {
        key: "total",
        header: "Total",
        render: (order) => (
          <span className="font-semibold text-gray-900">
            {formatCurrency(order.total)}
          </span>
        ),
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

  if (loading) {
    return (
      <AdminShell
        eyebrow="Panel operativo"
        title="Dashboard"
        description="Cargando resumen general del estado actual de la tienda."
      >
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm">
          Cargando metricas operativas...
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
          description={error || "No se pudieron cargar las metricas del panel."}
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
      description="Lectura clara del pulso comercial y logistico para decidir rapido sin ruido."
      toolbar={
        <>
          <span suppressHydrationWarning className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500">
            Actualizado {lastUpdatedLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadMetrics()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualizando" : "Refrescar"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={DollarSign}
          label="Ingresos"
          value={formatCurrency(metrics.totalRevenue)}
          detail={`${formatCurrency(metrics.recentRevenue)} en los ultimos 7 dias`}
          tone="emerald"
        />
        <MetricCard
          icon={ShoppingBag}
          label="Pedidos"
          value={metrics.totalOrders}
          detail={`${metrics.ordersThisWeek} esta semana`}
          tone="indigo"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Ticket promedio"
          value={formatCurrency(metrics.averageOrderValue)}
          detail={`${percentFormatter.format(metrics.fulfillmentRate)} entregado`}
          tone="emerald"
        />
        <MetricCard
          icon={Package}
          label="Catalogo activo"
          value={metrics.activeProducts}
          detail={`${metrics.inactiveProducts} inactivos · ${metrics.lowStockProducts} con stock bajo`}
          tone={metrics.lowStockProducts > 0 ? "amber" : "indigo"}
        />
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white px-5 py-5 shadow-sm sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              Radar operativo
            </p>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Riesgo y cobertura del dia
            </h2>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {percentFormatter.format(catalogCoverage)} cobertura activa
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SnapshotCard
            label="Cola operativa"
            value={attentionCount}
            detail={`${metrics.pendingOrders} pendientes · ${metrics.processingOrders} procesando`}
            tone="amber"
          />
          <SnapshotCard
            label="En ruta o entregados"
            value={logisticsCount}
            detail={`${metrics.shippedOrders} enviados · ${metrics.deliveredOrders} entregados`}
            tone="indigo"
          />
          <SnapshotCard
            label="Presion de inventario"
            value={inventoryPressure}
            detail={`${metrics.lowStockProducts} bajos · ${metrics.outOfStockProducts} agotados`}
            tone={inventoryPressure > 0 ? "amber" : "emerald"}
          />
          <SnapshotCard
            label="Cobertura de catalogo"
            value={Math.round(catalogCoverage * 100)}
            suffix="%"
            detail={`${metrics.activeProducts} activos · ${metrics.inactiveProducts} inactivos`}
            tone="emerald"
          />
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-5">
          {[
            { status: "pending", label: "Pendientes", note: "Requieren validacion", value: metrics.pendingOrders },
            { status: "processing", label: "Procesando", note: "En alistamiento", value: metrics.processingOrders },
            { status: "shipped", label: "Enviados", note: "Ya salieron", value: metrics.shippedOrders },
            { status: "delivered", label: "Entregados", note: "Completados", value: metrics.deliveredOrders },
            { status: "cancelled", label: "Cancelados", note: "Bloquean flujo", value: metrics.cancelledOrders },
          ].map((item) => (
            <div
              key={item.status}
              className="rounded-[1.1rem] border border-gray-100 bg-gray-50/85 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                  {item.label}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-gray-500">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                Radar operativo
              </p>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Flujo del dia
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/panel-privado/orders">Ver pedidos</Link>
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SnapshotCard
              label="Atencion inmediata"
              value={attentionCount}
              detail={`${metrics.pendingOrders} pendientes · ${metrics.processingOrders} procesando`}
              tone="amber"
            />
            <SnapshotCard
              label="En ruta o entregados"
              value={logisticsCount}
              detail={`${metrics.shippedOrders} enviados · ${metrics.deliveredOrders} entregados`}
              tone="indigo"
            />
            <SnapshotCard
              label="Riesgo de catalogo"
              value={metrics.outOfStockProducts}
              detail={`${metrics.lowStockProducts} bajos y ${metrics.cancelledOrders} cancelados`}
              tone={metrics.outOfStockProducts > 0 ? "amber" : "emerald"}
            />
          </div>

          <div className="mt-5 rounded-[1.75rem] border border-gray-100 bg-gray-50/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                  Cumplimiento real
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {percentFormatter.format(metrics.fulfillmentRate)} del total ya fue entregado
                </p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {metrics.deliveredOrders} entregados
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#10b981_0%,#34d399_100%)]"
                style={{
                  width: `${Math.min(100, Math.max(6, metrics.fulfillmentRate * 100))}%`,
                }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
              <span>{metrics.processingOrders} procesando</span>
              <span>·</span>
              <span>{metrics.shippedOrders} enviados</span>
              <span>·</span>
              <span>{metrics.pendingOrders} por validar</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <ActionCard
            icon={Package}
            title="Inventario sensible"
            description={
              metrics.lowStockProducts > 0
                ? `${metrics.lowStockProducts} productos requieren revision hoy y ${metrics.outOfStockProducts} ya estan agotados.`
                : "No hay alertas criticas de stock. El catalogo esta respirando bien."
            }
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/panel-privado/inventory">Revisar inventario</Link>
              </Button>
            }
          />
          <ActionCard
            icon={Truck}
            title="Mesa de despacho"
            description={`${metrics.pendingOrders} pedidos pendientes y ${metrics.processingOrders} en proceso aun necesitan seguimiento operativo.`}
            tone="dark"
            action={
              <Button asChild size="sm">
                <Link href="/panel-privado/orders">Abrir pedidos</Link>
              </Button>
            }
          />
        </div>
      </section>

      <div className="rounded-2xl border border-gray-100 bg-white px-5 py-5 shadow-sm sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              Actividad reciente
            </p>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Pedidos recientes
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span>{recentOrders.length} visibles</span>
            <span>·</span>
            <span>{formatCurrency(metrics.recentRevenue)} esta semana</span>
          </div>
        </div>

        <DataTable
          rows={recentOrders}
          columns={columns}
          getRowKey={(order) => order.id}
          renderMobileRow={(order) => (
            <article className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
              <div className="grid gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {order.customer_name || "Cliente sin nombre"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-gray-400">
                      {order.id.slice(0, 8)}...
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(order.total)}
                </p>
                <p suppressHydrationWarning className="text-xs text-gray-500">
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
              description="Cuando entren nuevos pedidos apareceran aqui para revision rapida."
            />
          }
        />
      </div>
    </AdminShell>
  );
}

function SnapshotCard({
  label,
  value,
  detail,
  tone,
  suffix = "",
}: {
  label: string;
  value: number;
  detail: string;
  tone: "amber" | "emerald" | "indigo";
  suffix?: string;
}) {
  const toneClasses = {
    amber: "border-amber-200 bg-amber-50/70 text-amber-900",
    emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-900",
    indigo: "border-indigo-200 bg-indigo-50/70 text-indigo-900",
  } as const;

  return (
    <article className={`rounded-[1.5rem] border px-4 py-4 ${toneClasses[tone]}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight">
        {value}
        {suffix}
      </p>
      <p className="mt-1 text-sm opacity-80">{detail}</p>
    </article>
  );
}
