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
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
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
  const visibleCategories = categories.slice(0, 6);

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-emerald-50/50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[var(--accent-strong)]/[0.03] blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)] mb-4">
              <span className="w-5 h-[2px] rounded-full bg-current" />
              Tienda oficial Vortixy
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--foreground)] leading-[1.08]">
              Compra online en Colombia con contra entrega y envío nacional.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[var(--muted)] max-w-2xl">
              Seleccionamos productos prácticos para el día a día, con
              confirmación directa de pedido y soporte directo.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <LiveVisitors variant="store" />
              <SecurityBadge />
            </div>
            <div className="mt-4">
              <SocialProofBadge />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href="#productos">
                <Button size="lg" className="gap-2 shadow-[0_4px_20px_-4px_rgba(0,140,85,0.5)] hover:shadow-[0_8px_30px_-4px_rgba(0,140,85,0.6)]">
                  {t("hero.ctaPrimary")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/seguimiento">
                <Button variant="outline" size="lg">
                  {t("hero.ctaSecondary")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { Icon: Truck, text: "Envío nacional con trazabilidad" },
              { Icon: CreditCard, text: "Pago contra entrega" },
              { Icon: ShieldCheck, text: "Compra protegida y verificada" },
            ].map((item) => (
              <div
                key={item.text}
                className="rounded-2xl border border-[var(--border)] bg-white/90 backdrop-blur-sm px-4 py-3.5 flex items-center gap-3 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="h-9 w-9 rounded-xl bg-[var(--accent-strong)]/10 text-[var(--accent-strong)] flex items-center justify-center shrink-0">
                  <item.Icon className="h-4.5 w-4.5" />
                </div>
                <p className="text-sm font-medium text-neutral-700">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="categorias" className="py-12 sm:py-16 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)] mb-3">
                <span className="w-5 h-[2px] rounded-full bg-current" />
                Categorías
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                Descubre por interés
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
                    className={cn(
                      "group block rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 transition-all duration-300 h-full shadow-[var(--shadow-soft)]",
                      "hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--accent-strong)]/15"
                    )}
                  >
                    <div className="h-10 w-10 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--accent-strong)] flex items-center justify-center">
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

      <section
        id="productos"
        className="py-12 sm:py-16 bg-[var(--surface)] border-y border-[var(--border)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)] mb-3">
                <span className="w-5 h-[2px] rounded-full bg-current" />
                Destacados
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                Productos seleccionados
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Catálogo curado para rotación rápida y entrega nacional.
              </p>
            </div>
            <Link href="#categorias">
              <Button variant="outline" size="sm" className="gap-1.5">
                Ver más categorías
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white px-5 py-4 text-sm text-neutral-600">
              Estamos actualizando el catálogo. Vuelve en unos minutos.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {featuredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  enableImageRotation
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-10 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[var(--border)] bg-white px-5 py-4 sm:px-6 sm:py-5 flex items-start gap-3">
            <BadgeCheck className="h-5 w-5 mt-0.5 text-[var(--accent-strong)] shrink-0" />
            <p className="text-sm sm:text-base text-neutral-700">
              Tenemos pocos productos porque priorizamos la calidad antes que la
              cantidad.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-14 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                Icon: ShieldCheck,
                title: "Compra segura",
                text: "Validación de pedido y seguimiento interno de cada orden.",
              },
              {
                Icon: Truck,
                title: "Cobertura nacional",
                text: "Operación enfocada en entregas dentro de Colombia.",
              },
              {
                Icon: Headset,
                title: "Atención activa",
                text: "Soporte por correo y canal directo para resolver incidencias.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1 hover:border-[var(--accent-strong)]/15 transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-xl bg-[var(--accent-strong)]/10 text-[var(--accent-strong)] flex items-center justify-center">
                  <item.Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-base font-semibold text-[var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-1.5 text-sm text-[var(--muted)]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#06301A] px-5 py-8 sm:px-10 sm:py-12 shadow-[0_12px_40px_-12px_rgba(0,140,85,0.4)]">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[var(--accent)]/10 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
              <div className="text-center md:text-left flex-1">
                <h2 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
                  Compra sin riesgo
                </h2>
                <p className="text-emerald-100/90 text-sm leading-relaxed max-w-2xl">
                  Garantía por defectos de fábrica y asistencia siempre disponible. <strong className="text-white font-semibold">Pagas solo cuando el producto llegue a tus manos.</strong>
                </p>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <Link href="#productos" className="block w-full">
                  <Button size="lg" className="w-full bg-[var(--accent)] text-[#071a0a] hover:bg-[#0fd682] gap-2 border-0 shadow-[0_4px_16px_rgba(0,169,104,0.3)]">
                    <ShieldCheck className="w-5 h-5" />
                    Ver catálogo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      <AboutSection />

      <section className="py-12 sm:py-14 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)] mb-3">
              <span className="w-5 h-[2px] rounded-full bg-current" />
              Feedback visible
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
              ¿Viste algo por mejorar?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[var(--muted)] max-w-2xl">
              Deja tu reporte o sugerencia en el formulario de soporte.
            </p>
            <Link href="/soporte#feedback-form" className="inline-flex mt-5">
              <Button className="gap-2">
                Abrir formulario de feedback
                <MessageSquareHeart className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 border-t border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBar />
        </div>
      </section>
    </>
  );
}
