"use client";

import { Heart, MapPin, MessageCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

export function AboutSection({ className }: { className?: string }) {
  const { t } = useLanguage();

  const values = [
    {
      Icon: MapPin,
      title: t("about.values.origin.title"),
      text: t("about.values.origin.text"),
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      Icon: MessageCircle,
      title: t("about.values.support.title"),
      text: t("about.values.support.text"),
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      Icon: Package,
      title: t("about.values.catalog.title"),
      text: t("about.values.catalog.text"),
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <section
      className={cn("py-16 sm:py-24 bg-[var(--gradient-section)]", className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div className="surface-panel-dark surface-ambient brand-v-slash px-6 py-7 sm:px-8 sm:py-8">
            <div className="relative z-[1]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                {t("about.badge")}
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-[2.6rem]">
                {t("about.title")}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/72 sm:text-base">
                {t("about.subtitle")}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    Operacion
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    Colombia
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    Pedidos
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    Curados y trazables
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    Soporte
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    Respuesta humana
                  </p>
                </div>
              </div>

              <div className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/75">
                <Heart className="h-4 w-4 text-rose-300" />
                <span>{t("about.thanks")}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-panel px-5 py-6 sm:col-span-2 sm:px-6">
              <div className="relative z-[1] flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-faint)]">
                    Filosofia
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--foreground)]">
                    Una tienda que se siente cercana, clara y seria.
                  </p>
                </div>
                <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                  Queremos que la compra inspire confianza antes, durante y
                  despues del pedido. Por eso el tono, el soporte y la operacion
                  tienen que sentirse reales.
                </p>
              </div>
            </div>

            {values.map((item) => (
              <div key={item.title} className="surface-panel px-5 py-5 sm:px-6">
                <div className="relative z-[1]">
                  <div
                    className={cn(
                      "mb-4 flex h-11 w-11 items-center justify-center rounded-2xl",
                      item.color,
                    )}
                  >
                    <item.Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}

            <div className="surface-panel px-5 py-5 sm:px-6">
              <div className="relative z-[1]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-faint)]">
                  Intencion
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                  Menos ruido, mas claridad.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  Seleccionamos productos y presentamos la compra de forma
                  sencilla para que la experiencia se vea tan confiable como el
                  pedido final.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
