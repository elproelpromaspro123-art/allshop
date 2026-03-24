"use client";

import Link from "next/link";
import type { ElementType } from "react";
import {
  ArrowRight,
  ChefHat,
  Dumbbell,
  Home,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import type { Category } from "@/types";

const CATEGORY_ICONS: Record<string, ElementType> = {
  ChefHat,
  Smartphone,
  Home,
  Sparkles,
  Dumbbell,
};

interface HomeCategoriesProps {
  categories: Category[];
}

export function HomeCategories({ categories }: HomeCategoriesProps) {
  const { t } = useLanguage();
  const visibleCategories = categories.slice(0, 6);

  return (
    <section id="categorias" className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            {t("categories.badge")}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Encuentra lo que buscas
          </h2>
          <p className="mt-3 text-base text-gray-500">
            Productos organizados por categoría para que compares y elijas más rápido.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {visibleCategories.map((category) => {
            const Icon = CATEGORY_ICONS[category.icon || ""] || Sparkles;

            return (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg sm:p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors duration-300 group-hover:bg-emerald-100">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-gray-900 sm:text-base">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
                    {category.description}
                  </p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition-transform duration-200 group-hover:translate-x-0.5">
                  Ver más
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
