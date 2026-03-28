"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { AdminInventoryRow, ApiResponse } from "@/types/api";

const currencyFormatter = new Intl.NumberFormat("es-CO");
const INVENTORY_FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "low", label: "Stock bajo" },
  { value: "out", label: "Agotados" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
] as const;

export default function AdminInventory() {
  const [products, setProducts] = useState<AdminInventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const refreshingRef = useRef(false);

  const fetchInventory = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);

    try {
      const res = await fetch("/api/admin/inventory", { cache: "no-store" });
      const payload = (await res.json()) as ApiResponse<AdminInventoryRow[]>;

      if (!res.ok || !payload.ok || !Array.isArray(payload.data)) {
        throw new Error(
          payload.error || "No se pudo cargar el inventario operativo.",
        );
      }

      setProducts(payload.data);
      setError(null);
      setLastUpdated(new Date().toISOString());
    } catch (loadError) {
      setProducts([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el inventario operativo.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void fetchInventory();
    const timer = window.setInterval(() => void fetchInventory(), 60_000);
    return () => window.clearInterval(timer);
  }, [fetchInventory]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesStock =
          stockFilter === "all"
            ? true
            : stockFilter === "low"
              ? product.stock <= 5 && product.stock > 0
              : stockFilter === "out"
                ? product.stock === 0
                : stockFilter === "active"
                  ? product.is_active
                  : !product.is_active;

        const normalizedSearch = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
          product.id.toLowerCase().includes(normalizedSearch) ||
          product.name.toLowerCase().includes(normalizedSearch) ||
          product.slug.toLowerCase().includes(normalizedSearch);

        return matchesStock && matchesSearch;
      }),
    [products, searchTerm, stockFilter],
  );

  const lowStockCount = products.filter(
    (product) => product.stock > 0 && product.stock <= 5,
  ).length;
  const outOfStockCount = products.filter((product) => product.stock === 0).length;
  const activeCount = products.filter((product) => product.is_active).length;
  const inactiveCount = products.filter((product) => !product.is_active).length;
  const visibleUnits = filteredProducts.reduce((sum, product) => sum + product.stock, 0);
  const visibleValue = filteredProducts.reduce((sum, product) => sum + product.price, 0);
  const coverageRate = products.length > 0 ? activeCount / products.length : 0;
  const lastUpdatedLabel = lastUpdated
    ? new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(lastUpdated))
    : "sin datos";

  const columns = useMemo<DataTableColumn<AdminInventoryRow>[]>(
    () => [
      {
        key: "product",
        header: "Producto",
        render: (product) => (
          <div className="grid gap-1">
            <p className="font-semibold text-gray-900">{product.name}</p>
            <p className="font-mono text-xs text-gray-400">{product.slug}</p>
          </div>
        ),
      },
      {
        key: "price",
        header: "Precio",
        render: (product) => (
          <span className="font-semibold text-gray-900">
            ${currencyFormatter.format(product.price)}
          </span>
        ),
      },
      {
        key: "stock",
        header: "Stock",
        render: (product) => <StockPill stock={product.stock} />,
      },
      {
        key: "status",
        header: "Estado",
        render: (product) => (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
              product.is_active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            {product.is_active ? "Activo" : "Inactivo"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <AdminShell
      eyebrow="Panel operativo"
      title="Inventario"
      description="Lectura rapida del stock operativo real y del estado del catalogo con una vista consistente en desktop y movil."
      toolbar={
        <>
          <span suppressHydrationWarning className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500">
            Actualizado {lastUpdatedLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchInventory()}
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
          icon={Package}
          label="Productos"
          value={products.length}
          detail="Catalogo total"
          tone="indigo"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Stock bajo"
          value={lowStockCount}
          detail="Cinco unidades o menos"
          tone="amber"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Agotados"
          value={outOfStockCount}
          detail="Sin disponibilidad"
          tone="amber"
        />
        <MetricCard
          icon={CheckCircle}
          label="Activos"
          value={activeCount}
          detail={`${inactiveCount} inactivos · ${Math.round(coverageRate * 100)}% cobertura`}
          tone="emerald"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InventoryStat
          label="Activos"
          value={activeCount}
          tone="emerald"
          detail={`${Math.round(coverageRate * 100)}% del catalogo`}
        />
        <InventoryStat
          label="Inactivos"
          value={inactiveCount}
          tone="indigo"
          detail="Fuera de la vitrina"
        />
        <InventoryStat
          label="Alerta"
          value={lowStockCount + outOfStockCount}
          tone="amber"
          detail={`${lowStockCount} bajos · ${outOfStockCount} agotados`}
        />
        <InventoryStat
          label="Cobertura"
          value={Math.round(coverageRate * 100)}
          tone="emerald"
          detail="Catalogo visible"
          suffix="%"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-5 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            name="inventory-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por id, nombre o slug"
            label="Buscar producto"
            icon={<Search className="h-4 w-4" />}
          />

          <label className="grid gap-2 text-sm font-medium text-gray-700">
            Filtrar estado
            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-colors focus:border-emerald-700 focus:ring-4 focus:ring-emerald-500/12"
            >
              {INVENTORY_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {INVENTORY_FILTER_OPTIONS.map((option) => {
              const active = stockFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStockFilter(option.value)}
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
            {filteredProducts.length} visibles · {visibleUnits} unidades activas · ${currencyFormatter.format(visibleValue)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-6 py-10 text-center text-sm text-gray-500">
          Cargando inventario...
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="No fue posible cargar el inventario"
          description={error}
          action={
            <Button onClick={() => void fetchInventory()} disabled={refreshing}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <DataTable
          rows={filteredProducts}
          columns={columns}
          getRowKey={(product) => product.id}
          renderMobileRow={(product) => (
            <article className="rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-4">
              <div className="grid gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    <p className="mt-1 font-mono text-xs text-gray-400">{product.slug}</p>
                  </div>
                  <StockPill stock={product.stock} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-gray-900">
                    ${currencyFormatter.format(product.price)}
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      product.is_active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {product.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </article>
          )}
          emptyState={
            <EmptyState
              icon={Package}
              title="No hay productos para mostrar"
              description="Ajusta los filtros o vuelve a cargar el catalogo operativo."
            />
          }
        />
      )}
    </AdminShell>
  );
}

function InventoryStat({
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
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-900",
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

function StockPill({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        Agotado
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
        {stock} unidades
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      {stock} unidades
    </span>
  );
}
