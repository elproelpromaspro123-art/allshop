"use client";

import Link from "next/link";
import type { ElementType } from "react";
import {
  ArrowRight,
  ChefHat,
  Dumbbell,
  Home,
  LayoutGrid,
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
  const [leadCategory, ...secondaryCategories] = visibleCategories;

  return (
    <section
      id="categorias"
      data-home-slide=""
      data-density="balanced"
      data-tone="mist"
      className="v-section"
    >
      <div className="v-section-inner">
        <div className="v-section-grid" data-layout="split">
          <div className="v-editorial-copy">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-emerald-700 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
              <LayoutGrid className="h-3.5 w-3.5" />
              {t("categories.badge")}
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Cada categoría ocupa su lugar y se entiende sin esfuerzo.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Reorganicé esta sección para que el catálogo se lea como una
                diapositiva: una entrada principal y accesos secundarios con la
                misma proporción visual.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-700/80">
                  Navegación
                </p>
                <p className="mt-3 text-lg font-bold tracking-tight text-slate-950">
                  {visibleCategories.length} accesos visibles sin saturar la home.
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Primero ves la categoría protagonista y luego el resto con el
                  mismo patrón de lectura.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200/80 bg-slate-950 px-5 py-5 text-white shadow-[0_22px_70px_rgba(2,6,23,0.18)]">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-200/78">
                  Objetivo
                </p>
                <p className="mt-3 text-lg font-bold tracking-tight">
                  Menos zapping, más dirección hacia la categoría correcta.
                </p>
                <p className="mt-2 text-sm leading-7 text-white/74">
                  El bloque dejó de parecer una cuadrícula genérica y ahora
                  orienta la exploración desde el primer clic.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {leadCategory ? (
              <CategoryCard
                category={leadCategory}
                featured
              />
            ) : null}

            {secondaryCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </div>

      <div className="v-section-divider" />
    </section>
  );
}

function CategoryCard({
  category,
  featured = false,
}: {
  category: Category;
  featured?: boolean;
}) {
  const Icon = CATEGORY_ICONS[category.icon || ""] || Sparkles;

  return (
    <Link
      href={`/categoria/${category.slug}`}
      className={`group rounded-[1.7rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/60 hover:shadow-[0_28px_70px_rgba(16,185,129,0.14)] sm:p-6 ${
        featured ? "sm:col-span-2" : ""
      }`}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 transition-colors duration-300 group-hover:from-emerald-100 group-hover:to-teal-100">
            <Icon className="h-5 w-5" />
          </div>
          <span className="inline-flex items-center gap-1 text-[0.72rem] font-black uppercase tracking-[0.2em] text-emerald-700">
            Ver
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>

        <div>
          <h3
            className={`font-black tracking-tight text-slate-950 ${
              featured ? "text-2xl sm:text-[1.85rem]" : "text-lg"
            }`}
          >
            {category.name}
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {category.description ||
              "Selección curada para decidir más rápido y sin ruido visual."}
          </p>
        </div>
      </div>
    </Link>
  );
}
