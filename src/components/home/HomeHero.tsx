"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GuaranteeSeal } from "@/components/GuaranteeSeal";
import { useLanguage } from "@/providers/LanguageProvider";
import { useDeliveryEstimate } from "@/lib/use-delivery-estimate";

export function HomeHero() {
  const { t } = useLanguage();
  const deliveryEstimate = useDeliveryEstimate();
  const deliveryWindow = deliveryEstimate
    ? `${deliveryEstimate.min}-${deliveryEstimate.max} dias habiles`
    : "3-7 dias habiles";

  const heroSignals = [
    "Pago claro y contraentrega",
    `Entrega estimada ${deliveryWindow}`,
    "Soporte humano por WhatsApp",
  ];

  const heroOverview = [
    { label: "Pago", value: "Contraentrega" },
    { label: "Entrega", value: deliveryWindow },
    { label: "Soporte", value: "WhatsApp y correo" },
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
      Icon: ShieldCheck,
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

            <div className="mt-10">
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
                    <p className="text-sm font-semibold text-white">
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
  );
}
