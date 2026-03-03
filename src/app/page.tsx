"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChefHat,
  Smartphone,
  Home,
  Sparkles,
  Dumbbell,
  ShieldCheck,
  Truck,
  RotateCcw,
  Clock,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import {
  PRODUCTS as MOCK_PRODUCTS,
  CATEGORIES as MOCK_CATEGORIES,
} from "@/data/mock";
import type { Category, Product } from "@/types";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  ChefHat,
  Smartphone,
  Home,
  Sparkles,
  Dumbbell,
};

function SectionLabel({ children, isDark }: { children: string; isDark: boolean }) {
  return (
    <span
      className={`inline-block text-xs font-semibold uppercase tracking-[0.15em] mb-4 ${isDark ? "text-[var(--accent)]" : "text-[var(--accent-dim)]"
        }`}
    >
      {children}
    </span>
  );
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(() =>
    MOCK_PRODUCTS.filter((p) => p.is_featured)
  );

  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    let cancelled = false;

    const loadStorefront = async () => {
      try {
        const response = await fetch("/api/storefront");
        const data = (await response.json()) as {
          categories: Category[];
          featuredProducts: Product[];
        };

        if (!cancelled) {
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
          }
          if (
            Array.isArray(data.featuredProducts) &&
            data.featuredProducts.length > 0
          ) {
            setFeaturedProducts(data.featuredProducts);
          }
        }
      } catch {
        // Keep fallback mock data
      }
    };

    void loadStorefront();
    return () => {
      cancelled = true;
    };
  }, []);

  const trustStrip = [
    { icon: Truck, label: t("trust.shipping"), sub: t("trust.shippingSub") },
    {
      icon: ShieldCheck,
      label: t("trust.warranty"),
      sub: t("trust.warrantySub"),
    },
    { icon: RotateCcw, label: t("trust.returns"), sub: t("trust.returnsSub") },
    { icon: Clock, label: t("trust.support"), sub: t("trust.supportSub") },
  ];

  return (
    <>
      {/* ── HERO ── */}
      <section
        className={`relative overflow-hidden ${isDark ? "bg-[#090d14]" : "bg-[var(--background)]"
          }`}
      >
        {/* Gradient orbs */}
        <div
          className={`pointer-events-none absolute w-[600px] h-[600px] -top-[200px] -left-[200px] rounded-full blur-[120px] ${isDark
              ? "bg-[rgba(132,251,127,0.06)]"
              : "bg-[rgba(73,204,104,0.08)]"
            }`}
        />
        <div
          className={`pointer-events-none absolute w-[400px] h-[400px] -bottom-[100px] -right-[100px] rounded-full blur-[100px] ${isDark
              ? "bg-[rgba(73,204,104,0.04)]"
              : "bg-[rgba(132,251,127,0.06)]"
            }`}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16 sm:pb-24 lg:pb-32">
          <div className="max-w-3xl mx-auto text-center lg:text-left lg:mx-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1
                className={`text-[2rem] sm:text-[2.8rem] lg:text-[3.6rem] font-extrabold tracking-tight leading-[1.08] ${isDark ? "text-white" : "text-[var(--foreground)]"
                  }`}
              >
                {t("hero.title")}{" "}
                <span className="text-[var(--accent)]">
                  {t("hero.titleAccent")}
                </span>
              </h1>

              <p
                className={`mt-5 sm:mt-6 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 ${isDark ? "text-neutral-400" : "text-[var(--muted)]"
                  }`}
              >
                {t("hero.subtitle")}
              </p>

              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="#productos">
                  <Button size="xl" className="w-full sm:w-auto gap-2">
                    {t("hero.ctaPrimary")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="#categorias">
                  <Button
                    size="xl"
                    variant="outline"
                    className={`w-full sm:w-auto ${isDark
                        ? "border-white/[0.1] text-white hover:bg-white/[0.04]"
                        : ""
                      }`}
                  >
                    {t("hero.ctaSecondary")}
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-12 sm:mt-16 flex flex-wrap gap-6 sm:gap-10 justify-center lg:justify-start"
            >
              {[
                { value: t("hero.statGateway"), label: t("hero.stats1") },
                { value: t("hero.statGlobal"), label: t("hero.stats2") },
              ].map((stat) => (
                <div key={stat.label}>
                  <p
                    className={`text-xl sm:text-2xl font-bold ${isDark ? "text-white" : "text-[var(--foreground)]"
                      }`}
                  >
                    {stat.value}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${isDark ? "text-neutral-500" : "text-[var(--muted)]"
                      }`}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section
        className={`border-y ${isDark
            ? "bg-[#0c1019] border-white/[0.06]"
            : "bg-[var(--surface)] border-[var(--border)]"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustStrip.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark
                      ? "bg-white/[0.05] text-[var(--accent)]"
                      : "bg-[var(--surface-muted)] text-[var(--accent-dim)]"
                    }`}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold leading-tight ${isDark ? "text-white" : "text-[var(--foreground)]"
                      }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`text-[11px] mt-0.5 ${isDark ? "text-neutral-500" : "text-[var(--muted)]"
                      }`}
                  >
                    {item.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section
        id="categorias"
        className={isDark ? "bg-[#090d14]" : "bg-[var(--background)]"}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <SectionLabel isDark={isDark}>{t("categories.badge")}</SectionLabel>
          <h2
            className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 ${isDark ? "text-white" : "text-[var(--foreground)]"
              }`}
          >
            {t("categories.title")}
          </h2>
          <p
            className={`text-sm sm:text-base max-w-xl mb-10 sm:mb-12 ${isDark ? "text-neutral-400" : "text-[var(--muted)]"
              }`}
          >
            {t("categories.subtitle")}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((cat, i) => {
              const IconComponent =
                CATEGORY_ICONS[cat.icon ?? ""] ?? Sparkles;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className={`group h-full rounded-2xl border p-4 sm:p-5 block transition-all duration-200 ${isDark
                        ? "bg-[var(--surface)] border-white/[0.06] hover:border-[var(--accent)]/30 hover:bg-[#111827]"
                        : "bg-white border-[var(--border)] hover:border-[var(--accent-strong)]/40 hover:shadow-[0_8px_24px_-12px_rgba(73,204,104,0.3)]"
                      }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{
                        backgroundColor: `${cat.color ?? "#94a3b8"}15`,
                      }}
                    >
                      <IconComponent
                        className="w-5 h-5"
                        style={{ color: cat.color ?? undefined }}
                      />
                    </div>
                    <p
                      className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-[var(--foreground)]"
                        }`}
                    >
                      {cat.name}
                    </p>
                    <p
                      className={`text-xs leading-relaxed ${isDark ? "text-neutral-500" : "text-[var(--muted)]"
                        }`}
                    >
                      {cat.description}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section
        id="productos"
        className={`border-t ${isDark
            ? "bg-[#0c1019] border-white/[0.06]"
            : "bg-[var(--surface)] border-[var(--border)]"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
            <div>
              <SectionLabel isDark={isDark}>
                {t("products.badge")}
              </SectionLabel>
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 ${isDark ? "text-white" : "text-[var(--foreground)]"
                  }`}
              >
                {t("products.title")}
              </h2>
              <p
                className={`text-sm sm:text-base max-w-lg ${isDark ? "text-neutral-400" : "text-[var(--muted)]"
                  }`}
              >
                {t("products.subtitle")}
              </p>
            </div>
            <Link href="/categoria/cocina" className="hidden sm:block shrink-0">
              <Button
                variant="outline"
                className={`gap-1.5 ${isDark
                    ? "border-white/[0.1] text-white hover:bg-white/[0.04]"
                    : ""
                  }`}
              >
                {t("products.viewAll")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {featuredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          <div className="sm:hidden mt-6">
            <Link href="/categoria/cocina">
              <Button
                variant="outline"
                className={`w-full ${isDark
                    ? "border-white/[0.1] text-white hover:bg-white/[0.04]"
                    : ""
                  }`}
              >
                {t("products.viewAllMobile")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── GUARANTEES ── */}
      <section className={isDark ? "bg-[#090d14]" : "bg-[var(--background)]"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <SectionLabel isDark={isDark}>
                {t("guarantee.badge")}
              </SectionLabel>
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 ${isDark ? "text-white" : "text-[var(--foreground)]"
                  }`}
              >
                {t("guarantee.title")}
              </h2>
              <p
                className={`text-sm sm:text-base max-w-lg mb-8 ${isDark ? "text-neutral-400" : "text-[var(--muted)]"
                  }`}
              >
                {t("guarantee.description")}
              </p>

              <div className="space-y-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: t("commitment.returnsTitle"),
                    desc: t("commitment.returnsDesc"),
                  },
                  {
                    icon: Truck,
                    title: t("commitment.shippingTitle"),
                    desc: t("commitment.shippingDesc"),
                  },
                  {
                    icon: CreditCard,
                    title: t("commitment.paymentTitle"),
                    desc: t("commitment.paymentDesc"),
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={`flex items-start gap-3.5 ${isDark ? "text-neutral-300" : "text-neutral-600"
                      }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isDark
                          ? "bg-white/[0.05] text-[var(--accent)]"
                          : "bg-[var(--surface-muted)] text-[var(--accent-dim)]"
                        }`}
                    >
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold ${isDark ? "text-white" : "text-[var(--foreground)]"
                          }`}
                      >
                        {item.title}
                      </p>
                      <p
                        className={`text-sm leading-relaxed ${isDark ? "text-neutral-500" : "text-[var(--muted)]"
                          }`}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust card */}
            <div className="flex items-center">
              <div
                className={`w-full rounded-2xl p-6 sm:p-8 border ${isDark
                    ? "bg-[var(--surface)] border-white/[0.06]"
                    : "bg-white border-[var(--border)] shadow-[0_16px_48px_-16px_rgba(0,0,0,0.06)]"
                  }`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle2 className="w-5 h-5 text-[var(--accent)]" />
                  <p
                    className={`text-base font-bold ${isDark ? "text-white" : "text-[var(--foreground)]"
                      }`}
                  >
                    {t("hero.badgeVerified")}
                  </p>
                </div>
                <p
                  className={`text-sm leading-relaxed mb-6 ${isDark ? "text-neutral-400" : "text-[var(--muted)]"
                    }`}
                >
                  {t("hero.badgeVerifiedSub")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      icon: CreditCard,
                      label: t("trust.warranty"),
                    },
                    {
                      icon: Globe,
                      label: t("hero.badgeJoin"),
                    },
                    {
                      icon: ShieldCheck,
                      label: t("trust.returns"),
                    },
                    {
                      icon: Truck,
                      label: t("trust.shipping"),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-xl p-3 ${isDark ? "bg-white/[0.03]" : "bg-[var(--surface-muted)]"
                        }`}
                    >
                      <item.icon
                        className={`w-4 h-4 mb-2 ${isDark
                            ? "text-[var(--accent)]"
                            : "text-[var(--accent-dim)]"
                          }`}
                      />
                      <p
                        className={`text-xs font-medium ${isDark ? "text-neutral-300" : "text-neutral-700"
                          }`}
                      >
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className={`border-t ${isDark
            ? "bg-[#0c1019] border-white/[0.06]"
            : "bg-[var(--surface)] border-[var(--border)]"
          }`}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <SectionLabel isDark={isDark}>{t("cta.badge")}</SectionLabel>
          <h2
            className={`text-2xl sm:text-4xl font-bold tracking-tight mb-4 ${isDark ? "text-white" : "text-[var(--foreground)]"
              }`}
          >
            {t("cta.title")}
          </h2>
          <p
            className={`text-sm sm:text-base max-w-lg mx-auto ${isDark ? "text-neutral-400" : "text-[var(--muted)]"
              }`}
          >
            {t("cta.subtitle")}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="#productos">
              <Button size="xl" className="w-full sm:w-auto gap-2">
                <ShoppingBag className="w-4 h-4" />
                {t("cta.buyNow")}
              </Button>
            </Link>
            <Link href="#categorias">
              <Button
                size="xl"
                variant="outline"
                className={`w-full sm:w-auto gap-2 ${isDark
                    ? "border-white/[0.1] text-white hover:bg-white/[0.04]"
                    : ""
                  }`}
              >
                {t("cta.explore")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <p
            className={`mt-5 text-xs ${isDark ? "text-neutral-600" : "text-neutral-400"
              }`}
          >
            {t("cta.freeShipping")}
          </p>
        </div>
      </section>
    </>
  );
}
