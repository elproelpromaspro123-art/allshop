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
import { StatsBar } from "@/components/StatsBar";
import { GuaranteeSeal } from "@/components/GuaranteeSeal";
import { useLanguage } from "@/providers/LanguageProvider";
import { useDeliveryEstimate } from "@/lib/use-delivery-estimate";
import { ScrollRevealInit } from "@/hooks/use-scroll-reveal-global";
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

  const valueItems = [
    {
      Icon: ShieldCheck,
      title: t("values.secure.title"),
      text: t("values.secure.text"),
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      Icon: Truck,
      title: t("values.coverage.title"),
      text: t("values.coverage.text"),
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      Icon: Headset,
      title: t("values.support.title"),
      text: t("values.support.text"),
      color: "bg-amber-50 text-amber-600",
    },
  ];

  const trustPillars = [
    { Icon: Truck, text: t("hero.trust1"), bg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { Icon: CreditCard, text: t("hero.trust2"), bg: "bg-indigo-50", iconColor: "text-indigo-600" },
    { Icon: ShieldCheck, text: t("hero.trust3"), bg: "bg-amber-50", iconColor: "text-amber-600" },
  ];

  return (
    <>
      <ScrollRevealInit />
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden scroll-reveal-up" style={{ background: "var(--gradient-hero)" }}>
        {/* Dot pattern background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(10,15,30,0.04) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,130,0.07)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-white px-4 py-2 mb-8 shadow-[var(--shadow-layer-1)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-[subtle-pulse_2s_ease-in-out_infinite]" />
              <span className="text-xs font-semibold tracking-wide text-[var(--accent-strong)] uppercase">
                {t("hero.badge")}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-extrabold tracking-tight leading-[1.04]">
              <span className="text-gradient-subtle">{t("hero.title")}</span>
              {" "}
              <span className="text-gradient">{t("hero.titleAccent")}</span>
            </h1>

            <p className="mt-7 text-base sm:text-lg text-[var(--muted)] max-w-xl leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="mt-6">
              <GuaranteeSeal variant="inline" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 min-h-[24px]">
              <LiveVisitors variant="store" />
              <SecurityBadge />
            </div>
            <div className="mt-2 min-h-[32px]">
              <SocialProofBadge />
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="#productos">
                <Button size="lg" className="gap-2 px-8 shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)]">
                  {t("hero.ctaPrimary")}
                  <ArrowRight className="w-4.5 h-4.5" />
                </Button>
              </Link>
              <Link href="#categorias">
                <Button variant="outline" size="lg">
                  {t("hero.ctaSecondary")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Trust pillars */}
          <div className="mt-16 flex flex-col sm:flex-row items-stretch divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)] rounded-2xl border border-[var(--border)] bg-white/80 backdrop-blur-xl shadow-[var(--shadow-layer-1)]">
            {trustPillars.map((item) => (
              <div
                key={item.text}
                className="flex-1 flex items-center gap-3.5 px-5 sm:px-6 py-4"
              >
                <div className={`shrink-0 w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.Icon className={`h-[18px] w-[18px] ${item.iconColor}`} />
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="mt-6">
            <StatsBar />
          </div>
        </div>

        <div className="section-divider" />
      </section>

      {/* ─── Categories ───────────────────────────────────────────────── */}
      <section id="categorias" className="py-16 sm:py-24 bg-[var(--background)] scroll-reveal-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <p className="section-badge mb-4">
                {t("categories.badge")}
              </p>
              <h2 className="text-[var(--foreground)]">
                <span className="text-gradient-subtle">{t("categories.title")}</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-fr">
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
                        ? "bento-card bento-card-accent p-6 sm:p-8 flex flex-col justify-between"
                        : "rounded-[var(--card-radius)] border border-[var(--border)] bg-white p-4 sm:p-5 shadow-[var(--shadow-card)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--accent)]/20"
                    }`}
                  >
                    <div className={`rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                      isFeature
                        ? "h-14 w-14 bg-indigo-50 text-indigo-600"
                        : "h-10 w-10 bg-indigo-50 text-indigo-600"
                    }`}>
                      <Icon className={isFeature ? "h-7 w-7" : "h-5 w-5"} />
                    </div>
                    <div className={isFeature ? "mt-auto pt-6" : ""}>
                      <p className={`font-semibold text-[var(--foreground)] ${
                        isFeature ? "text-lg sm:text-xl mt-0" : "mt-3 text-sm sm:text-base"
                      }`}>
                        {category.name}
                      </p>
                      <p className={`text-[var(--muted)] ${
                        isFeature ? "mt-2 text-sm leading-relaxed" : "mt-1 text-xs sm:text-sm line-clamp-2"
                      }`}>
                        {category.description}
                      </p>
                      {isFeature && (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-strong)] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Ver productos <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
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
        className="py-16 sm:py-24 bg-[var(--gradient-section)] scroll-reveal-up"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="section-badge mb-4">
                {t("featured.badge")}
              </p>
              <h2 className="text-[var(--foreground)]">
                <span className="text-gradient-subtle">{t("featured.title")}</span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[var(--muted)] max-w-lg leading-relaxed">
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
      <section className="py-10 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-[var(--accent-surface)] to-transparent border border-[var(--accent)]/10 px-6 py-5 sm:px-8 sm:py-6 flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm sm:text-base text-[var(--foreground)] leading-relaxed">
              {t("featured.qualityNote")}
            </p>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ─── Values / Trust Section (Bento Grid) ──────────────────────── */}
      <section className="py-16 sm:py-24 bg-[var(--background)] relative overflow-hidden scroll-reveal-up">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Guarantee seal before values */}
          <div className="mb-8">
            <GuaranteeSeal variant="card" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {valueItems.map((item, index) => {
              const isHero = index === 0;

              return (
                <div
                  key={item.title}
                  className={`bento-card group scroll-reveal ${
                    isHero ? "sm:col-span-2 lg:col-span-1 bento-card-accent" : ""
                  }`}
                  data-delay={index + 1}
                >
                  <div className={isHero ? "p-7 sm:p-8" : "p-5 sm:p-6"}>
                    <div className={`rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                      isHero
                        ? `h-14 w-14 ${item.color}`
                        : `h-11 w-11 ${item.color}`
                    }`}>
                      <item.Icon className={isHero ? "h-6 w-6" : "h-5 w-5"} />
                    </div>
                    <p className={`font-semibold text-[var(--foreground)] ${
                      isHero ? "mt-5 text-lg" : "mt-4 text-base"
                    }`}>
                      {item.title}
                    </p>
                    <p className={`text-[var(--muted)] leading-relaxed ${
                      isHero ? "mt-2.5 text-sm sm:text-base" : "mt-1.5 text-sm"
                    }`}>
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ───────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#041f14] via-[#053723] to-[#07291a] px-6 py-12 sm:px-12 sm:py-16 shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-hover)] transition-shadow duration-500"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 20px), linear-gradient(135deg, #041f14 0%, #053723 50%, #07291a 100%)`,
            }}
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(0,212,130,0.12)_0%,transparent_70%)] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-[radial-gradient(circle,rgba(0,168,104,0.08)_0%,transparent_70%)] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
              <div className="text-center md:text-left flex-1">
                <h2 className="text-xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
                  {t("cta.noRisk.title")}
                </h2>
                <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed max-w-xl">
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
      <section className="py-16 sm:py-24 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[var(--section-radius)] bg-gradient-to-br from-[var(--secondary-surface)]/40 to-white border border-[var(--border-subtle)] p-7 sm:p-10">
            <div className="absolute top-4 right-4 opacity-[0.04] pointer-events-none">
              <MessageSquareHeart className="w-32 h-32" />
            </div>
            <p className="section-badge mb-4">
              {t("feedback.badge")}
            </p>
            <h2 className="text-[var(--foreground)]">
              <span className="text-gradient-subtle">{t("feedback.title")}</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[var(--muted)] max-w-xl leading-relaxed">
              {t("feedback.subtitle")}
            </p>
            <Link href="/soporte#feedback-form" className="inline-flex mt-8">
              <Button className="gap-2">
                {t("feedback.button")}
                <MessageSquareHeart className="h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-3 text-xs text-[var(--muted-soft)]">
              Respuesta promedio en menos de 2 horas
            </p>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ─── Trust Bar ────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBar />
        </div>
      </section>
    </>
  );
}
