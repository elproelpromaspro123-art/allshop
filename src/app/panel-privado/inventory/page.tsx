"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Package, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import type { ApiResponse } from "@/types/api";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  is_active: boolean;
  category_id: string;
}

const currencyFormatter = new Intl.NumberFormat("es-CO");

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockFilter, setStockFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/admin/inventory")
      .then((res) => res.json())
      .then((payload: ApiResponse<Product[]>) => {
        setProducts(
          payload.ok && Array.isArray(payload.data) ? payload.data : [],
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesStock =
          stockFilter === "all"
            ? true
            : stockFilter === "low"
              ? product.stock <= 5
              : stockFilter === "out"
                ? product.stock === 0
                : stockFilter === "active"
                  ? product.is_active
                  : !product.is_active;

        const normalizedSearch = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
          product.name.toLowerCase().includes(normalizedSearch) ||
          product.slug.toLowerCase().includes(normalizedSearch);

        return matchesStock && matchesSearch;
      }),
    [products, searchTerm, stockFilter],
  );

  const lowStockCount = products.filter((product) => product.stock <= 5).length;
  const outOfStockCount = products.filter((product) => product.stock === 0).length;
  const activeCount = products.filter((product) => product.is_active).length;

  const columns = useMemo<DataTableColumn<Product>[]>(
    () => [
      {
        key: "product",
        header: "Producto",
        render: (product) => (
          <div className="grid gap-1">
            <p className="font-semibold text-[var(--foreground)]">{product.name}</p>
            <p className="font-mono text-xs text-[var(--muted-soft)]">{product.slug}</p>
          </div>
        ),
      },
      {
        key: "price",
        header: "Precio",
        render: (product) => (
          <span className="font-semibold text-[var(--foreground)]">${currencyFormatter.format(product.price)}</span>
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
      description="Lectura rápida de stock y estado del catálogo con un patrón usable tanto en desktop como en móvil."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Package} label="Productos" value={products.length} detail="Catálogo total" tone="indigo" />
        <MetricCard icon={AlertTriangle} label="Stock bajo" value={lowStockCount} detail="Cinco unidades o menos" tone="amber" />
        <MetricCard icon={AlertTriangle} label="Agotados" value={outOfStockCount} detail="Sin disponibilidad" tone="amber" />
        <MetricCard icon={CheckCircle} label="Activos" value={activeCount} detail="Publicados y visibles" tone="emerald" />
      </div>

      <div className="panel-surface px-5 py-5 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            name="inventory-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nombre o slug"
            label="Buscar producto"
            icon={<Search className="h-4 w-4" />}
          />

          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            Filtrar estado
            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              className="h-12 rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent-strong)] focus:ring-4 focus:ring-[var(--accent-ring)]"
            >
              <option value="all">Todos los productos</option>
              <option value="low">Stock bajo</option>
              <option value="out">Sin stock</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="panel-surface px-6 py-10 text-center text-sm text-[var(--muted)]">
          Cargando inventario...
        </div>
      ) : (
        <DataTable
          rows={filteredProducts}
          columns={columns}
          getRowKey={(product) => product.id}
          renderMobileRow={(product) => (
            <article className="panel-surface px-4 py-4">
              <div className="grid gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{product.name}</p>
                    <p className="mt-1 font-mono text-xs text-[var(--muted-soft)]">{product.slug}</p>
                  </div>
                  <StockPill stock={product.stock} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-[var(--foreground)]">${currencyFormatter.format(product.price)}</span>
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
              description="Ajusta los filtros o vuelve a cargar el catálogo operativo."
            />
          }
        />
      )}
    </AdminShell>
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
