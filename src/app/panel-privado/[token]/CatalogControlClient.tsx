"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  CircleAlert,
  Loader2,
  PackageSearch,
  RefreshCcw,
  Sparkles,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ControlEmptyState } from "@/components/admin/control/ControlEmptyState";
import { ControlStatCard } from "@/components/admin/control/ControlStatCard";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { cn } from "@/lib/utils";

const OrderControlPanel = dynamic(() => import("./OrderControlPanel"), {
  loading: () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">
      Cargando gestion de pedidos...
    </div>
  ),
});

interface ControlVariant {
  name: string;
  stock: number | null;
  variation_id: number | null;
}

interface ControlRow {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  compare_at_price: number | null;
  discount_percent: number;
  free_shipping: boolean;
  shipping_cost: number | null;
  total_stock: number | null;
  variants: ControlVariant[];
  updated_at: string | null;
}

interface SnapshotResponse {
  version: string;
  updated_at: string | null;
  runtime_table_ready: boolean;
  products: ControlRow[];
  error?: string;
}

type CatalogFilter = "all" | "promo" | "free-shipping" | "low-stock" | "out-of-stock";
type CatalogSort = "priority" | "stock-asc" | "price-asc" | "price-desc" | "discount-desc";

const currencyFormatter = new Intl.NumberFormat("es-CO");

function parseNonNegativeInt(value: string): number | null {
  const normalized = String(value || "").replace(/[^\d]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.floor(parsed);
  return rounded >= 0 ? rounded : null;
}

function toInputValue(value: number | null): string {
  return typeof value === "number" ? String(value) : "";
}

function formatMoney(value: number): string {
  return `$${currencyFormatter.format(Math.max(0, value || 0))}`;
}

function isLowStock(row: ControlRow): boolean {
  return typeof row.total_stock === "number" && row.total_stock > 0 && row.total_stock <= 5;
}

function isOutOfStock(row: ControlRow): boolean {
  return row.total_stock === 0;
}

function matchesSearch(row: ControlRow, value: string): boolean {
  const query = value.trim().toLowerCase();
  if (!query) return true;
  return (
    row.name.toLowerCase().includes(query) ||
    row.slug.toLowerCase().includes(query) ||
    String(row.id || "").toLowerCase().includes(query) ||
    row.variants.some((variant) =>
      String(variant.name || "").toLowerCase().includes(query),
    )
  );
}

function sortRows(rows: ControlRow[], sortMode: CatalogSort): ControlRow[] {
  const next = [...rows];
  next.sort((left, right) => {
    const leftStock = Number(left.total_stock ?? 0);
    const rightStock = Number(right.total_stock ?? 0);
    const leftPrice = Number(left.price || 0);
    const rightPrice = Number(right.price || 0);
    const leftDiscount = Number(left.discount_percent || 0);
    const rightDiscount = Number(right.discount_percent || 0);
    if (sortMode === "stock-asc") return leftStock - rightStock;
    if (sortMode === "price-asc") return leftPrice - rightPrice;
    if (sortMode === "price-desc") return rightPrice - leftPrice;
    if (sortMode === "discount-desc") return rightDiscount - leftDiscount;
    const leftPriority = (leftDiscount > 0 ? 3 : 0) + (left.free_shipping ? 2 : 0) + (isLowStock(left) ? 1 : 0);
    const rightPriority = (rightDiscount > 0 ? 3 : 0) + (right.free_shipping ? 2 : 0) + (isLowStock(right) ? 1 : 0);
    if (leftPriority !== rightPriority) return rightPriority - leftPriority;
    if (leftStock !== rightStock) return leftStock - rightStock;
    return left.name.localeCompare(right.name, "es");
  });
  return next;
}

export default function CatalogControlClient() {
  const [activeSection, setActiveSection] = useState<"catalog" | "orders">("catalog");
  const [rows, setRows] = useState<ControlRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runtimeTableReady, setRuntimeTableReady] = useState(true);
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");
  const [catalogSort, setCatalogSort] = useState<CatalogSort>("priority");

  const loadSnapshot = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/internal/catalog/control", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as SnapshotResponse;
      if (!response.ok) throw new Error(payload.error || "No se pudo abrir el panel privado.");
      setRows(Array.isArray(payload.products) ? payload.products : []);
      setRuntimeTableReady(payload.runtime_table_ready !== false);
      setLastSavedAt(payload.updated_at || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el catalogo operativo.");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  const filteredRows = useMemo(() => {
    const searchFiltered = rows.filter((row) => matchesSearch(row, searchTerm));
    const scoped = searchFiltered.filter((row) => {
      if (catalogFilter === "promo") return row.compare_at_price !== null;
      if (catalogFilter === "free-shipping") return row.free_shipping;
      if (catalogFilter === "low-stock") return isLowStock(row);
      if (catalogFilter === "out-of-stock") return isOutOfStock(row);
      return true;
    });
    return sortRows(scoped, catalogSort);
  }, [catalogFilter, catalogSort, rows, searchTerm]);

  const metrics = useMemo(() => {
    const total = rows.length;
    return {
      total,
      promo: rows.filter((row) => row.compare_at_price !== null).length,
      freeShipping: rows.filter((row) => row.free_shipping).length,
      lowStock: rows.filter((row) => isLowStock(row)).length,
      outOfStock: rows.filter((row) => isOutOfStock(row)).length,
      variantTracked: rows.filter((row) => row.variants.length > 0).length,
    };
  }, [rows]);

  const updateRow = (slug: string, updater: (row: ControlRow) => ControlRow) => {
    setRows((currentRows) => currentRows.map((row) => (row.slug === slug ? updater(row) : row)));
  };

  const saveRow = async (slug: string) => {
    const row = rows.find((entry) => entry.slug === slug);
    if (!row) return;
    setSavingRows((current) => ({ ...current, [slug]: true }));
    setError(null);
    try {
      const response = await fetchWithCsrf("/api/internal/catalog/control", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: row.slug,
          price: row.price,
          compare_at_price: row.compare_at_price,
          free_shipping: row.free_shipping,
          shipping_cost: row.shipping_cost,
          total_stock: row.total_stock,
          variants: row.variants,
        }),
      });
      const payload = (await response.json()) as { updated?: ControlRow; error?: string };
      if (!response.ok || !payload.updated) throw new Error(payload.error || "No se pudo guardar el producto.");
      updateRow(slug, () => payload.updated as ControlRow);
      setLastSavedAt(new Date().toISOString());
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el producto.");
    } finally {
      setSavingRows((current) => ({ ...current, [slug]: false }));
    }
  };

  const saveAll = async () => {
    for (const row of filteredRows.length > 0 ? filteredRows : rows) {
      await saveRow(row.slug);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCatalogFilter("all");
    setCatalogSort("priority");
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="grid gap-6">
        <div className="rounded-[2rem] border border-gray-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,_#ffffff_0%,_#f9fafb_100%)] p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <PageHeader
              eyebrow="Panel privado"
              title={activeSection === "catalog" ? "Catalogo operativo" : "Control de pedidos"}
              description={
                activeSection === "catalog"
                  ? "Edita precio, promo, envio y stock sin salir del panel. Los cambios se reflejan en la tienda al instante."
                  : "Gestion manual de pedidos con cambios de estado, guia, notas y notificacion al cliente desde un mismo lugar."
              }
              className="gap-3"
            />

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button variant="outline" size="sm" onClick={() => void loadSnapshot()} disabled={isLoading} className="gap-2">
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                Recargar snapshot
              </Button>
              {activeSection === "catalog" ? (
                <Button size="sm" onClick={() => void saveAll()} disabled={isLoading || filteredRows.length === 0} className="gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Guardar visibles
                </Button>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await fetch("/api/internal/panel/session", { method: "DELETE", cache: "no-store" }).catch(() => null);
                  window.location.href = "/panel-privado";
                }}
              >
                Cerrar panel
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveSection("catalog")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                activeSection === "catalog"
                  ? "border-emerald-200 bg-emerald-600 text-white shadow-[0_12px_24px_rgba(16,185,129,0.16)]"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-900",
              )}
            >
              <Boxes className="h-4 w-4" />
              Catalogo
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("orders")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                activeSection === "orders"
                  ? "border-emerald-200 bg-emerald-600 text-white shadow-[0_12px_24px_rgba(16,185,129,0.16)]"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-900",
              )}
            >
              <Truck className="h-4 w-4" />
              Pedidos
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <ControlStatCard label="Productos" value={String(metrics.total)} detail="Snapshot total cargado." />
            <ControlStatCard label="Promocion" value={String(metrics.promo)} detail="Con precio tachado activo." tone="emerald" />
            <ControlStatCard label="Envio gratis" value={String(metrics.freeShipping)} detail="Listos para empuje comercial." tone="indigo" />
            <ControlStatCard label="Stock bajo" value={String(metrics.lowStock)} detail="Requieren reposicion cercana." tone="amber" />
            <ControlStatCard label="Sin stock" value={String(metrics.outOfStock)} detail="No deberian entrar en prioridad." tone="rose" />
            <ControlStatCard label="Con variantes" value={String(metrics.variantTracked)} detail="Control por variante activo." />
          </div>
        </div>

        {activeSection === "catalog" ? (
          <>
            {!runtimeTableReady ? (
              <ControlEmptyState
                title="Falta activar la tabla de runtime"
                description="El panel ya funciona, pero el stock en tiempo real necesita crear `catalog_runtime_state` en la base de datos."
                icon={<CircleAlert className="h-5 w-5" />}
                primaryAction={{ label: "Recargar snapshot", onClick: () => void loadSnapshot() }}
              />
            ) : null}

            {error ? (
              <ControlEmptyState
                title="No se pudo cargar el catalogo"
                description={error}
                icon={<CircleAlert className="h-5 w-5" />}
                primaryAction={{ label: "Reintentar", onClick: () => void loadSnapshot() }}
                secondaryAction={{ label: "Limpiar filtros", variant: "outline", onClick: clearFilters }}
              />
            ) : null}

            {!error ? (
              <div className="rounded-[2rem] border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
                  <label className="text-xs font-semibold text-gray-500">
                    Buscar producto
                    <div className="relative mt-1">
                      <PackageSearch className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-300" />
                      <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Nombre, slug o variante"
                        className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-600"
                      />
                    </div>
                  </label>
                  <label className="text-xs font-semibold text-gray-500">
                    Orden
                    <select
                      value={catalogSort}
                      onChange={(event) => setCatalogSort(event.target.value as CatalogSort)}
                      className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600"
                    >
                      <option value="priority">Prioridad comercial</option>
                      <option value="stock-asc">Menor stock</option>
                      <option value="price-asc">Precio menor</option>
                      <option value="price-desc">Precio mayor</option>
                      <option value="discount-desc">Mayor descuento</option>
                    </select>
                  </label>
                  <Button variant="outline" size="sm" onClick={clearFilters} disabled={isLoading}>
                    Limpiar filtros
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(
                    [
                      ["all", "Todo"],
                      ["promo", "Con promo"],
                      ["free-shipping", "Envio gratis"],
                      ["low-stock", "Stock bajo"],
                      ["out-of-stock", "Sin stock"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCatalogFilter(value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                        catalogFilter === value
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-900",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 text-xs text-gray-500">
                  <p>
                    {filteredRows.length} de {metrics.total} productos visibles.
                  </p>
                  {lastSavedAt ? (
                    <p>
                      Ultima sincronizacion:{" "}
                      {new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date(lastSavedAt))}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!error && filteredRows.length === 0 && rows.length > 0 ? (
              <ControlEmptyState
                title="No hay coincidencias para este filtro"
                description="Prueba otra busqueda o limpia los filtros para volver a ver todo el catalogo."
                icon={<PackageSearch className="h-5 w-5" />}
                primaryAction={{ label: "Limpiar filtros", onClick: clearFilters }}
                secondaryAction={{ label: "Recargar snapshot", variant: "outline", onClick: () => void loadSnapshot() }}
              />
            ) : null}

            {!error && rows.length === 0 && !isLoading ? (
              <ControlEmptyState
                title="Catalogo vacio"
                description="No hay productos cargados en el snapshot operativo. Recarga para intentar de nuevo."
                icon={<Boxes className="h-5 w-5" />}
                primaryAction={{ label: "Recargar snapshot", onClick: () => void loadSnapshot() }}
              />
            ) : null}

            <div className="space-y-4">
              {filteredRows.map((row) => {
                const isSaving = Boolean(savingRows[row.slug]);
                const hasPromo = row.compare_at_price !== null;
                const lowStock = isLowStock(row);
                const outOfStock = isOutOfStock(row);
                return (
                  <article key={row.slug} className="rounded-[1.75rem] border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
                    <div className="mb-4 grid gap-4 lg:grid-cols-[140px_minmax(0,1fr)]">
                      <div className="relative h-36 overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-b from-white to-gray-50">
                        <Image
                          src={row.image || "/images/fallback-product.png"}
                          alt={row.name}
                          fill
                          className="object-contain p-3"
                          sizes="140px"
                        />
                      </div>

                      <div className="grid gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h2 className="text-xl font-black tracking-tight text-gray-900">{row.name}</h2>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{row.slug}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {hasPromo ? <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{row.discount_percent}% off</span> : null}
                            {row.free_shipping ? <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">Envio gratis</span> : null}
                            {lowStock ? <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Stock bajo</span> : null}
                            {outOfStock ? <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">Sin stock</span> : null}
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4">
                          <label className="text-xs font-semibold text-gray-500">
                            Precio venta
                            <input
                              type="number"
                              min={0}
                              value={toInputValue(row.price)}
                              onChange={(event) => {
                                const next = parseNonNegativeInt(event.target.value);
                                updateRow(row.slug, (current) => ({
                                  ...current,
                                  price: next ?? 0,
                                  discount_percent:
                                    typeof current.compare_at_price === "number" && current.compare_at_price > (next ?? 0)
                                      ? Math.round(((current.compare_at_price - (next ?? 0)) / current.compare_at_price) * 100)
                                      : 0,
                                }));
                              }}
                              onBlur={() => void saveRow(row.slug)}
                              className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-600"
                            />
                          </label>

                          <label className="text-xs font-semibold text-gray-500">
                            Precio promocional
                            <input
                              type="number"
                              min={0}
                              value={toInputValue(row.compare_at_price)}
                              onChange={(event) => {
                                const raw = event.target.value;
                                const next = raw ? parseNonNegativeInt(raw) : null;
                                updateRow(row.slug, (current) => {
                                  const compareAt = typeof next === "number" ? Math.max(next, current.price) : null;
                                  const discount =
                                    typeof compareAt === "number" && compareAt > current.price
                                      ? Math.round(((compareAt - current.price) / compareAt) * 100)
                                      : 0;
                                  return { ...current, compare_at_price: compareAt, discount_percent: discount };
                                });
                              }}
                              onBlur={() => void saveRow(row.slug)}
                              className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-600"
                            />
                          </label>

                          <label className="text-xs font-semibold text-gray-500">
                            Descuento
                            <div className="mt-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                              -{row.discount_percent}%
                            </div>
                          </label>

                          <label className="text-xs font-semibold text-gray-500">
                            Total stock
                            <input
                              type="number"
                              min={0}
                              value={toInputValue(row.total_stock)}
                              onChange={(event) => {
                                const next = parseNonNegativeInt(event.target.value);
                                updateRow(row.slug, (current) => ({ ...current, total_stock: next }));
                              }}
                              onBlur={() => void saveRow(row.slug)}
                              className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-600"
                            />
                          </label>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                            <input
                              type="checkbox"
                              checked={row.free_shipping}
                              onChange={(event) => updateRow(row.slug, (current) => ({ ...current, free_shipping: event.target.checked }))}
                              onBlur={() => void saveRow(row.slug)}
                              className="h-4 w-4 rounded border-gray-200"
                            />
                            Envio gratis
                          </label>

                          <label className="text-xs font-semibold text-gray-500">
                            Costo de envio
                            <input
                              type="number"
                              min={0}
                              value={toInputValue(row.shipping_cost)}
                              onChange={(event) => {
                                const next = parseNonNegativeInt(event.target.value);
                                updateRow(row.slug, (current) => ({ ...current, shipping_cost: next }));
                              }}
                              onBlur={() => void saveRow(row.slug)}
                              disabled={row.free_shipping}
                              placeholder={row.free_shipping ? "Envio gratis" : "Ej: 12900"}
                              className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 disabled:bg-gray-100"
                            />
                          </label>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">Precio visible: {formatMoney(row.price)}</span>
                          {typeof row.compare_at_price === "number" ? <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">Tachado: {formatMoney(row.compare_at_price)}</span> : null}
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">Variantes: {row.variants.length}</span>
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">Stock total: {row.total_stock ?? "Sin dato"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Stock por variante</p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {row.variants.map((variant, index) => (
                          <label key={`${row.slug}-${variant.name}-${index}`} className="text-xs font-semibold text-gray-500">
                            {variant.name}
                            <input
                              type="number"
                              min={0}
                              value={toInputValue(variant.stock)}
                              onChange={(event) => {
                                const next = parseNonNegativeInt(event.target.value);
                                updateRow(row.slug, (current) => {
                                  const nextVariants = current.variants.map((entry, variantIndex) =>
                                    variantIndex === index ? { ...entry, stock: next } : entry,
                                  );
                                  const allKnown = nextVariants.every((entry) => typeof entry.stock === "number");
                                  const total = allKnown
                                    ? nextVariants.reduce((sum, entry) => sum + Number(entry.stock || 0), 0)
                                    : current.total_stock;
                                  return { ...current, variants: nextVariants, total_stock: total };
                                });
                              }}
                              onBlur={() => void saveRow(row.slug)}
                              className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-600"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => void saveRow(row.slug)} disabled={isSaving || isLoading} className="gap-2">
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Guardar producto
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <OrderControlPanel accessCode="" />
        )}
      </div>
    </section>
  );
}
