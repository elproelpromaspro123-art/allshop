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
    <section id="categorias" className="py-16 sm:py-24 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-badge mb-4">{t("categories.badge")}</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {t("categories.title")}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Explora colecciones organizadas para que cada categoria tenga una
            presencia clara y una lectura rapida.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 auto-rows-fr lg:grid-cols-4 sm:gap-4">
          {visibleCategories.map((category, index) => {
            const Icon = CATEGORY_ICONS[category.icon || ""] || Sparkles;
            const isFeature = index === 0;

            return (
              <div
                key={category.id}
                className={`${isFeature ? "lg:col-span-2 lg:row-span-2" : ""} scroll-reveal`}
                data-delay={index + 1}
              >
                <Link
                  href={`/categoria/${category.slug}`}
                  className={`group block h-full transition-all duration-300 ${
                    isFeature
                      ? "surface-panel-dark surface-ambient brand-v-slash px-6 py-6 sm:px-8 sm:py-8"
                      : "surface-panel px-4 py-4 sm:px-5 sm:py-5"
                  }`}
                >
                  <div
                    className={`relative z-[1] flex h-full flex-col ${
                      isFeature ? "justify-between" : ""
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${
                        isFeature
                          ? "h-14 w-14 bg-white/10 text-emerald-300"
                          : "h-11 w-11 bg-indigo-50 text-indigo-600"
                      }`}
                    >
                      <Icon className={isFeature ? "h-7 w-7" : "h-5 w-5"} />
                    </div>

                    <div className={isFeature ? "mt-auto pt-10" : "mt-4"}>
                      <p
                        className={`font-semibold ${
                          isFeature
                            ? "text-xl text-white sm:text-2xl"
                            : "text-sm text-[var(--foreground)] sm:text-base"
                        }`}
                      >
                        {category.name}
                      </p>
                      <p
                        className={`mt-2 leading-relaxed ${
                          isFeature
                            ? "max-w-md text-sm text-white/70 sm:text-base"
                            : "text-xs text-[var(--muted)] sm:text-sm"
                        }`}
                      >
                        {category.description}
                      </p>
                      <span
                        className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold transition-transform duration-300 group-hover:translate-x-0.5 ${
                          isFeature
                            ? "text-emerald-200"
                            : "text-[var(--accent-strong)]"
                        }`}
                      >
                        Ver categoria <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
