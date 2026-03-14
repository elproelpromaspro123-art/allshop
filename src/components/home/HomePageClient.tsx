"use client";

import Link from "next/link";
import type { ElementType } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChefHat,
  CreditCard,
  Dumbbell,
  Headset,
  Home,
  MessageSquareHeart,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import { TrustBar } from "@/components/TrustBar";
import { LiveVisitors } from "@/components/LiveVisitors";
import { SocialProofBadge } from "@/components/SocialProofBadge";
import { SecurityBadge } from "@/components/SecurityBadge";
import { Testimonials } from "@/components/Testimonials";
import { AboutSection } from "@/components/AboutSection";
import { useLanguage } from "@/providers/LanguageProvider";
import { useDeliveryEstimate } from "@/lib/use-delivery-estimate";
import type { Category, Product } from "@/types";

const CATEGORY_ICONS: Record<string, ElementType> = {
  ChefHat,
  Smartphone,
  Home,
  Sparkles,
  Dumbbell,
};

interface HomePageClientProps {
  categories: Category[];
  featuredProducts: Product[];
}

export function HomePageClient({
  categories,
  featuredProducts,
}: HomePageClientProps) {
  const { t } = useLanguage();
  const deliveryEstimate = useDeliveryEstimate();
  const visibleCategories = categories.slice(0, 6);

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[var(--gradient-hero)]">
        {/* Mesh gradient blobs */}
        <div className="mesh-blob w-[600px] h-[600px] bg-[var(--accent)]/[0.04] top-[-200px] right-[-100px]" />
        <div className="mesh-blob w-[400px] h-[400px] bg-blue-400/[0.03] bottom-[-100px] left-[-80px]" style={{ animationDelay: "-7s" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-strong)]/15 bg-white/80 backdrop-blur-sm px-3.5 py-1.5 mb-6 shadow-[var(--shadow-soft)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-subtle-pulse" />
              <span className="text-xs font-semibold tracking-wide text-[var(--accent-strong)] uppercase">
                {t("hero.badge")}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.08]">
              <span className="text-[var(--foreground)]">{t("hero.title")}</span>
              {" "}
              <span className="text-gradient">{t("hero.titleAccent")}</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[var(--muted)] max-w-2xl leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 min-h-[24px]">
              <LiveVisitors variant="store" />
              <SecurityBadge />
            </div>
            <div className="mt-3 min-h-[32px]">
              <SocialProofBadge />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="#productos">
                <Button size="lg" className="gap-2 px-8 shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)]">
                  {t("hero.ctaPrimary")}
                  <ArrowRight className="w-4.5 h-4.5" />
                </Button>
              </Link>
              <Link href="/seguimiento">
                <Button variant="outline" size="lg">
                  {t("hero.ctaSecondary")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Trust pillars */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { Icon: Truck, text: t("hero.trust1") },
              { Icon: CreditCard, text: t("hero.trust2") },
              { Icon: ShieldCheck, text: t("hero.trust3") },
            ].map((item) => (
              <div
                key={item.text}
                className="glass-card rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="h-9 w-9 rounded-lg bg-[var(--accent-surface)] text-[var(--accent-strong)] flex items-center justify-center shrink-0">
                  <item.Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section divider */}
        <div className="section-divider" />
      </section>

      {/* ─── Categories ───────────────────────────────────────────────── */}
      <section id="categorias" className="py-14 sm:py-20 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="section-badge mb-3">
                {t("categories.badge")}
              </p>
              <h2 className="text-[var(--foreground)]">
                {t("categories.title")}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {visibleCategories.map((category) => {
              const Icon = CATEGORY_ICONS[category.icon || ""] || Sparkles;

              return (
                <div key={category.id}>
                  <Link
                    href={`/categoria/${category.slug}`}
                    className="group block rounded-[var(--card-radius)] border border-[var(--border)] bg-white p-4 sm:p-5 transition-all duration-300 h-full shadow-[var(--shadow-card)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--accent-strong)]/20"
                  >
                    <div className="h-10 w-10 rounded-xl bg-[var(--accent-surface)] text-[var(--accent-strong)] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                      {category.name}
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-[var(--muted)] line-clamp-2">
                      {category.description}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ─── Featured Products ────────────────────────────────────────── */}
      <section
        id="productos"
        className="py-14 sm:py-20 bg-[var(--gradient-section)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="section-badge mb-3">
                {t("featured.badge")}
              </p>
              <h2 className="text-[var(--foreground)]">
                {t("featured.title")}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {t("featured.subtitle")}
              </p>
            </div>
            <Link href="#categorias">
              <Button variant="outline" size="sm" className="gap-1.5">
                {t("featured.viewMore")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="rounded-[var(--card-radius)] border border-[var(--border)] bg-white px-5 py-4 text-sm text-[var(--foreground)] shadow-[var(--shadow-soft)]">
              {t("featured.emptyState")}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {featuredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  enableImageRotation
                  deliveryEstimate={deliveryEstimate}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Quality Note ─────────────────────────────────────────────── */}
      <section className="py-8 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[var(--card-radius)] border border-[var(--accent-strong)]/10 bg-[var(--accent-surface)] px-5 py-4 sm:px-6 sm:py-5 flex items-start gap-3">
            <BadgeCheck className="h-5 w-5 mt-0.5 text-[var(--accent-strong)] shrink-0" />
            <p className="text-sm sm:text-base text-[var(--foreground)]">
              {t("featured.qualityNote")}
            </p>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ─── Values / Trust Section ───────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-[var(--background)] relative overflow-hidden">
        <div className="mesh-blob w-[500px] h-[500px] bg-emerald-400/[0.02] top-[-150px] left-[-100px]" style={{ animationDelay: "-5s" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                Icon: ShieldCheck,
                title: t("values.secure.title"),
                text: t("values.secure.text"),
              },
              {
                Icon: Truck,
                title: t("values.coverage.title"),
                text: t("values.coverage.text"),
              },
              {
                Icon: Headset,
                title: t("values.support.title"),
                text: t("values.support.text"),
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-[var(--card-radius)] border border-[var(--border)] bg-white p-5 sm:p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1 hover:border-[var(--accent-strong)]/15 transition-all duration-300"
              >
                <div className="h-11 w-11 rounded-xl bg-[var(--accent-surface)] text-[var(--accent-strong)] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <item.Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-semibold text-[var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ───────────────────────────────────────────────── */}
      <section className="py-10 sm:py-12 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#052e1a] via-[#064025] to-[#0a3520] px-6 py-10 sm:px-12 sm:py-14 shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-hover)] transition-shadow duration-500">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[var(--accent)]/[0.08] blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-emerald-300/[0.06] blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
              <div className="text-center md:text-left flex-1">
                <h2 className="text-xl sm:text-3xl font-bold text-white mb-3">
                  {t("cta.noRisk.title")}
                </h2>
                <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed max-w-2xl">
                  {t("cta.noRisk.text")}
                </p>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <Link href="#productos" className="block w-full">
                  <Button size="lg" className="w-full bg-white text-[#052e1a] hover:bg-emerald-50 gap-2 border-0 shadow-[var(--shadow-elevated)] font-bold">
                    <ShieldCheck className="w-5 h-5" />
                    {t("cta.noRisk.button")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────── */}
      <Testimonials />

      {/* ─── About ────────────────────────────────────────────────────── */}
      <AboutSection />

      {/* ─── Feedback ─────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-16 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--gradient-section)] p-6 sm:p-8">
            <p className="section-badge mb-3">
              {t("feedback.badge")}
            </p>
            <h2 className="text-[var(--foreground)]">
              {t("feedback.title")}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[var(--muted)] max-w-2xl">
              {t("feedback.subtitle")}
            </p>
            <Link href="/soporte#feedback-form" className="inline-flex mt-6">
              <Button className="gap-2">
                {t("feedback.button")}
                <MessageSquareHeart className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ─── Trust Bar ────────────────────────────────────────────────── */}
      <section className="py-12 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBar />
        </div>
      </section>
    </>
  );
}
