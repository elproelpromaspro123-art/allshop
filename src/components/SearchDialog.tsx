"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, ArrowRight, Sparkles } from "lucide-react";
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
      setLoading(true);
      try {
        const res = await fetch("/api/products/search");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (!cancelled) setProducts(data.products || []);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const filtered = debouncedQuery.trim()
    ? products.filter((p) => {
        const normalizedQuery = normalizeText(debouncedQuery);
        const normalizedName = normalizeText(p.name);
        return normalizedName.includes(normalizedQuery);
      })
    : products;

  const handleProductClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-[rgba(8,19,15,0.58)] backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="fixed top-16 sm:top-20 left-1/2 z-[61] w-[calc(100%-1.25rem)] max-w-xl -translate-x-1/2">
        <div className="surface-panel-dark surface-ambient brand-v-slash overflow-hidden text-white shadow-[var(--shadow-float-strong)] animate-[fade-in-scale_200ms_ease-out]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
                <Search className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Vortixy</p>
                <p className="text-sm font-medium text-white/86">{t("search.placeholder")}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/6 p-2 text-white/72 transition-all hover:bg-white/10 hover:text-white"
              aria-label={t("search.close")}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="px-4 pb-3 pt-4 sm:px-5">
            <div className="relative flex items-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <Search className="pointer-events-none absolute left-4 w-4 h-4 text-white/42" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                aria-label={t("search.ariaLabel")}
                className="h-14 w-full bg-transparent pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/42"
              />
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-2 pb-2 sm:max-h-[52vh]">
            {loading ? (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto mb-3 h-6 w-6 rounded-full border-2 border-white/12 border-t-emerald-300 animate-spin" />
                <p className="text-sm text-white/62">{t("search.loading")}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Sparkles className="mx-auto mb-3 h-7 w-7 text-white/38 animate-[float-slow_4s_ease-in-out_infinite]" />
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
                      className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 transition-all hover:border-white/10 hover:bg-white/[0.05]"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      {product.images[0] ? (
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/6">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
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
            <p className="flex items-center gap-2 text-[11px] text-white/58">
              <kbd className="rounded-lg border border-white/10 bg-white/6 px-2 py-1 text-[10px] font-mono font-semibold text-white/72">
                ESC
              </kbd>
              <span>{t("search.escHint")}</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
