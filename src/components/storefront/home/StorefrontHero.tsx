"use client";

import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Headphones,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";

interface StorefrontHeroProps {
  deliveryEstimate: { min: number; max: number } | null;
}

export function StorefrontHero({
  deliveryEstimate,
}: StorefrontHeroProps) {
  const { t } = useLanguage();
  const deliveryLine = deliveryEstimate
    ? `${deliveryEstimate.min}-${deliveryEstimate.max} días hábiles`
    : "3-7 días hábiles";

  return (
    <section
      data-home-slide=""
      data-density="hero"
      data-tone="mist"
      className="v-section"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-[8%] h-[28rem] w-[28rem] rounded-full bg-emerald-200/34 blur-[120px]" />
        <div className="absolute bottom-0 left-[-6rem] h-[24rem] w-[24rem] rounded-full bg-indigo-200/28 blur-[120px]" />
        <div className="absolute right-[24%] top-[42%] h-56 w-56 rounded-full bg-white/60 blur-[90px]" />
      </div>

      <div className="v-section-inner">
        <div className="v-section-grid" data-layout="hero">
          <div className="v-editorial-copy">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-emerald-700 shadow-[0_18px_44px_rgba(15,23,42,0.06)] backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Envío nacional y pago al recibir
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-[4.5rem]">
                Una home pensada como una{" "}
                <span className="bg-gradient-to-r from-emerald-700 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  presentación clara
                </span>{" "}
                y no como un muro de bloques.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Cada sección resume una idea: confianza, catálogo, beneficios y
                soporte. Ves una sola historia por pantalla y avanzas sin ruido.
              </p>
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
                  Pago: <strong>contra entrega</strong>
                </span>
              </div>
              <div className="v-chip">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>
                  Compra: <strong>protegida</strong>
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
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.24em] text-white/70">
                  Vista principal
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/58">
                    Vortixy storefront
                  </p>
                  <h2 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-[2.35rem]">
                    Confianza arriba. Catálogo al centro. Soporte al cierre.
                  </h2>
                  <p className="max-w-xl text-sm leading-7 text-white/76 sm:text-base">
                    El recorrido quedó ordenado como una secuencia de slides:
                    cada escena tiene un objetivo y un CTA claro.
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
                  <p className="v-metric-value">WhatsApp + ayuda real</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: Truck,
                    title: "Despacho nacional",
                    text: "Cobertura visible desde la primera pantalla.",
                  },
                  {
                    icon: Headphones,
                    title: "Atención directa",
                    text: "Sin esconder soporte detrás del checkout.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Compra protegida",
                    text: "Reglas, devoluciones y tiempos sin letra pequeña.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.4rem] border border-white/12 bg-white/[0.06] px-4 py-4"
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
