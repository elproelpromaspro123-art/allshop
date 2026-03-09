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
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--background)]">
        <div className="absolute -top-44 -left-28 h-[360px] w-[360px] rounded-full bg-[var(--accent)]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-44 -right-28 h-[360px] w-[360px] rounded-full bg-[var(--accent-strong)]/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl animate-fade-in-up">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)] mb-4">
              <span className="w-5 h-[2px] rounded-full bg-current" />
              Tienda oficial Vortixy
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--foreground)] leading-[1.08]">
              Compra online en Colombia con contra entrega y envío nacional.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[var(--muted)] max-w-2xl">
              Seleccionamos productos prácticos para el día a día, con
              verificación de pedido por correo y soporte directo.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="#productos">
                <Button size="lg" className="gap-2">
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
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5 flex items-center gap-3 animate-fade-in-up"
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
                <div key={category.id} className="animate-fade-in-up">
                  <Link
                    href={`/categoria/${category.slug}`}
                    className={cn(
                      "group block rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 transition-all h-full",
                      "hover:-translate-y-0.5 hover:shadow-[0_12px_34px_-18px_rgba(16,24,40,0.35)]"
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
                className="rounded-2xl border border-[var(--border)] bg-white p-5 animate-fade-in-up"
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
