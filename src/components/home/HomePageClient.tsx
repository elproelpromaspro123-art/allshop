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
  const deliveryWindow = deliveryEstimate
    ? `${deliveryEstimate.min}-${deliveryEstimate.max} dias habiles`
    : "3-7 dias habiles";

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
    {
      Icon: Truck,
      text: t("hero.trust1"),
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      Icon: CreditCard,
      text: t("hero.trust2"),
      bg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      Icon: ShieldCheck,
      text: t("hero.trust3"),
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  const heroSignals = [
    "Pago claro y contraentrega",
    `Entrega estimada ${deliveryWindow}`,
    "Soporte humano por WhatsApp",
  ];

  const heroOverview = [
    {
      label: "Pago",
      value: "Contraentrega",
    },
    {
      label: "Entrega",
      value: deliveryWindow,
    },
    {
      label: "Soporte",
      value: "WhatsApp y correo",
    },
  ];

  const stageHighlights = [
    {
      Icon: CreditCard,
      title: "Compra sin anticipos",
      text: "La decision final ocurre cuando recibes el pedido.",
      color: "bg-emerald-400/12 text-emerald-300",
    },
    {
      Icon: Truck,
      title: "Operacion nacional",
      text: "Despachos dentro de Colombia con seguimiento del proceso.",
      color: "bg-white/10 text-white",
    },
    {
      Icon: ShieldCheck,
      title: "Verificacion interna",
      text: "Cada orden se confirma antes de salir a despacho.",
      color: "bg-amber-400/12 text-amber-300",
    },
    {
      Icon: Headset,
      title: "Canal directo",
      text: "Atencion por correo y WhatsApp para resolver dudas reales.",
      color: "bg-indigo-400/12 text-indigo-200",
    },
  ];

  const purchaseFlow = [
    {
      step: "01",
      title: "Exploras y eliges",
      text: "Catalogo corto, visual y sin ruido innecesario.",
    },
    {
      step: "02",
      title: "Confirmamos el pedido",
      text: "Validamos informacion y dejamos trazabilidad del proceso.",
    },
    {
      step: "03",
      title: "Recibes y pagas",
      text: "La compra se cierra cuando el producto llega a tus manos.",
    },
  ];

  return (
    <>
      <ScrollRevealInit />

      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,130,0.12),transparent_32%)]" />
        <div className="pointer-events-none absolute left-[-10%] top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.09),transparent_70%)] blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-10 sm:px-6 sm:pt-24 sm:pb-12 lg:px-8 lg:pt-28 lg:pb-14">
          <div className="grid items-center gap-8 lg:min-h-[36rem] lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 2xl:min-h-[40rem]">
            <div className="max-w-3xl">
              <p className="section-badge mb-7">{t("hero.badge")}</p>

              <h1 className="display-title font-extrabold text-[var(--foreground)]">
                {t("hero.title")}{" "}
                <span className="font-display italic text-[var(--accent-strong)]">
                  {t("hero.titleAccent")}
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
                {t("hero.subtitle")}
              </p>

              <div className="mt-8 flex flex-wrap gap-2.5">
                {heroSignals.map((signal) => (
                  <span
                    key={signal}
                    className="inline-flex items-center rounded-full border border-black/6 bg-white/82 px-3.5 py-2 text-xs font-semibold text-[var(--muted-strong)] shadow-[0_10px_24px_rgba(10,15,30,0.05)] backdrop-blur-xl"
                  >
                    {signal}
                  </span>
                ))}
              </div>

              <div className="mt-7">
                <GuaranteeSeal variant="inline" />
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link href="#productos">
                  <Button size="lg" className="gap-2 px-8">
                    {t("hero.ctaPrimary")}
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </Button>
                </Link>
                <Link href="#categorias">
                  <Button variant="outline" size="lg">
                    {t("hero.ctaSecondary")}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="surface-panel-dark surface-ambient brand-v-slash px-5 py-5 sm:px-6 sm:py-6">
              <div className="relative z-[1]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-lg">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                      Operacion Vortixy
                    </p>
                    <h2 className="mt-3 text-[1.75rem] font-semibold leading-[1.02] tracking-tight text-white sm:text-[2rem]">
                      Contraentrega, entrega clara y soporte directo en un solo vistazo.
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-white/66 sm:text-base">
                      La primera pantalla muestra lo esencial. El resto del proceso se despliega por bloques, con aire y lectura mas limpia.
                    </p>
                  </div>
                  <span className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/[0.06] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                    Colombia
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {heroOverview.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3.5"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-white sm:text-base">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[22px] border border-emerald-400/16 bg-emerald-400/10 px-4 py-4 text-sm leading-relaxed text-emerald-100/84">
                  El flujo detallado, la cobertura y el soporte quedan justo debajo para mantener esta primera vista enfocada.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--background)] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:gap-6 lg:grid-cols-2 lg:items-stretch">
            <div className="flex flex-col gap-4">
              <div className="surface-panel flex-1 px-5 py-5 sm:px-6 sm:py-6">
                <div className="relative z-[1]">
                  <p className="section-badge mb-4">Confianza visible</p>
                  <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-[2rem]">
                    Cada seccion tiene su propio espacio.
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                    Pago, cobertura y acompanamiento salen del hero para que la primera vista respire sin perder contexto.
                  </p>

                  <div className="mt-6 grid gap-3">
                    {trustPillars.map((item) => (
                      <div
                        key={item.text}
                        className="rounded-[20px] border border-[var(--border-subtle)] bg-white/72 px-4 py-4"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.bg}`}
                          >
                            <item.Icon className={`h-[18px] w-[18px] ${item.iconColor}`} />
                          </div>
                          <p className="text-sm font-medium leading-relaxed text-[var(--foreground)]">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex min-h-[24px] flex-wrap items-center gap-3">
                    <LiveVisitors variant="store" />
                  </div>
                </div>
              </div>

              <StatsBar deliveryEstimate={deliveryEstimate} />
            </div>

            <div className="surface-panel-dark surface-ambient brand-v-slash px-6 py-7 sm:px-7 sm:py-8">
              <div className="relative z-[1]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                      Flujo de compra
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[2rem]">
                      Sin pasos opacos ni promesas infladas.
                    </h2>
                  </div>
                  <span className="text-xs font-medium text-emerald-200/80">
                    Pago final al recibir
                  </span>
                </div>

                <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {stageHighlights.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4"
                    >
                      <div
                        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${item.color}`}
                      >
                        <item.Icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/65">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-3">
                  {purchaseFlow.map((item) => (
                    <div
                      key={item.step}
                      className="flex items-start gap-3 rounded-[20px] border border-white/8 bg-black/10 px-3.5 py-3"
                    >
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
                        {item.step}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-white/62">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section id="productos" className="py-16 sm:py-24 bg-[var(--gradient-section)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 grid gap-4 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div>
              <p className="section-badge mb-4">{t("featured.badge")}</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                {t("featured.title")}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                {t("featured.subtitle")}
              </p>
            </div>

            <div className="surface-panel px-5 py-5 sm:px-6">
              <div className="relative z-[1] flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-faint)]">
                    Curaduria
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)] sm:text-base">
                    {t("featured.qualityNote")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="surface-panel px-5 py-4 text-sm text-[var(--foreground)]">
              <div className="relative z-[1]">{t("featured.emptyState")}</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {featuredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  deliveryEstimate={deliveryEstimate}
                />
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-start">
            <Link href="#categorias">
              <Button variant="outline" size="sm" className="gap-1.5">
                {t("featured.viewMore")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-[var(--background)] relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-badge mb-4">Base operativa</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                La experiencia visual esta respaldada por procesos visibles.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              La confianza no depende solo del look. Tambien depende de como se
              comunica el soporte, la cobertura y la proteccion del pedido.
            </p>
          </div>

          <div className="mb-8">
            <GuaranteeSeal variant="card" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {valueItems.map((item, index) => {
              const isHero = index === 0;

              return (
                <div
                  key={item.title}
                  className={`scroll-reveal ${isHero ? "sm:col-span-2 lg:col-span-1" : ""}`}
                  data-delay={index + 1}
                >
                  <div
                    className={`h-full ${
                      isHero
                        ? "surface-panel-dark surface-ambient brand-v-slash px-6 py-6 text-white"
                        : "surface-panel px-5 py-5 sm:px-6"
                    }`}
                  >
                    <div className="relative z-[1]">
                      <div
                        className={`flex items-center justify-center rounded-2xl ${
                          isHero
                            ? "h-14 w-14 bg-white/10 text-emerald-300"
                            : `h-11 w-11 ${item.color}`
                        }`}
                      >
                        <item.Icon className={isHero ? "h-6 w-6" : "h-5 w-5"} />
                      </div>
                      <p
                        className={`mt-5 font-semibold ${
                          isHero
                            ? "text-lg text-white"
                            : "text-base text-[var(--foreground)]"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p
                        className={`mt-2.5 leading-relaxed ${
                          isHero
                            ? "text-sm text-white/68 sm:text-base"
                            : "text-sm text-[var(--muted)]"
                        }`}
                      >
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[var(--background)] py-7 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#041f14] via-[#053723] to-[#07291a] px-5 py-5 shadow-[var(--shadow-cta)] transition-shadow duration-500 hover:shadow-[var(--shadow-cta-hover)] surface-ambient brand-v-slash sm:px-8 sm:py-6 lg:px-10 lg:py-7">
            <div className="absolute -right-10 top-[-1.5rem] h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(0,212,130,0.12)_0%,transparent_72%)] pointer-events-none sm:h-44 sm:w-44" />
            <div className="absolute -left-8 bottom-[-2rem] h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(0,168,104,0.08)_0%,transparent_72%)] pointer-events-none sm:h-36 sm:w-36" />

            <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/76">
                    Contraentrega
                  </span>
                  <span className="inline-flex items-center rounded-full border border-emerald-300/16 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100/80">
                    Sin anticipos
                  </span>
                </div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                  Sin riesgo innecesario
                </p>
                <h2 className="mt-3 max-w-xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {t("cta.noRisk.title")}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-100/80 sm:text-base">
                  {t("cta.noRisk.text")}
                </p>
              </div>

              <div className="w-full shrink-0 lg:w-auto lg:justify-self-end">
                <Link href="#productos" className="block w-full">
                  <Button
                    size="lg"
                    className="w-full gap-2 border-0 bg-white text-[#052e1a] shadow-[var(--shadow-elevated)] hover:bg-emerald-50 lg:w-auto"
                  >
                    <ShieldCheck className="h-5 w-5" />
                    {t("cta.noRisk.button")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      <AboutSection />

      <section className="py-16 sm:py-24 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="surface-panel px-6 py-6 sm:px-8 sm:py-8">
              <div className="relative z-[1]">
                <p className="section-badge mb-4">{t("feedback.badge")}</p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                  {t("feedback.title")}
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  {t("feedback.subtitle")}
                </p>
                <Link href="/soporte#feedback-form" className="mt-8 inline-flex">
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

            <div className="surface-panel-dark surface-ambient brand-v-slash px-6 py-6 sm:px-8 sm:py-8">
              <div className="relative z-[1]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                  Soporte con contexto
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  Preguntas reales, respuestas claras.
                </h3>
                <div className="mt-6 space-y-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4">
                    <p className="text-sm font-semibold text-white">
                      Dudas antes de comprar
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-white/65">
                      Te ayudamos a validar producto, tiempos y proceso de compra.
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4">
                    <p className="text-sm font-semibold text-white">
                      Seguimiento del pedido
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-white/65">
                      Si ya compraste, acompanamos el estado de la orden y su entrega.
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4">
                    <p className="text-sm font-semibold text-white">
                      Feedback util
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-white/65">
                      Usamos los comentarios para ajustar comunicacion, procesos y catalogo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBar />
        </div>
      </section>
    </>
  );
}
