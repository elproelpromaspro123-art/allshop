"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ElementType } from "react";
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

type CategoryTheme = {
  borderColor: string;
  shadowColor: string;
  surface: string;
  tint: string;
};

function parseCategoryColor(color?: string | null): CategoryTheme {
  const fallback: CategoryTheme = {
    borderColor: "rgba(16, 185, 129, 0.18)",
    shadowColor: "rgba(16, 185, 129, 0.12)",
    surface:
      "linear-gradient(180deg, rgba(236, 253, 245, 0.86) 0%, rgba(255, 255, 255, 0.96) 58%, rgba(255, 255, 255, 0.99) 100%)",
    tint: "rgba(16, 185, 129, 0.08)",
  };

  if (!color) return fallback;

  const match = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return fallback;

  const hex = match[1];
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((segment) => segment.repeat(2))
          .join("")
      : hex;

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return {
    borderColor: `rgba(${red}, ${green}, ${blue}, 0.28)`,
    shadowColor: `rgba(${red}, ${green}, ${blue}, 0.14)`,
    surface: `linear-gradient(180deg, rgba(${red}, ${green}, ${blue}, 0.12) 0%, rgba(255, 255, 255, 0.96) 58%, rgba(255, 255, 255, 0.99) 100%)`,
    tint: `rgba(${red}, ${green}, ${blue}, 0.08)`,
  };
}

export function HomeCategories({ categories }: HomeCategoriesProps) {
  const { t } = useLanguage();
  const visibleCategories = categories.slice(0, 6);
  const [leadCategory, ...secondaryCategories] = visibleCategories;

  if (visibleCategories.length === 0) {
    return null;
  }

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
                Encuentra lo que buscas en segundos
              </h2>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Todo está organizado para que encuentres lo que buscas sin
                perder tiempo en secciones que no te interesan.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-700/80">
                  Navegación simple
                </p>
                <p className="mt-3 text-lg font-bold tracking-tight text-slate-950">
                  {visibleCategories.length} categorías para explorar
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Cada categoría tiene una entrada visual más clara y una llamada a
                  la acción directa.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200/80 bg-slate-950 px-5 py-5 text-white shadow-[0_22px_70px_rgba(2,6,23,0.18)]">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-200/78">
                  Empieza por la principal
                </p>
                <p className="mt-3 text-lg font-bold tracking-tight">
                  La primera categoría es la más popular.
                </p>
                <p className="mt-2 text-sm leading-7 text-white/74">
                  El resto sigue el mismo criterio: menos ruido, más decisión.
                </p>
                {categories.length > 6 && (
                  <Link
                    href="/#categorias"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
                  >
                    Ver todas las categorías
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {leadCategory ? (
              <CategoryCard category={leadCategory} featured />
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
  const theme = parseCategoryColor(category.color);
  const cardStyle: CSSProperties = {
    background: theme.surface,
    borderColor: theme.borderColor,
    boxShadow: `0 20px 54px ${theme.shadowColor}`,
  };

  return (
    <Link
      href={`/categoria/${category.slug}`}
      className={`group flex h-full flex-col overflow-hidden rounded-[1.7rem] border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(16,185,129,0.14)] sm:p-5 ${
        featured ? "sm:col-span-2" : ""
      }`}
      style={cardStyle}
    >
      <div className={`relative overflow-hidden rounded-[1.35rem] ${featured ? "aspect-[1.45]" : "aspect-[1.08]"}`}>
        {category.image_url && (category.image_url.startsWith("http") || category.image_url.startsWith("/productos")) ? (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            sizes={featured ? "(max-width: 640px) 100vw, 46vw" : "(max-width: 640px) 100vw, 22vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(236,253,245,0.8),rgba(255,255,255,0.98))]">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-white/80 bg-white/90 text-emerald-600 shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
              style={{ backgroundColor: theme.tint }}
            >
              <Icon className="h-8 w-8" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/48 via-slate-950/12 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.22em] text-white/90 backdrop-blur-sm">
           Selección editorial
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
            Ruta directa
          </span>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-sm transition-transform duration-300 group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-1 pb-1 pt-5 sm:px-2 sm:pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-white/88 text-emerald-600 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <Icon className="h-5 w-5" />
          </div>
          <span className="inline-flex items-center gap-1 text-[0.72rem] font-black uppercase tracking-[0.2em] text-emerald-700">
            Abrir
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>

        <div className="space-y-2">
          <h3
            className={`font-black tracking-tight text-slate-950 ${
              featured ? "text-2xl sm:text-[1.85rem]" : "text-lg"
            }`}
          >
            {category.name}
          </h3>
          <p className="text-sm leading-7 text-slate-600">
            {category.description || "Productos seleccionados para decidir más rápido."}
          </p>
        </div>

        <div className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          Ver categoría
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
