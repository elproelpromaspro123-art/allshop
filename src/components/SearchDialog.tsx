"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Search, Sparkles, X } from "lucide-react";
import { usePricing } from "@/providers/PricingProvider";
import { useLanguage } from "@/providers/LanguageProvider";

interface SearchProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: string[];
  category_id: string;
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { formatDisplayPrice } = usePricing();
  const { t } = useLanguage();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchProducts = async () => {
      const cached = sessionStorage.getItem("vortixy-search-products-cache");
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached) as {
            data: SearchProduct[];
            timestamp: number;
          };
          if (
            Date.now() - timestamp < 5 * 60 * 1000 &&
            Array.isArray(data) &&
            data.length > 0
          ) {
            if (!cancelled) {
              setProducts(data);
              setLoading(false);
              return;
            }
          }
        } catch {
          // Ignore malformed cache and fall through to network.
        }
      }

      setLoading(true);
      try {
        const response = await fetch("/api/products/search");
        if (!response.ok) throw new Error("Failed to load");
        const data = await response.json();
        if (!cancelled) {
          const nextProducts = data.products || [];
          setProducts(nextProducts);
          sessionStorage.setItem(
            "vortixy-search-products-cache",
            JSON.stringify({ data: nextProducts, timestamp: Date.now() }),
          );
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [open]);

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
      if (event.key !== "Tab") return;

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

  const filtered = debouncedQuery.trim()
    ? products.filter((product) => {
        const normalizedQuery = normalizeText(debouncedQuery);
        const normalizedName = normalizeText(product.name);
        return normalizedName.includes(normalizedQuery);
      })
    : products;

  const popularSuggestions =
    products.length > 0
      ? [...new Set(products.map((product) => product.name.split(" ")[0].toLowerCase()))]
          .filter((value) => value.length > 3)
          .slice(0, 4)
      : [];

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem("vortixy-search-history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveSearchToHistory = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((previous) => {
      const next = [trimmed, ...previous.filter((entry) => entry !== trimmed)].slice(0, 5);
      try {
        sessionStorage.setItem("vortixy-search-history", JSON.stringify(next));
      } catch {
        // Ignore storage failures.
      }
      return next;
    });
  }, []);

  const handleProductClick = useCallback(() => {
    if (query.trim()) saveSearchToHistory(query);
    onClose();
  }, [onClose, query, saveSearchToHistory]);

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
                          Encuentra productos y vuelve rápido al flujo de compra.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
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
                <div className="mt-3 flex items-center justify-between text-[11px] text-white/42">
                  <span>Resultados rápidos para home, PDP y checkout.</span>
                  <span className="hidden sm:inline">
                    Primero lo directo, luego lo más buscado.
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
                ) : !query.trim() && filtered.length > 0 ? (
                  <div className="px-4 py-6">
                    {recentSearches.length > 0 ? (
                      <div className="mb-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                          Búsquedas recientes
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((term) => (
                            <button
                              key={term}
                              onClick={() => setQuery(term)}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
                            >
                              <Clock className="mr-1.5 inline-block h-3 w-3 opacity-50" />
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">
                      {popularSuggestions.length > 0 ? "Explora por intención" : "Explorar"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(popularSuggestions.length > 0
                        ? popularSuggestions
                        : ["smartwatch", "auriculares", "cargador", "estilo"]
                      ).map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setQuery(suggestion)}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
                        >
                          <Search className="mr-1.5 inline-block h-3 w-3 opacity-60" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <Sparkles className="mx-auto mb-3 h-7 w-7 animate-[float-slow_4s_ease-in-out_infinite] text-white/38" />
                    <p className="text-sm text-white/62">
                      {query.trim() ? t("search.noResults") : t("search.noProducts")}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {filtered.slice(0, 8).map((product, index) => (
                      <li key={product.id}>
                        <Link
                          href={`/producto/${product.slug}`}
                          onClick={handleProductClick}
                          className="group flex items-center gap-3 rounded-[1.3rem] border border-transparent px-3 py-3 transition-all hover:border-white/10 hover:bg-white/[0.05]"
                          style={{ animationDelay: `${index * 0.03}s` }}
                        >
                          {product.images[0] ? (
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/6">
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="h-full w-full object-contain p-1"
                              />
                            </div>
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {product.name}
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-emerald-300">
                              {formatDisplayPrice(product.price)}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-white/34 transition-transform group-hover:translate-x-1 group-hover:text-white/70" />
                        </Link>
                      </li>
                    ))}
                  </ul>
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
                      ⌘K
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
