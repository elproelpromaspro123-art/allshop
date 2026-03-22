"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { fetchWithCsrf } from "@/lib/csrf-client";

const OrderControlPanel = dynamic(() => import("./OrderControlPanel"), {
  loading: () => (
    <div className="rounded-[var(--card-radius)] border border-[var(--border)] bg-white p-5 text-sm text-[var(--muted)]">
      Cargando gestión de pedidos...
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

export default function CatalogControlClient() {
  const [activeSection, setActiveSection] = useState<"catalog" | "orders">(
    "catalog",
  );
  const [rows, setRows] = useState<ControlRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runtimeTableReady, setRuntimeTableReady] = useState(true);
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const loadSnapshot = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/internal/catalog/control", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as SnapshotResponse;

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo abrir el panel privado.");
      }

      setRows(Array.isArray(payload.products) ? payload.products : []);
      setRuntimeTableReady(payload.runtime_table_ready !== false);
      setLastSavedAt(payload.updated_at || null);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el catálogo operativo.";
      setError(message);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  const updateRow = (
    slug: string,
    updater: (row: ControlRow) => ControlRow,
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.slug === slug ? updater(row) : row)),
    );
  };

  const saveRow = async (slug: string) => {
    const row = rows.find((entry) => entry.slug === slug);
    if (!row) return;

    setSavingRows((current) => ({ ...current, [slug]: true }));
    setError(null);

    try {
      const response = await fetchWithCsrf("/api/internal/catalog/control", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
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

      const payload = (await response.json()) as {
        updated?: ControlRow;
        error?: string;
      };

      if (!response.ok || !payload.updated) {
        throw new Error(payload.error || "No se pudo guardar el producto.");
      }

      updateRow(slug, () => payload.updated as ControlRow);
      setLastSavedAt(new Date().toISOString());
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el producto.",
      );
    } finally {
      setSavingRows((current) => ({ ...current, [slug]: false }));
    }
  };

  const saveAll = async () => {
    for (const row of rows) {
      await saveRow(row.slug);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
            Panel operativo oculto
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {activeSection === "catalog"
              ? "Ajusta stock real por producto y variante, precio y promoción. Los cambios impactan de inmediato en la tienda."
              : "Gestión manual de pedidos: busca, actualiza estado, agrega guía, notas y notifica por correo al cliente."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSection === "catalog" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadSnapshot()}
                disabled={isLoading}
              >
                Recargar datos
              </Button>
              <Button
                size="sm"
                onClick={() => void saveAll()}
                disabled={isLoading}
              >
                Guardar todo
              </Button>
            </>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await fetch("/api/internal/panel/session", {
                method: "DELETE",
                cache: "no-store",
              }).catch(() => null);
              window.location.href = "/panel-privado";
            }}
          >
            Cerrar panel
          </Button>
        </div>
      </div>

      <div className="mb-4 inline-flex rounded-full border border-[var(--border)] bg-white p-1">
        <button
          type="button"
          onClick={() => setActiveSection("catalog")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            activeSection === "catalog"
              ? "bg-[var(--accent-strong)] text-white"
              : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
          }`}
        >
          Catálogo
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("orders")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            activeSection === "orders"
              ? "bg-[var(--accent-strong)] text-white"
              : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
          }`}
        >
          Pedidos
        </button>
      </div>

      {activeSection === "catalog" ? (
        <>
          {!runtimeTableReady ? (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Falta crear la tabla `catalog_runtime_state` en la base de datos.
              Ejecuta el SQL que te deje al final para activar stock en tiempo
              real.
            </p>
          ) : null}

          {error ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {lastSavedAt ? (
            <p className="mb-4 text-xs text-[var(--muted-soft)]">
              Última sincronización:{" "}
              {new Intl.DateTimeFormat("es-CO", {
                dateStyle: "short",
                timeStyle: "medium",
              }).format(new Date(lastSavedAt))}
            </p>
          ) : null}

          <div className="space-y-4">
            {rows.map((row) => {
              const isSaving = Boolean(savingRows[row.slug]);
              return (
                <article
                  key={row.slug}
                  className="rounded-[var(--card-radius)] border border-[var(--border)] bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 grid gap-4 lg:grid-cols-[120px_1fr]">
                    <div className="relative h-28 w-28 overflow-hidden rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--surface-muted)]">
                      <Image
                        src={row.image || "/images/fallback-product.png"}
                        alt={row.name}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-[var(--foreground)]">
                        {row.name}
                      </h2>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                        {row.slug}
                      </p>

                      <div className="grid gap-3 sm:grid-cols-4">
                        <label className="text-xs font-semibold text-[var(--muted)]">
                          Precio venta
                          <input
                            type="number"
                            min={0}
                            value={toInputValue(row.price)}
                            onChange={(event) => {
                              const next = parseNonNegativeInt(
                                event.target.value,
                              );
                              updateRow(row.slug, (current) => ({
                                ...current,
                                price: next ?? 0,
                                discount_percent:
                                  typeof current.compare_at_price ===
                                    "number" &&
                                  current.compare_at_price > (next ?? 0)
                                    ? Math.round(
                                        ((current.compare_at_price -
                                          (next ?? 0)) /
                                          current.compare_at_price) *
                                          100,
                                      )
                                    : 0,
                              }));
                            }}
                            onBlur={() => void saveRow(row.slug)}
                            className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm"
                          />
                        </label>

                        <label className="text-xs font-semibold text-[var(--muted)]">
                          Precio promocional
                          <input
                            type="number"
                            min={0}
                            value={toInputValue(row.compare_at_price)}
                            onChange={(event) => {
                              const raw = event.target.value;
                              const next = raw
                                ? parseNonNegativeInt(raw)
                                : null;
                              updateRow(row.slug, (current) => {
                                const compareAt =
                                  typeof next === "number"
                                    ? Math.max(next, current.price)
                                    : null;
                                const discount =
                                  typeof compareAt === "number" &&
                                  compareAt > current.price
                                    ? Math.round(
                                        ((compareAt - current.price) /
                                          compareAt) *
                                          100,
                                      )
                                    : 0;

                                return {
                                  ...current,
                                  compare_at_price: compareAt,
                                  discount_percent: discount,
                                };
                              });
                            }}
                            onBlur={() => void saveRow(row.slug)}
                            className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm"
                          />
                        </label>

                        <label className="text-xs font-semibold text-[var(--muted)]">
                          Descuento
                          <div className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-sm font-bold text-emerald-700">
                            -{row.discount_percent}%
                          </div>
                        </label>

                        <label className="text-xs font-semibold text-[var(--muted)]">
                          Total Stock
                          <input
                            type="number"
                            min={0}
                            value={toInputValue(row.total_stock)}
                            onChange={(event) => {
                              const next = parseNonNegativeInt(
                                event.target.value,
                              );
                              updateRow(row.slug, (current) => ({
                                ...current,
                                total_stock: next,
                              }));
                            }}
                            onBlur={() => void saveRow(row.slug)}
                            className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm"
                          />
                        </label>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                          <input
                            type="checkbox"
                            checked={row.free_shipping}
                            onChange={(event) => {
                              updateRow(row.slug, (current) => ({
                                ...current,
                                free_shipping: event.target.checked,
                              }));
                            }}
                            onBlur={() => void saveRow(row.slug)}
                            className="h-4 w-4 rounded border-[var(--border)]"
                          />
                          Envío Gratis
                        </label>

                        <label className="text-xs font-semibold text-[var(--muted)]">
                          Costo de Envío (Vacío = Por defecto)
                          <input
                            type="number"
                            min={0}
                            value={toInputValue(row.shipping_cost)}
                            onChange={(event) => {
                              const next = parseNonNegativeInt(
                                event.target.value,
                              );
                              updateRow(row.slug, (current) => ({
                                ...current,
                                shipping_cost: next,
                              }));
                            }}
                            onBlur={() => void saveRow(row.slug)}
                            disabled={row.free_shipping}
                            placeholder={
                              row.free_shipping ? "Envío gratis" : "Ej: 12900"
                            }
                            className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm disabled:bg-[var(--surface-muted)]"
                          />
                        </label>
                      </div>

                      <p className="mt-2 text-xs text-[var(--muted-soft)]">
                        Precio actual cliente: $
                        {currencyFormatter.format(row.price)}
                        {typeof row.compare_at_price === "number"
                          ? ` | Tachado: $${currencyFormatter.format(
                              row.compare_at_price,
                            )}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                      Stock por variante
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {row.variants.map((variant, index) => (
                        <label
                          key={`${row.slug}-${variant.name}-${index}`}
                          className="text-xs font-semibold text-[var(--muted)]"
                        >
                          {variant.name}
                          <input
                            type="number"
                            min={0}
                            value={toInputValue(variant.stock)}
                            onChange={(event) => {
                              const next = parseNonNegativeInt(
                                event.target.value,
                              );
                              updateRow(row.slug, (current) => {
                                const nextVariants = current.variants.map(
                                  (entry, variantIndex) =>
                                    variantIndex === index
                                      ? { ...entry, stock: next }
                                      : entry,
                                );

                                const allKnown = nextVariants.every(
                                  (entry) => typeof entry.stock === "number",
                                );
                                const total = allKnown
                                  ? nextVariants.reduce(
                                      (sum, entry) =>
                                        sum + Number(entry.stock || 0),
                                      0,
                                    )
                                  : current.total_stock;

                                return {
                                  ...current,
                                  variants: nextVariants,
                                  total_stock: total,
                                };
                              });
                            }}
                            onBlur={() => void saveRow(row.slug)}
                            className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => void saveRow(row.slug)}
                      disabled={isSaving || isLoading}
                    >
                      {isSaving ? "Guardando..." : "Guardar producto"}
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
    </section>
  );
}
