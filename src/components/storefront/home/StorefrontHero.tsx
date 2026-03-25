"use client";

import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Headphones,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";

interface StorefrontHeroProps {
  deliveryEstimate: { min: number; max: number } | null;
}

export function StorefrontHero({ deliveryEstimate }: StorefrontHeroProps) {
  const { t } = useLanguage();
  const deliveryLine = deliveryEstimate
    ? `${deliveryEstimate.min}-${deliveryEstimate.max} días hábiles`
    : "3-7 días hábiles";

  const promiseCards = [
    {
      icon: Truck,
      title: "Envío nacional visible",
      text: "Tiempos claros por destino antes de cerrar la compra.",
    },
    {
      icon: Headphones,
      title: "Soporte sin intermediarios",
      text: "WhatsApp real antes, durante y después del pedido.",
    },
    {
      icon: ShieldCheck,
      title: "Contraentrega sin fricción",
      text: "Sin tarjetas ni anticipos, con expectativas bien comunicadas.",
    },
  ];

  return (
    <section
      data-home-slide=""
      data-density="hero"
      data-tone="mist"
      className="v-section"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-[8%] h-[24rem] w-[24rem] rounded-full bg-emerald-200/30 blur-[120px]" />
        <div className="absolute bottom-0 left-[-6rem] h-[22rem] w-[22rem] rounded-full bg-violet-200/24 blur-[120px]" />
      </div>

      <div className="v-section-inner">
        <div className="v-section-grid" data-layout="hero">
          <div className="v-editorial-copy space-y-7">
            <div className="space-y-4">
              <div className="editorial-kicker">Editorial premium para ecommerce colombiano</div>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[4.8rem]">
                  Compra con criterio.
                  <span className="block bg-gradient-to-r from-emerald-700 via-emerald-500 to-sky-500 bg-clip-text text-transparent">
                    Paga al recibir.
                  </span>
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  Vortixy deja de verse como un storefront genérico y se mueve a
                  una experiencia más precisa: selección más fina, señales más
                  claras y menos ruido entre el producto y la conversión.
                </p>
              </div>
            </div>

            <div className="v-chip-row">
              <div className="v-chip">
                <Truck className="h-4 w-4 text-emerald-600" />
                <span>
                  Cobertura: <strong>toda Colombia</strong>
                </span>
              </div>
              <div className="v-chip">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span>
                  Pago: <strong>contraentrega</strong>
                </span>
              </div>
              <div className="v-chip">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>
                  Curaduría: <strong>menos catálogo, más intención</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full gap-2 px-8 sm:w-auto">
                <Link href="/#productos">
                  {t("hero.ctaPrimary")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full gap-2 px-8 sm:w-auto"
              >
                <Link href="/seguimiento">Rastrear mi pedido</Link>
              </Button>
            </div>
          </div>

          <div className="brand-stage h-full rounded-[2rem] p-6 sm:p-8">
            <div className="relative z-[1] grid h-full content-between gap-6">
              <div className="space-y-4">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.24em] text-white/72">
                  Vista principal
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/58">
                    Vortixy editorial shell
                  </p>
                  <h2 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-[2.45rem]">
                    Menos template. Más criterio de producto y compra.
                  </h2>
                  <p className="max-w-xl text-sm leading-7 text-white/74 sm:text-base">
                    El nuevo shell pone primero navegación clara, señales de confianza y
                    una lectura más elegante del catálogo sin caer en una estética SaaS.
                  </p>
                </div>
              </div>

              <div className="v-metric-grid hero-metric-grid">
                <div className="v-metric-card">
                  <p className="v-metric-label">Entrega</p>
                  <p className="v-metric-value">{deliveryLine}</p>
                </div>
                <div className="v-metric-card">
                  <p className="v-metric-label">Pago</p>
                  <p className="v-metric-value">Al recibir</p>
                </div>
                <div className="v-metric-card">
                  <p className="v-metric-label">Soporte</p>
                  <p className="v-metric-value">WhatsApp directo</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {promiseCards.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.45rem] border border-white/12 bg-white/[0.06] px-4 py-4"
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-white">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-white/68">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="v-section-divider" />
    </section>
  );
}
