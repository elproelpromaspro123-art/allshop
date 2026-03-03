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
import { TrustBar } from "@/components/TrustBar";
import { PRODUCTS as MOCK_PRODUCTS, CATEGORIES as MOCK_CATEGORIES } from "@/data/mock";
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

function SectionTitle({
  badge,
  title,
  subtitle,
  isDark,
}: {
  badge: string;
  title: string;
  subtitle: string;
  isDark: boolean;
}) {
  return (
    <div className="mb-8 sm:mb-10">
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-4 ${
          isDark ? "bg-white/10 text-neutral-300" : "bg-neutral-100 text-neutral-700"
        }`}
      >
        {badge}
      </span>
      <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-3 ${isDark ? "text-white" : "text-neutral-900"}`}>
        {title}
      </h2>
      <p className={`text-sm sm:text-base max-w-2xl ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>{subtitle}</p>
    </div>
  );
}

function CommitmentCard({
  icon: Icon,
  title,
  description,
  isDark,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  isDark: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border ${
        isDark ? "bg-[#141920] border-white/10" : "bg-white border-neutral-200"
      }`}
    >
      <div className={`w-9 h-9 rounded-xl mb-3 flex items-center justify-center ${isDark ? "bg-white/10" : "bg-neutral-100"}`}>
        <Icon className={`w-4 h-4 ${isDark ? "text-neutral-200" : "text-neutral-700"}`} />
      </div>
      <p className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-neutral-900"}`}>{title}</p>
      <p className={`text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>{description}</p>
    </div>
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
          if (Array.isArray(data.featuredProducts) && data.featuredProducts.length > 0) {
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
    { icon: ShieldCheck, label: t("trust.warranty"), sub: t("trust.warrantySub") },
    { icon: RotateCcw, label: t("trust.returns"), sub: t("trust.returnsSub") },
    { icon: Clock, label: t("trust.support"), sub: t("trust.supportSub") },
  ];

  return (
    <>
      <section
        className={`relative overflow-hidden border-b ${
          isDark ? "bg-[#0b0f14] border-white/10" : "bg-[#eef5f1] border-[var(--border)]"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-0 ${
            isDark
              ? "bg-[radial-gradient(circle_at_10%_10%,rgba(132,251,127,0.14),transparent_34%)]"
              : "bg-[radial-gradient(circle_at_12%_8%,rgba(73,204,104,0.2),transparent_30%)]"
          }`}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="lg:col-span-7"
            >
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-5 ${
                  isDark ? "bg-white/10 text-neutral-300" : "bg-[var(--surface)] text-[#385046] border border-[var(--border)]"
                }`}
              >
                {t("hero.badge")}
              </span>

              <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight ${isDark ? "text-white" : "text-neutral-900"}`}>
                {t("hero.title")} <span className={isDark ? "text-[#a4ff9e]" : "text-[var(--accent-strong)]"}>{t("hero.titleAccent")}</span>
              </h1>

              <p className={`mt-4 text-base sm:text-lg max-w-2xl ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                {t("hero.subtitle")}
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link href="#productos">
                  <Button size="xl" className="w-full sm:w-auto">
                    {t("hero.ctaPrimary")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="#categorias">
                  <Button
                    size="xl"
                    variant="outline"
                    className={`w-full sm:w-auto ${
                      isDark
                        ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_12%)]"
                    }`}
                  >
                    {t("hero.ctaSecondary")}
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className={`rounded-xl px-3.5 py-2 ${isDark ? "bg-white/5" : "bg-[var(--surface)] border border-[var(--border)]"}`}>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>{t("hero.statGateway")}</p>
                  <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>{t("hero.stats1")}</p>
                </div>
                <div className={`rounded-xl px-3.5 py-2 ${isDark ? "bg-white/5" : "bg-[var(--surface)] border border-[var(--border)]"}`}>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>{t("hero.statGlobal")}</p>
                  <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>{t("hero.stats2")}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <div className={`rounded-3xl p-5 sm:p-6 border ${isDark ? "bg-[#131922] border-white/10" : "bg-[var(--surface)] border-[var(--border)] shadow-[0_25px_50px_-38px_rgba(73,204,104,0.85)]"}`}>
                <div className="flex items-center justify-between mb-5">
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>{t("hero.badgeVerified")}</p>
                  <CheckCircle2 className="w-5 h-5 text-[var(--accent-strong)]" />
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                  {t("hero.badgeVerifiedSub")}
                </p>

                <div className={`mt-5 pt-5 border-t ${isDark ? "border-white/10" : "border-neutral-200"}`}>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className={`rounded-xl p-3 ${isDark ? "bg-white/5" : "bg-[#ecf4ef]"}`}>
                      <CreditCard className={`w-4 h-4 mb-2 ${isDark ? "text-neutral-200" : "text-[var(--accent-strong)]"}`} />
                      <p className={`font-medium ${isDark ? "text-white" : "text-neutral-900"}`}>{t("trust.warranty")}</p>
                    </div>
                    <div className={`rounded-xl p-3 ${isDark ? "bg-white/5" : "bg-[#ecf4ef]"}`}>
                      <Globe className={`w-4 h-4 mb-2 ${isDark ? "text-neutral-200" : "text-[var(--accent-strong)]"}`} />
                      <p className={`font-medium ${isDark ? "text-white" : "text-neutral-900"}`}>{t("hero.badgeJoin")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className={isDark ? "bg-[#0d1218]" : "bg-[var(--surface)]"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {trustStrip.map((item) => (
              <div
                key={item.label}
                className={`rounded-xl p-3 border ${
                  isDark ? "bg-white/5 border-white/10" : "bg-[#f6faf8] border-[var(--border)]"
                }`}
              >
                <item.icon className={`w-4 h-4 mb-2 ${isDark ? "text-neutral-200" : "text-[var(--accent-strong)]"}`} />
                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>{item.label}</p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="categorias" className={isDark ? "bg-[#0b0f14]" : "bg-[#eef5f1]"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <SectionTitle
            badge={t("categories.badge")}
            title={t("categories.title")}
            subtitle={t("categories.subtitle")}
            isDark={isDark}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((cat, i) => {
              const IconComponent = CATEGORY_ICONS[cat.icon ?? ""] ?? Sparkles;
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
                    className={`h-full rounded-2xl border p-4 block transition-colors ${
                      isDark
                        ? "bg-[#131922] border-white/10 hover:border-white/20"
                        : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]/50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${cat.color ?? "#94a3b8"}20` }}>
                      <IconComponent className="w-5 h-5" style={{ color: cat.color ?? undefined }} />
                    </div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-neutral-900"}`}>{cat.name}</p>
                    <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>{cat.description}</p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="productos" className={isDark ? "bg-[#0d1218]" : "bg-[var(--surface)]"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-end justify-between gap-3 mb-8">
            <SectionTitle
              badge={t("products.badge")}
              title={t("products.title")}
              subtitle={t("products.subtitle")}
              isDark={isDark}
            />
            <Link href="/categoria/cocina" className="hidden sm:block mb-8">
              <Button variant="outline" className={isDark ? "border-white/20 bg-white/5 text-white hover:bg-white/10" : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_10%)]"}>
                {t("products.viewAll")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {featuredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          <div className="sm:hidden mt-6">
            <Link href="/categoria/cocina">
              <Button variant="outline" className={`w-full ${isDark ? "border-white/20 bg-white/5 text-white hover:bg-white/10" : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_10%)]"}`}>
                {t("products.viewAllMobile")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className={isDark ? "bg-[#0b0f14]" : "bg-[#eff6f2]"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div>
              <SectionTitle
                badge={t("guarantee.badge")}
                title={t("guarantee.title")}
                subtitle={t("guarantee.description")}
                isDark={isDark}
              />
              <TrustBar variant="vertical" />
            </div>

            <div className="space-y-4 mt-1">
              <CommitmentCard
                icon={ShieldCheck}
                title={t("commitment.returnsTitle")}
                description={t("commitment.returnsDesc")}
                isDark={isDark}
              />
              <CommitmentCard
                icon={Truck}
                title={t("commitment.shippingTitle")}
                description={t("commitment.shippingDesc")}
                isDark={isDark}
              />
              <CommitmentCard
                icon={CreditCard}
                title={t("commitment.paymentTitle")}
                description={t("commitment.paymentDesc")}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={isDark ? "bg-[#0d1218] border-t border-white/10" : "bg-[var(--surface)] border-t border-[var(--border)]"}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold mb-5 ${isDark ? "bg-white/10 text-neutral-300" : "bg-neutral-100 text-neutral-700"}`}>
            {t("cta.badge")}
          </span>
          <h2 className={`text-2xl sm:text-4xl font-semibold tracking-tight ${isDark ? "text-white" : "text-neutral-900"}`}>
            {t("cta.title")}
          </h2>
          <p className={`mt-4 text-sm sm:text-base ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>{t("cta.subtitle")}</p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="#productos">
              <Button size="xl" className="w-full sm:w-auto">
                <ShoppingBag className="w-4 h-4" />
                {t("cta.buyNow")}
              </Button>
            </Link>
            <Link href="#categorias">
              <Button
                size="xl"
                variant="outline"
                className={`w-full sm:w-auto ${isDark ? "border-white/20 bg-white/5 text-white hover:bg-white/10" : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_10%)]"}`}
              >
                {t("cta.explore")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <p className={`mt-5 text-xs ${isDark ? "text-neutral-500" : "text-neutral-500"}`}>
            {t("cta.freeShipping")}
          </p>
        </div>
      </section>
    </>
  );
}
