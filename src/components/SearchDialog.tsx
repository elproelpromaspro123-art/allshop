"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { normalizeLegacyImagePath } from "@/lib/image-paths";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import { useSearchHistoryStore } from "@/store/search-history";
import type { SearchProductsPayload } from "@/types/api";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_DISCOVERY_TERMS = [
  "auriculares",
  "smartwatch",
  "cargador",
  "cámara",
];

type SearchProductItem = SearchProductsPayload["products"][number];

function getProductHighlights(product: SearchProductItem) {
  const highlights: Array<{ key: string; label: string; tone: string }> = [];

  if (product.is_featured) {
    highlights.push({
      key: "featured",
      label: "Destacado",
      tone: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    });
  }

  if (product.is_bestseller) {
    highlights.push({
      key: "bestseller",
      label: "Más vendido",
      tone: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    });
  }

  if (product.free_shipping) {
    highlights.push({
      key: "shipping",
      label: "Env\u00edo gratis",
      tone: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    });
  }

  if (product.reviews_count) {
    const rating = Number(product.average_rating || 0).toFixed(1);
    highlights.push({
      key: "rating",
      label: `${rating}/5 | ${product.reviews_count} resenas`,
      tone: "border-white/10 bg-white/6 text-white/70",
    });
  }

  if (product.stock_location && product.stock_location !== "nacional") {
    highlights.push({
      key: "stock",
      label: `Stock ${product.stock_location}`,
      tone: "border-white/10 bg-white/6 text-white/64",
    });
  }

  return highlights.slice(0, 3);
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchProductsPayload>({
    query: "",
    count: 0,
    products: [],
    categories: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { formatDisplayPrice } = usePricing();
  const { t } = useLanguage();
  const recentSearches = useSearchHistoryStore((store) => store.terms);
  const addSearchTerm = useSearchHistoryStore((store) => store.addTerm);
  const removeSearchTerm = useSearchHistoryStore((store) => store.removeTerm);
  const clearSearchTerms = useSearchHistoryStore((store) => store.clearTerms);
  const lastTrackedQueryRef = useRef("");

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 180);
    return () => window.clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDebouncedQuery("");
    lastTrackedQueryRef.current = "";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const normalizedQuery = debouncedQuery.trim().toLocaleLowerCase("es-CO");
    if (normalizedQuery.length < 2) return;
    if (lastTrackedQueryRef.current === normalizedQuery) return;

    addSearchTerm(debouncedQuery.trim());
    lastTrackedQueryRef.current = normalizedQuery;
  }, [addSearchTerm, debouncedQuery, open]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", debouncedQuery ? "8" : "10");
        if (debouncedQuery) {
          params.set("q", debouncedQuery);
        }

        const response = await fetch(`/api/products/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("search_failed");
        }

        const payload = (await response.json()) as SearchProductsPayload & {
          ok?: boolean;
        };

        setResults({
          query: String(payload.query || ""),
          count: Number(payload.count || 0),
          products: Array.isArray(payload.products) ? payload.products : [],
          categories: Array.isArray(payload.categories) ? payload.categories : [],
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults({
            query: debouncedQuery,
            count: 0,
            products: [],
            categories: [],
          });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchProducts();

    return () => controller.abort();
  }, [debouncedQuery, open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleTabKey);
    firstElement?.focus();

    return () => document.removeEventListener("keydown", handleTabKey);
  }, [open]);

  const handleResultClick = useCallback(
    (term: string) => {
      addSearchTerm(term);
      onClose();
    },
    [addSearchTerm, onClose],
  );

  const handleSuggestionClick = useCallback((term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
  }, []);

  const showDiscovery = !debouncedQuery;
  const products = results.products;
  const categories = results.categories;

  const renderProductCard = (product: SearchProductItem, index: number, onSelect: () => void) => {
    const highlights = getProductHighlights(product);

    return (
      <li key={product.id}>
        <Link
          href={`/producto/${product.slug}`}
          onClick={onSelect}
          className="group flex items-center gap-3 rounded-[1.3rem] border border-transparent px-3 py-3 transition-all hover:border-white/10 hover:bg-white/[0.05]"
          style={{ animationDelay: `${index * 0.03}s` }}
          aria-label={`Ver ${product.name}`}
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[1rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent">
            {product.images[0] ? (
              <Image
                src={normalizeLegacyImagePath(product.images[0])}
                alt={product.name}
                width={48}
                height={48}
                className="h-full w-full object-contain p-1.5"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/46">
                {product.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{product.name}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-emerald-300">
                    {formatDisplayPrice(product.price)}
                  </p>
                  <span className="text-[11px] text-white/42">{product.category_name}</span>
                </div>
              </div>
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-white/34 transition-transform group-hover:translate-x-1 group-hover:text-white/70" />
            </div>

            {highlights.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {highlights.map((highlight) => (
                  <span
                    key={highlight.key}
                    className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${highlight.tone}`}
                  >
                    {highlight.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </Link>
      </li>
    );
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-[rgba(8,19,15,0.58)] backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            ref={dialogRef}
            className="fixed left-1/2 top-16 z-[61] w-[calc(100%-1.25rem)] max-w-2xl -translate-x-1/2 sm:top-20"
            role="dialog"
            aria-modal="true"
            aria-label={t("search.ariaLabel")}
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="search-surface text-white">
              <div className="search-surface__hero border-b border-white/10 px-4 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="editorial-kicker border-white/10 bg-white/6 text-white/86 before:shadow-[0_0_0_0.35rem_rgba(16,185,129,0.16)]">
                      Buscador Vortixy
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/8">
                        <Search className="h-4 w-4 text-emerald-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/92">
                          {t("search.placeholder")}
                        </p>
                        <p className="text-xs text-white/52">
                          Busca un producto y vuelve rápido a lo que estabas viendo.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-white/10 bg-white/6 p-2 text-white/72 transition-all hover:bg-white/10 hover:text-white"
                    aria-label={t("search.close")}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="px-4 pb-3 pt-4 sm:px-6">
                <div className="relative flex items-center rounded-[1.35rem] border border-white/10 bg-white/[0.05]">
                  <Search className="pointer-events-none absolute left-4 h-4 w-4 text-white/42" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("search.placeholder")}
                    aria-label={t("search.ariaLabel")}
                    className="h-14 w-full bg-transparent pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/42"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-white/42">
                  <span>
                    {debouncedQuery
                      ? `${results.count} resultado${results.count === 1 ? "" : "s"} para ayudarte a encontrarlo más rápido.`
                      : "Busca por producto o explora lo más visto."}
                  </span>
                  <span className="hidden sm:inline">
                    Resultados rápidos y ligeros.
                  </span>
                </div>
              </div>

              <div
                className="max-h-[60vh] overflow-y-auto px-2 pb-2 sm:max-h-[52vh]"
                aria-live="polite"
                aria-busy={loading}
              >
                {loading ? (
                  <div className="px-4 py-12 text-center">
                    <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-white/12 border-t-emerald-300" />
                    <p className="text-sm text-white/62">{t("search.loading")}</p>
                  </div>
                ) : showDiscovery && products.length > 0 ? (
                  <div className="px-4 py-6">
                    {recentSearches.length > 0 ? (
                      <div className="mb-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                            Búsquedas recientes
                          </p>
                          <button
                            type="button"
                            onClick={clearSearchTerms}
                            className="inline-flex items-center gap-1 text-[11px] text-white/45 transition-colors hover:text-white/72"
                          >
                            <Trash2 className="h-3 w-3" />
                            Limpiar
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((term) => (
                            <div
                              key={term}
                              className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/5 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10"
                            >
                              <button
                                type="button"
                                onClick={() => handleSuggestionClick(term)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:text-emerald-200"
                              >
                                <Clock className="mr-1.5 h-3 w-3 opacity-50" />
                                {term}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeSearchTerm(term)}
                                className="border-l border-white/10 px-2 text-white/42 transition-colors hover:text-white/80"
                                aria-label={`Eliminar búsqueda ${term}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mb-5">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                        Búsquedas rápidas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {DEFAULT_DISCOVERY_TERMS.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
                          >
                            <Search className="mr-1.5 inline-block h-3 w-3 opacity-60" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                      Lo más buscado
                    </p>
                    <ul className="space-y-1.5">
                      {products.slice(0, 6).map((product, index) =>
                        renderProductCard(product, index, () => handleResultClick(product.name)),
                      )}
                    </ul>
                  </div>
                ) : products.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <Sparkles className="mx-auto mb-3 h-7 w-7 animate-[float-slow_4s_ease-in-out_infinite] text-white/38" />
                    <p className="text-sm text-white/62">
                      {debouncedQuery ? t("search.noResults") : t("search.noProducts")}
                    </p>
                    {debouncedQuery ? (
                      <p className="mt-2 text-xs text-white/40">
                        Prueba con el nombre del producto, una categoría o una palabra más concreta.
                      </p>
                    ) : null}
                    {debouncedQuery ? (
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {DEFAULT_DISCOVERY_TERMS.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="px-4 py-5">
                    {categories.length > 0 ? (
                      <div className="mb-4">
                        <div className="mb-2 flex items-end justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                            Categorías relacionadas
                          </p>
                          <span className="text-[11px] text-white/38">
                            Según tu búsqueda
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((category) =>
                            category.slug ? (
                              <Link
                                key={category.id}
                                href={`/categoria/${category.slug}`}
                                onClick={() => handleResultClick(category.name)}
                                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
                              >
                                <Tag className="h-3 w-3" />
                                {category.name}
                                <span className="text-white/42">({category.count})</span>
                              </Link>
                            ) : (
                              <span
                                key={category.id}
                                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70"
                              >
                                <Tag className="h-3 w-3" />
                                {category.name}
                                <span className="text-white/42">({category.count})</span>
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null}

                    <ul className="space-y-1.5">
                      {products.map((product, index) =>
                        renderProductCard(product, index, () =>
                          handleResultClick(debouncedQuery || product.name),
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 px-4 py-3 sm:px-5">
                <div className="flex items-center justify-between text-[11px] text-white/58">
                  <p className="flex items-center gap-2">
                    <kbd className="rounded-lg border border-white/10 bg-white/6 px-2 py-1 text-[10px] font-mono font-semibold text-white/72">
                      ESC
                    </kbd>
                    <span>{t("search.escHint")}</span>
                  </p>
                  <p className="hidden items-center gap-1.5 text-white/40 sm:flex">
                    <kbd className="rounded-md border border-white/10 bg-white/6 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-white/60">
                      CMD+K
                    </kbd>
                    <span>Buscar</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
