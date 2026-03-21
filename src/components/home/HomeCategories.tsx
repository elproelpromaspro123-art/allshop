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
import { motion, useReducedMotion } from "framer-motion";
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
  const prefersReducedMotion = useReducedMotion();
  const visibleCategories = categories.slice(0, 6);

  return (
    <section id="categorias" className="v-section" data-tone="base">
      <div className="v-section-inner">
        <motion.div
          className="v-section-grid"
          data-layout="split"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        >
          <div className="surface-panel px-5 py-6 sm:px-7 sm:py-8">
            <div className="relative z-[1] v-editorial-copy">
              <p className="section-badge">{t("categories.badge")}</p>
              <h2 className="text-headline text-[var(--foreground)]">
                Categorías separadas para que cada recorrido se entienda de un
                vistazo.
              </h2>
              <p className="v-prose text-sm sm:text-base">
                La navegación gana claridad cuando cada colección tiene un
                espacio reconocible, una promesa concreta y una entrada visual
                consistente. Eso reduce ruido y ayuda a decidir más rápido.
              </p>

              <div className="v-mini-grid mt-3">
                <div className="rounded-[1.25rem] border border-[var(--border-subtle)] bg-white/85 px-4 py-4">
                  <p className="v-kicker">Criterio</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                    Colecciones cortas, útiles y fáciles de recorrer.
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--border-subtle)] bg-white/85 px-4 py-4">
                  <p className="v-kicker">Lectura</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                    Cada bloque explica qué tipo de productos vive allí y por
                    qué importa.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {visibleCategories.map((category, index) => {
              const Icon = CATEGORY_ICONS[category.icon || ""] || Sparkles;
              const isFeature = index === 0;

              return (
                <motion.div
                  key={category.id}
                  className={isFeature ? "sm:col-span-2" : ""}
                  initial={
                    prefersReducedMotion ? false : { opacity: 0, y: 22, scale: 0.98 }
                  }
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.45,
                    delay: index * 0.05,
                  }}
                >
                  <Link
                    href={`/categoria/${category.slug}`}
                    className={
                      isFeature
                        ? "surface-panel-dark surface-ambient brand-v-slash block h-full px-6 py-6 sm:px-7 sm:py-7"
                        : "surface-panel block h-full px-5 py-5 sm:px-6"
                    }
                  >
                    <div className="relative z-[1] flex h-full flex-col">
                      <div
                        className={
                          isFeature
                            ? "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/8 text-emerald-200"
                            : "flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent-strong)]"
                        }
                      >
                        <Icon className={isFeature ? "h-6 w-6" : "h-5 w-5"} />
                      </div>

                      <div className={isFeature ? "mt-10" : "mt-5"}>
                        <p
                          className={
                            isFeature
                              ? "text-title-lg text-white"
                              : "text-lg font-semibold text-[var(--foreground)]"
                          }
                        >
                          {category.name}
                        </p>
                        <p
                          className={
                            isFeature
                              ? "mt-3 max-w-xl text-sm leading-7 text-white/74"
                              : "mt-3 text-sm leading-7 text-[var(--muted)]"
                          }
                        >
                          {category.description}
                        </p>
                      </div>

                      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                        <span
                          className={
                            isFeature
                              ? "text-emerald-200"
                              : "text-[var(--accent-strong)]"
                          }
                        >
                          Ver categoría
                        </span>
                        <ArrowRight
                          className={
                            isFeature
                              ? "h-4 w-4 text-emerald-200"
                              : "h-4 w-4 text-[var(--accent-strong)]"
                          }
                        />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="v-section-divider" />
      </div>
    </section>
  );
}
