"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  ChefHat,
  CreditCard,
  Dumbbell,
  Headset,
  Home,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Truck,
  Star,
  Zap,
  Package,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";
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

/* ── Animated section wrapper ── */
function AnimatedSection({
  children,
  className,
  id,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.section>
  );
}

function SectionLabel({ children, isDark }: { children: string; isDark: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] mb-4 ${
        isDark ? "text-[var(--accent)]" : "text-[var(--accent-strong)]"
      }`}
    >
      <span className="w-5 h-[2px] rounded-full bg-current" />
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
    { Icon: Truck, label: t("trust.shipping"), sub: t("trust.shippingSub") },
    { Icon: ShieldCheck, label: t("trust.warranty"), sub: t("trust.warrantySub") },
    { Icon: RotateCcw, label: t("trust.returns"), sub: t("trust.returnsSub") },
    { Icon: Headset, label: t("trust.support"), sub: t("trust.supportSub") },
  ];

  const commitments = [
    {
      Icon: RotateCcw,
      title: t("commitment.returnsTitle"),
      desc: t("commitment.returnsDesc"),
    },
    {
      Icon: Truck,
      title: t("commitment.shippingTitle"),
      desc: t("commitment.shippingDesc"),
    },
    {
      Icon: CreditCard,
      title: t("commitment.paymentTitle"),
      desc: t("commitment.paymentDesc"),
    },
  ];

  const trustGrid = [
    { Icon: ShieldCheck, label: t("trust.warranty") },
    { Icon: Truck, label: t("trust.shipping") },
    { Icon: RotateCcw, label: t("trust.returns") },
    { Icon: CreditCard, label: t("commitment.paymentTitle") },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <section className={`relative overflow-hidden ${isDark ? "bg-[#0b0d14]" : "bg-[var(--background)]"}`}>
        {/* Subtle gradient orbs */}
        <div
          className={`pointer-events-none absolute w-[800px] h-[800px] -top-[300px] -left-[250px] rounded-full blur-[180px] ${
            isDark ? "bg-[rgba(0,232,141,0.04)]" : "bg-[rgba(0,201,123,0.05)]"
          }`}
        />
        <div
          className={`pointer-events-none absolute w-[500px] h-[500px] -bottom-[200px] -right-[150px] rounded-full blur-[150px] ${
            isDark ? "bg-[rgba(0,232,141,0.03)]" : "bg-[rgba(0,201,123,0.04)]"
          }`}
        />

        {/* Dot pattern background */}
        <div
          className={`pointer-events-none absolute inset-0 ${
            isDark ? "opacity-[0.3]" : "opacity-[0.5]"
          } dot-pattern`}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 lg:pt-32 pb-16 sm:pb-20 lg:pb-28">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 ${
                    isDark
                      ? "bg-white/[0.04] text-neutral-300 border border-white/[0.06]"
                      : "bg-white text-[var(--muted)] border border-[var(--border)] shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
                  }`}
                >
                  <BadgeCheck className="w-3.5 h-3.5 text-[var(--accent-strong)]" />
                  {t("hero.badge")}
                </div>

                <h1
                  className={`text-[2rem] sm:text-[2.8rem] lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.06] ${
                    isDark ? "text-white" : "text-[var(--foreground)]"
                  }`}
                >
                  {t("hero.title")}{" "}
                  <span className="text-gradient">
                    {t("hero.titleAccent")}
                  </span>
                </h1>

                <p
                  className={`mt-5 sm:mt-6 text-base sm:text-lg leading-relaxed max-w-2xl ${
                    isDark ? "text-neutral-400" : "text-[var(--muted)]"
                  }`}
                >
                  {t("hero.subtitle")}
                </p>

                <div className="mt-8 sm:mt-9 flex flex-col sm:flex-row gap-3">
                  <Link href="#productos">
                    <Button size="xl" className="w-full sm:w-auto gap-2 group">
                      {t("hero.ctaPrimary")}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <Link href="#categorias">
                    <Button
                      size="xl"
                      variant="outline"
                      className={`w-full sm:w-auto ${
                        isDark
                          ? "border-white/[0.08] text-white hover:bg-white/[0.04]"
                          : ""
                      }`}
                    >
                      {t("hero.ctaSecondary")}
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-10 sm:mt-12 flex flex-wrap gap-8 sm:gap-12"
                >
                  {[
                    { value: t("hero.statGateway"), label: t("hero.stats1"), Icon: CreditCard },
                    { value: t("hero.statGlobal"), label: t("hero.stats2"), Icon: Package },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isDark ? "bg-white/[0.04]" : "bg-[var(--accent-strong)]/8"
                        }`}
                      >
                        <stat.Icon className="w-4.5 h-4.5 text-[var(--accent-strong)]" />
                      </div>
                      <div>
                        <p
                          className={`text-sm font-bold ${
                            isDark ? "text-white" : "text-[var(--foreground)]"
                          }`}
                        >
                          {stat.value}
                        </p>
                        <p
                          className={`text-xs ${
                            isDark ? "text-neutral-500" : "text-[var(--muted)]"
                          }`}
                        >
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>

            {/* Hero card */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className={`relative rounded-2xl border p-6 sm:p-8 ${
                  isDark
                    ? "bg-[var(--surface)] border-white/[0.05]"
                    : "bg-white border-[var(--border)] shadow-[var(--shadow-elevated)]"
                }`}
              >
                {/* Top accent gradient */}
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-[var(--gradient-primary)]" />

                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isDark ? "bg-white/[0.05]" : "bg-[var(--accent-strong)]/8"
                    }`}
                  >
                    <BadgeCheck className="w-5 h-5 text-[var(--accent-strong)]" />
                  </div>
                  <div>
                    <p
                      className={`text-base font-bold ${
                        isDark ? "text-white" : "text-[var(--foreground)]"
                      }`}
                    >
                      {t("hero.badgeVerified")}
                    </p>
                  </div>
                </div>
                <p
                  className={`text-sm leading-relaxed mb-6 ${
                    isDark ? "text-neutral-400" : "text-[var(--muted)]"
                  }`}
                >
                  {t("hero.badgeVerifiedSub")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {trustGrid.map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className={`rounded-xl p-3.5 transition-all duration-300 hover:scale-[1.02] cursor-default ${
                        isDark
                          ? "bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.04]"
                          : "bg-[var(--surface-muted)] hover:bg-white hover:shadow-sm border border-transparent hover:border-[var(--border)]"
                      }`}
                    >
                      <item.Icon className="w-4 h-4 text-[var(--accent-strong)] mb-2" />
                      <p
                        className={`text-xs font-medium ${
                          isDark ? "text-neutral-300" : "text-neutral-700"
                        }`}
                      >
                        {item.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <AnimatedSection
        className={`border-y ${
          isDark
            ? "bg-[var(--surface)] border-white/[0.05]"
            : "bg-white border-[var(--border)]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {trustStrip.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 group"
              >
                <div
                  className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
                    isDark
                      ? "bg-white/[0.04] group-hover:bg-white/[0.06]"
                      : "bg-[var(--accent-strong)]/8 group-hover:bg-[var(--accent-strong)]/12"
                  }`}
                >
                  <item.Icon className="w-4 h-4 text-[var(--accent-strong)]" />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold leading-tight ${
                      isDark ? "text-white" : "text-[var(--foreground)]"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`text-[11px] mt-0.5 ${
                      isDark ? "text-neutral-500" : "text-[var(--muted)]"
                    }`}
                  >
                    {item.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── Categories ── */}
      <AnimatedSection
        id="categorias"
        className={isDark ? "bg-[#0b0d14]" : "bg-[var(--background)]"}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <SectionLabel isDark={isDark}>{t("categories.badge")}</SectionLabel>
          <h2
            className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 ${
              isDark ? "text-white" : "text-[var(--foreground)]"
            }`}
          >
            {t("categories.title")}
          </h2>
          <p
            className={`text-sm sm:text-base max-w-xl mb-10 sm:mb-12 ${
              isDark ? "text-neutral-400" : "text-[var(--muted)]"
            }`}
          >
            {t("categories.subtitle")}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((cat, i) => {
              const IconComponent = CATEGORY_ICONS[cat.icon ?? ""] ?? Sparkles;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.5 }}
                >
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className={`group h-full rounded-2xl border p-4 sm:p-5 block transition-all duration-300 ${
                      isDark
                        ? "bg-[var(--surface)] border-white/[0.05] hover:border-[var(--accent-strong)]/20 hover:bg-[var(--surface-muted)]"
                        : "bg-white border-[var(--border)] hover:border-[var(--accent-strong)]/30 hover:shadow-[var(--shadow-card-hover)]"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: `${cat.color ?? "#94a3b8"}12`,
                      }}
                    >
                      <IconComponent
                        className="w-5 h-5"
                        style={{ color: cat.color ?? undefined }}
                      />
                    </div>
                    <p
                      className={`text-sm font-semibold mb-1 ${
                        isDark ? "text-white" : "text-[var(--foreground)]"
                      }`}
                    >
                      {cat.name}
                    </p>
                    <p
                      className={`text-xs leading-relaxed ${
                        isDark ? "text-neutral-500" : "text-[var(--muted)]"
                      }`}
                    >
                      {cat.description}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-[var(--accent-strong)] text-xs font-medium opacity-0 translate-x-[-4px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                      <span>Explorar</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </AnimatedSection>

      {/* ── Featured products ── */}
      <AnimatedSection
        id="productos"
        className={`border-t ${
          isDark
            ? "bg-[var(--surface)] border-white/[0.05]"
            : "bg-white border-[var(--border)]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
            <div>
              <SectionLabel isDark={isDark}>
                {t("products.badge")}
              </SectionLabel>
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 ${
                  isDark ? "text-white" : "text-[var(--foreground)]"
                }`}
              >
                {t("products.title")}
              </h2>
              <p
                className={`text-sm sm:text-base max-w-lg ${
                  isDark ? "text-neutral-400" : "text-[var(--muted)]"
                }`}
              >
                {t("products.subtitle")}
              </p>
            </div>
            <Link href="/categoria/hogar" className="hidden sm:block shrink-0">
              <Button
                variant="outline"
                className={`gap-1.5 group ${
                  isDark
                    ? "border-white/[0.08] text-white hover:bg-white/[0.04]"
                    : ""
                }`}
              >
                {t("products.viewAll")}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>

          <div
            className={cn(
              "grid gap-3 sm:gap-5",
              featuredProducts.length === 1
                ? "grid-cols-1 max-w-sm"
                : "grid-cols-2 lg:grid-cols-4"
            )}
          >
            {featuredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          <div className="sm:hidden mt-6">
            <Link href="/categoria/hogar">
              <Button
                variant="outline"
                className={`w-full ${
                  isDark
                    ? "border-white/[0.08] text-white hover:bg-white/[0.04]"
                    : ""
                }`}
              >
                {t("products.viewAllMobile")}
              </Button>
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* ── Why choose us ── */}
      <AnimatedSection className={isDark ? "bg-[#0b0d14]" : "bg-[var(--background)]"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center mb-12 sm:mb-16">
            <SectionLabel isDark={isDark}>¿Por qué elegirnos?</SectionLabel>
            <h2
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 ${
                isDark ? "text-white" : "text-[var(--foreground)]"
              }`}
            >
              Tu experiencia es nuestra prioridad
            </h2>
            <p
              className={`text-sm sm:text-base max-w-2xl mx-auto ${
                isDark ? "text-neutral-400" : "text-[var(--muted)]"
              }`}
            >
              Nos enfocamos en ofrecer la mejor experiencia de compra con productos de calidad, envío seguro y atención personalizada.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                Icon: Zap,
                title: "Entrega rápida",
                desc: "Recibe tu pedido en tiempo récord con nuestro sistema de logística nacional optimizado.",
                iconColor: "text-amber-500",
                iconBg: isDark ? "bg-amber-500/10" : "bg-amber-50",
              },
              {
                Icon: ShieldCheck,
                title: "Compra protegida",
                desc: "Tu compra está respaldada con garantías reales y cobertura contra daños o pedidos incompletos.",
                iconColor: "text-[var(--accent-strong)]",
                iconBg: isDark ? "bg-[var(--accent-strong)]/10" : "bg-[var(--accent-strong)]/8",
              },
              {
                Icon: Star,
                title: "Calidad verificada",
                desc: "Cada producto pasa por controles de calidad antes de ser enviado a tu puerta.",
                iconColor: "text-blue-500",
                iconBg: isDark ? "bg-blue-500/10" : "bg-blue-50",
              },
              {
                Icon: Headset,
                title: "Soporte real",
                desc: "Un equipo de personas reales listo para ayudarte antes, durante y después de tu compra.",
                iconColor: "text-violet-500",
                iconBg: isDark ? "bg-violet-500/10" : "bg-violet-50",
              },
              {
                Icon: CreditCard,
                title: "Pago contra entrega",
                desc: "Paga solo cuando recibas tu producto en la puerta de tu casa. Sin riesgos.",
                iconColor: "text-pink-500",
                iconBg: isDark ? "bg-pink-500/10" : "bg-pink-50",
              },
              {
                Icon: Timer,
                title: "Seguimiento en vivo",
                desc: "Rastrea tu pedido en tiempo real desde que sale del almacén hasta tu hogar.",
                iconColor: "text-cyan-500",
                iconBg: isDark ? "bg-cyan-500/10" : "bg-cyan-50",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className={`group relative rounded-2xl border p-5 sm:p-6 transition-all duration-300 overflow-hidden ${
                  isDark
                    ? "bg-[var(--surface)] border-white/[0.05] hover:border-white/[0.1]"
                    : "bg-white border-[var(--border)] hover:shadow-[var(--shadow-card-hover)]"
                }`}
              >
                <div className="relative">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${item.iconBg}`}
                  >
                    <item.Icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <h3
                    className={`text-base font-bold mb-2 ${
                      isDark ? "text-white" : "text-[var(--foreground)]"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      isDark ? "text-neutral-400" : "text-[var(--muted)]"
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── Guarantee ── */}
      <AnimatedSection className={`border-t ${
        isDark
          ? "bg-[var(--surface)] border-white/[0.05]"
          : "bg-white border-[var(--border)]"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <SectionLabel isDark={isDark}>
                {t("guarantee.badge")}
              </SectionLabel>
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 ${
                  isDark ? "text-white" : "text-[var(--foreground)]"
                }`}
              >
                {t("guarantee.title")}
              </h2>
              <p
                className={`text-sm sm:text-base max-w-lg mb-8 ${
                  isDark ? "text-neutral-400" : "text-[var(--muted)]"
                }`}
              >
                {t("guarantee.description")}
              </p>

              <div className="space-y-4">
                {commitments.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-start gap-3.5 ${
                      isDark ? "text-neutral-300" : "text-neutral-600"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl shrink-0 mt-0.5 flex items-center justify-center transition-all duration-300 ${
                        isDark
                          ? "bg-white/[0.04]"
                          : "bg-[var(--accent-strong)]/8"
                      }`}
                    >
                      <item.Icon className="w-4 h-4 text-[var(--accent-strong)]" />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          isDark ? "text-white" : "text-[var(--foreground)]"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p
                        className={`text-sm leading-relaxed ${
                          isDark ? "text-neutral-500" : "text-[var(--muted)]"
                        }`}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <div
                className={`relative w-full rounded-2xl p-6 sm:p-8 border overflow-hidden ${
                  isDark
                    ? "bg-[var(--surface)] border-white/[0.05]"
                    : "bg-[var(--surface-muted)] border-[var(--border)]"
                }`}
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--gradient-primary)]" />

                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isDark ? "bg-white/[0.05]" : "bg-[var(--accent-strong)]/8"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-[var(--accent-strong)]" />
                  </div>
                  <p
                    className={`text-base font-bold ${
                      isDark ? "text-white" : "text-[var(--foreground)]"
                    }`}
                  >
                    {t("hero.badgeVerified")}
                  </p>
                </div>
                <p
                  className={`text-sm leading-relaxed mb-6 ${
                    isDark ? "text-neutral-400" : "text-[var(--muted)]"
                  }`}
                >
                  {t("hero.badgeVerifiedSub")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {trustGrid.map((item, i) => (
                    <motion.div
                      key={item.label}
                      whileInView={{ opacity: 1, y: 0 }}
                      initial={{ opacity: 0, y: 10 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className={`rounded-xl p-3 transition-all hover:scale-[1.02] cursor-default ${
                        isDark
                          ? "bg-white/[0.03] hover:bg-white/[0.05]"
                          : "bg-white hover:shadow-sm"
                      }`}
                    >
                      <item.Icon className="w-4 h-4 text-[var(--accent-strong)] mb-2" />
                      <p
                        className={`text-xs font-medium ${
                          isDark ? "text-neutral-300" : "text-neutral-700"
                        }`}
                      >
                        {item.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── CTA ── */}
      <AnimatedSection
        className={`border-t ${
          isDark
            ? "bg-[#0b0d14] border-white/[0.05]"
            : "bg-[var(--background)] border-[var(--border)]"
        }`}
      >
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center overflow-hidden">
          {/* Decorative glow */}
          <div
            className={`pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full blur-[100px] ${
              isDark ? "bg-[var(--accent-strong)]/[0.04]" : "bg-[var(--accent-strong)]/[0.05]"
            }`}
          />

          <div className="relative">
            <SectionLabel isDark={isDark}>{t("cta.badge")}</SectionLabel>
            <h2
              className={`text-2xl sm:text-4xl font-bold tracking-tight mb-4 ${
                isDark ? "text-white" : "text-[var(--foreground)]"
              }`}
            >
              {t("cta.title")}
            </h2>
            <p
              className={`text-sm sm:text-base max-w-lg mx-auto ${
                isDark ? "text-neutral-400" : "text-[var(--muted)]"
              }`}
            >
              {t("cta.subtitle")}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="#productos">
                <Button size="xl" className="w-full sm:w-auto gap-2 group">
                  <ShoppingBag className="w-4 h-4" />
                  {t("cta.buyNow")}
                </Button>
              </Link>
              <Link href="#categorias">
                <Button
                  size="xl"
                  variant="outline"
                  className={`w-full sm:w-auto gap-2 group ${
                    isDark
                      ? "border-white/[0.08] text-white hover:bg-white/[0.04]"
                      : ""
                  }`}
                >
                  {t("cta.explore")}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>

            <p
              className={`mt-5 text-xs ${
                isDark ? "text-neutral-600" : "text-neutral-400"
              }`}
            >
              {t("cta.freeShipping")}
            </p>
          </div>
        </div>
      </AnimatedSection>
    </>
  );
}
