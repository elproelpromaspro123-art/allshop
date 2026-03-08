"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

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

interface Props {
  token: string;
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

export default function CatalogControlClient({ token }: Props) {
  const [accessCode, setAccessCode] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [rows, setRows] = useState<ControlRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runtimeTableReady, setRuntimeTableReady] = useState(true);
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const storageKey = useMemo(() => `catalog-admin-code:${token}`, [token]);

  useEffect(() => {
    const cachedCode = window.sessionStorage.getItem(storageKey) || "";
    if (cachedCode) {
      setAccessCode(cachedCode);
      setCodeDraft(cachedCode);
    }
  }, [storageKey]);

  const loadSnapshot = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/internal/catalog/control", {
        method: "GET",
        headers: {
          "x-catalog-admin-code": code,
        },
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
          : "No se pudo cargar el catalogo operativo.";
      setError(message);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!accessCode) return;
    void loadSnapshot(accessCode);
  }, [accessCode]);

  const updateRow = (slug: string, updater: (row: ControlRow) => ControlRow) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.slug === slug ? updater(row) : row))
    );
  };

  const saveRow = async (slug: string) => {
    const row = rows.find((entry) => entry.slug === slug);
    if (!row || !accessCode) return;

    setSavingRows((current) => ({ ...current, [slug]: true }));
    setError(null);

    try {
      const response = await fetch("/api/internal/catalog/control", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-catalog-admin-code": accessCode,
        },
        body: JSON.stringify({
          slug: row.slug,
          price: row.price,
          compare_at_price: row.compare_at_price,
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
          : "No se pudo guardar el producto."
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

  if (!accessCode) {
    return (
      <section className="mx-auto max-w-xl px-4 py-14">
        <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">
            Acceso privado de catalogo
          </h1>
          <p className="mb-4 text-sm text-neutral-600">
            Ingresa el codigo secreto para administrar stock y precios en
            tiempo real.
          </p>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Codigo de acceso
          </label>
          <input
            type="password"
            value={codeDraft}
            onChange={(event) => setCodeDraft(event.target.value)}
            className="mb-4 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-strong)]"
            placeholder="Pega aqui tu codigo secreto"
          />
          <Button
            onClick={() => {
              const nextCode = codeDraft.trim();
              if (!nextCode) return;
              window.sessionStorage.setItem(storageKey, nextCode);
              setAccessCode(nextCode);
            }}
            className="w-full"
          >
            Entrar al panel
          </Button>
          {error ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
            Panel operativo oculto
          </h1>
          <p className="text-sm text-neutral-600">
            Ajusta stock real por producto y variante, precio y promocion. Los
            cambios impactan de inmediato en la tienda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadSnapshot(accessCode)}
            disabled={isLoading}
          >
            Recargar datos
          </Button>
          <Button size="sm" onClick={() => void saveAll()} disabled={isLoading}>
            Guardar todo
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.sessionStorage.removeItem(storageKey);
              setAccessCode("");
              setCodeDraft("");
              setRows([]);
              setError(null);
            }}
          >
            Cerrar panel
          </Button>
        </div>
      </div>

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
        <p className="mb-4 text-xs text-neutral-500">
          Ultima sincronizacion:{" "}
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
              className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm"
            >
              <div className="mb-4 grid gap-4 lg:grid-cols-[120px_1fr]">
                <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]">
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
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {row.slug}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <label className="text-xs font-semibold text-neutral-600">
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
                              typeof current.compare_at_price === "number" &&
                              current.compare_at_price > (next ?? 0)
                                ? Math.round(
                                    ((current.compare_at_price - (next ?? 0)) /
                                      current.compare_at_price) *
                                      100
                                  )
                                : 0,
                          }));
                        }}
                        onBlur={() => void saveRow(row.slug)}
                        className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm"
                      />
                    </label>

                    <label className="text-xs font-semibold text-neutral-600">
                      Precio promocional
                      <input
                        type="number"
                        min={0}
                        value={toInputValue(row.compare_at_price)}
                        onChange={(event) => {
                          const raw = event.target.value;
                          const next = raw ? parseNonNegativeInt(raw) : null;
                          updateRow(row.slug, (current) => {
                            const compareAt =
                              typeof next === "number"
                                ? Math.max(next, current.price)
                                : null;
                            const discount =
                              typeof compareAt === "number" && compareAt > current.price
                                ? Math.round(
                                    ((compareAt - current.price) / compareAt) * 100
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

                    <label className="text-xs font-semibold text-neutral-600">
                      Descuento
                      <div className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-sm font-bold text-emerald-700">
                        -{row.discount_percent}%
                      </div>
                    </label>

                    <label className="text-xs font-semibold text-neutral-600">
                      Stock total
                      <input
                        type="number"
                        min={0}
                        value={toInputValue(row.total_stock)}
                        onChange={(event) => {
                          const next = parseNonNegativeInt(event.target.value);
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

                  <p className="mt-2 text-xs text-neutral-500">
                    Precio actual cliente: $
                    {currencyFormatter.format(row.price)}
                    {typeof row.compare_at_price === "number"
                      ? ` | Tachado: $${currencyFormatter.format(
                          row.compare_at_price
                        )}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Stock por variante
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {row.variants.map((variant, index) => (
                    <label
                      key={`${row.slug}-${variant.name}-${index}`}
                      className="text-xs font-semibold text-neutral-600"
                    >
                      {variant.name}
                      <input
                        type="number"
                        min={0}
                        value={toInputValue(variant.stock)}
                        onChange={(event) => {
                          const next = parseNonNegativeInt(event.target.value);
                          updateRow(row.slug, (current) => {
                            const nextVariants = current.variants.map((entry, variantIndex) =>
                              variantIndex === index
                                ? { ...entry, stock: next }
                                : entry
                            );

                            const allKnown = nextVariants.every(
                              (entry) => typeof entry.stock === "number"
                            );
                            const total = allKnown
                              ? nextVariants.reduce(
                                  (sum, entry) => sum + Number(entry.stock || 0),
                                  0
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
    </section>
  );
}
