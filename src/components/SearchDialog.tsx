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
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[61] w-[calc(100%-2rem)] max-w-lg">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-white shadow-2xl overflow-hidden animate-[fade-in-scale_200ms_ease-out]">
          {/* Header with gradient accent */}
          <div className="relative h-1 bg-gradient-to-r from-[var(--secondary)] via-[var(--accent-strong)] to-[var(--secondary)]" />
          
          {/* Search Input */}
          <div className="relative flex items-center border-b border-[var(--border-subtle)]">
            <Search className="absolute left-4 w-4 h-4 text-[var(--muted-faint)] pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              aria-label={t("search.ariaLabel")}
              className="w-full h-14 pl-11 pr-10 text-sm bg-transparent outline-none text-[var(--foreground)] placeholder:text-[var(--muted-soft)]"
            />
            <button
              onClick={onClose}
              className="absolute right-3 p-1.5 rounded-lg text-[var(--muted-soft)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-all"
              aria-label={t("search.close")}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] sm:max-h-[50vh] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-12 text-center">
                <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] border-t-[var(--accent-strong)] animate-spin mx-auto mb-3" />
                <p className="text-sm text-[var(--muted-soft)]">{t("search.loading")}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Sparkles className="w-7 h-7 text-[var(--muted-faint)] mx-auto mb-3 animate-[float-slow_4s_ease-in-out_infinite]" />
                <p className="text-sm text-[var(--muted-soft)]">
                  {query.trim() ? t("search.noResults") : t("search.noProducts")}
                </p>
              </div>
            ) : (
              <ul className="py-2">
                {filtered.slice(0, 8).map((product, index) => (
                  <li key={product.id}>
                    <Link
                      href={`/producto/${product.slug}`}
                      onClick={handleProductClick}
                      className="flex items-center gap-3 px-4 py-3 transition-all hover:bg-[var(--surface-muted)] hover:pl-5"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      {product.images[0] ? (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--surface-muted)] to-[var(--background)] shrink-0 overflow-hidden border border-[var(--border-subtle)]">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">
                          {product.name}
                        </p>
                        <p className="text-xs font-semibold text-[var(--accent-strong)] mt-0.5">
                          {formatDisplayPrice(product.price)}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[var(--muted-faint)] shrink-0 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-gradient-to-r from-[var(--surface-muted)] to-[var(--background)]">
            <p className="text-[11px] text-[var(--muted)] flex items-center gap-2">
              <kbd className="px-2 py-1 rounded-lg bg-white border border-[var(--border)] text-[10px] font-mono font-semibold text-[var(--muted-strong)] shadow-sm">
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
