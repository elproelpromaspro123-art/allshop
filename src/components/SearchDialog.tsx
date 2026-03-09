"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const filtered = query.trim()
    ? products.filter((p) => {
        const normalizedQuery = normalizeText(query);
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
        className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[61] w-[calc(100%-2rem)] max-w-lg animate-fade-in-up">
        <div className="rounded-2xl border border-[var(--border)] bg-white shadow-xl overflow-hidden">
          <div className="relative flex items-center border-b border-[var(--border)]">
            <Search className="absolute left-4 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar productos..."
              aria-label="Buscar productos"
              className="w-full h-12 pl-11 pr-10 text-sm bg-transparent outline-none text-[var(--foreground)] placeholder:text-neutral-500"
            />
            <button
              onClick={onClose}
              className="absolute right-3 p-1 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              aria-label="Cerrar búsqueda"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-500">
                Cargando productos...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-500">
                {query.trim()
                  ? "No se encontraron productos."
                  : "No hay productos disponibles."}
              </div>
            ) : (
              <ul className="py-2">
                {filtered.slice(0, 8).map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/producto/${product.slug}`}
                      onClick={handleProductClick}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors",
                        "hover:bg-[var(--surface-muted)]"
                      )}
                    >
                      {product.images[0] ? (
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 shrink-0 overflow-hidden">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-[var(--accent-strong)] font-semibold">
                          ${product.price.toLocaleString("es-CO")}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-muted)]">
            <p className="text-[11px] text-neutral-600 flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-300 text-[10px] font-mono font-bold text-neutral-700">
                ESC
              </kbd>
              para cerrar
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
