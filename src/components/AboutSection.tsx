"use client";

import { Heart, MapPin, MessageCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import {
  MarketingBadgePill,
  MarketingSignalCard,
  MarketingSurface,
} from "@/components/marketing/MarketingPrimitives";

export function AboutSection({ className }: { className?: string }) {
  const { t } = useLanguage();

  const values = [
    {
      Icon: MapPin,
      title: t("about.values.origin.title"),
      text: t("about.values.origin.text"),
      tone: "sky" as const,
    },
    {
      Icon: MessageCircle,
      title: t("about.values.support.title"),
      text: t("about.values.support.text"),
      tone: "emerald" as const,
    },
    {
      Icon: Package,
      title: t("about.values.catalog.title"),
      text: t("about.values.catalog.text"),
      tone: "amber" as const,
    },
  ];

  return (
    <section className={cn("py-12 sm:py-16", className)}>
      <div className="v-section-inner">
        <MarketingSurface tone="slate" className="p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 px-6 py-7 text-white shadow-[0_24px_70px_rgba(2,6,23,0.18)] sm:px-8 sm:py-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_44%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.1),_transparent_38%)]" />
              <div className="relative z-[1] space-y-6">
                <div className="space-y-3">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-emerald-200/80">
                    {t("about.badge")}
                  </p>
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
                    {t("about.title")}
                  </h2>
                  <p className="max-w-xl text-base leading-8 text-white/74 sm:text-lg">
                    {t("about.subtitle")}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Operación", value: "Colombia" },
                    { label: "Pedidos", value: "Revisados y trazables" },
                    { label: "Soporte", value: "Respuesta humana" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 backdrop-blur"
                    >
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-200/72">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <MarketingBadgePill
                    label="Hecho por personas"
                    tone="emerald"
                    className="border-white/10 bg-white/[0.07]"
                    labelClassName="text-white"
                    sublabelClassName="text-white/60"
                  />
                  <MarketingBadgePill
                    label="Soporte directo"
                    tone="sky"
                    className="border-white/10 bg-white/[0.07]"
                    labelClassName="text-white"
                    sublabelClassName="text-white/60"
                  />
                  <MarketingBadgePill
                    label="Catálogo curado"
                    tone="violet"
                    className="border-white/10 bg-white/[0.07]"
                    labelClassName="text-white"
                    sublabelClassName="text-white/60"
                  />
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/75">
                  <Heart className="h-4 w-4 text-rose-300" />
                  <span>{t("about.thanks")}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.55rem] border border-slate-200/80 bg-white/92 px-5 py-6 shadow-[0_16px_42px_rgba(15,23,42,0.06)] sm:col-span-2 sm:px-6">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] sm:items-end">
                  <div>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-emerald-700">
                      Filosofía
                    </p>
                    <p className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-950 sm:text-2xl">
                      Queremos que comprar aquí se sienta sencillo y confiable.
                    </p>
                  </div>
                  <p className="text-sm leading-7 text-slate-600">
                    Cuidamos la información, el soporte y el seguimiento para
                    que la experiencia se vea tan seria como el pedido final.
                  </p>
                </div>
              </div>

              {values.map((item) => (
                <MarketingSignalCard
                  key={item.title}
                  icon={item.Icon}
                  title={item.title}
                  description={item.text}
                  tone={item.tone}
                  className="min-h-[8.25rem]"
                />
              ))}

              <div className="rounded-[1.55rem] border border-slate-200/80 bg-white/92 px-5 py-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)] sm:px-6">
                <div className="space-y-3">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-emerald-700">
                    Intención
                  </p>
                  <p className="text-lg font-black tracking-[-0.03em] text-slate-950">
                    Mostrar productos útiles con información clara.
                  </p>
                  <p className="text-sm leading-7 text-slate-600">
                    Preferimos explicar bien el producto, el pago y la entrega
                    antes que llenar la página con promesas vacías.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </MarketingSurface>
      </div>
    </section>
  );
}
