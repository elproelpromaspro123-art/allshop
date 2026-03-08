"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
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

        fetchProducts();
        return () => { cancelled = true; };
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

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[61] w-[calc(100%-2rem)] max-w-lg"
                    >
                        <div className="rounded-2xl border border-[var(--border)] bg-white shadow-xl overflow-hidden">
                            {/* Search input */}
                            <div className="relative flex items-center border-b border-[var(--border)]">
                                <Search className="absolute left-4 w-4 h-4 text-neutral-400 pointer-events-none" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Buscar productos..."
                                    className="w-full h-12 pl-11 pr-10 text-sm bg-transparent outline-none text-[var(--foreground)] placeholder:text-neutral-400"
                                />
                                <button
                                    onClick={onClose}
                                    className="absolute right-3 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Results */}
                            <div className="max-h-[50vh] overflow-y-auto">
                                {loading ? (
                                    <div className="px-4 py-8 text-center text-sm text-neutral-400">
                                        Cargando productos...
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-sm text-neutral-400">
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
                                                    {product.images[0] && (
                                                        <div className="w-10 h-10 rounded-lg bg-neutral-100 shrink-0 overflow-hidden">
                                                            <img
                                                                src={product.images[0]}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    )}
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

                            {/* Hint */}
                            <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-muted)]">
                                <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-mono">
                                        ESC
                                    </kbd>
                                    para cerrar
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
