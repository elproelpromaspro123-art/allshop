"use client";

import { motion } from "framer-motion";
import {
  ChefHat,
  Smartphone,
  Home,
  Sparkles,
  Dumbbell,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ShippingBadge } from "@/components/ShippingBadge";
import { TrustBar } from "@/components/TrustBar";
import type { Product, Category } from "@/types";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  ChefHat,
  Smartphone,
  Home,
  Sparkles,
  Dumbbell,
};

interface Props {
  category: Category;
  products: Product[];
}

export function CategoryPageClient({ category, products }: Props) {
  const IconComponent = CATEGORY_ICONS[category.icon ?? ""] ?? Sparkles;

  return (
    <>
      {/* Category Hero — adapts to niche */}
      <section className="bg-gradient-to-b from-neutral-50 to-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div
            className="flex items-center gap-4 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${category.color}15` }}
            >
              <IconComponent
                className="w-7 h-7"
                style={{ color: category.color ?? undefined }}
              />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
                {category.name}
              </h1>
              <p className="text-neutral-500 mt-1">{category.description}</p>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center gap-3 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ShippingBadge stockLocation="nacional" compact />
            <span className="text-xs text-neutral-400">
              {products.length} productos disponibles
            </span>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-100">
            <p className="text-sm text-neutral-500">
              <span className="font-semibold text-neutral-900">{products.length}</span>{" "}
              productos
            </p>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">Ordenar</span>
              </button>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-neutral-400 text-lg">
                No hay productos disponibles en esta categoría aún.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Trust section */}
      <section className="py-12 bg-neutral-50 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBar />
        </div>
      </section>
    </>
  );
}
