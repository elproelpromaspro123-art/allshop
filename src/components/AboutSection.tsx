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
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      Icon: MessageCircle,
      title: t("about.values.support.title"),
      text: t("about.values.support.text"),
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      Icon: Package,
      title: t("about.values.catalog.title"),
      text: t("about.values.catalog.text"),
      color: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <section className={cn("py-12 sm:py-16", className)}>
      <div className="v-section-inner">
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div className="rounded-2xl bg-gray-900 px-6 py-7 sm:px-8 sm:py-8">
            <div className="relative z-[1] v-editorial-copy">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 text-emerald-100/72">{t("about.badge")}</p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">{t("about.title")}</h2>
              <p className="max-w-xl text-base leading-8 text-white/74 sm:text-lg">
                {t("about.subtitle")}
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Operación", value: "Colombia" },
                  { label: "Pedidos", value: "Revisados y trazables" },
                  { label: "Soporte", value: "Respuesta humana" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 text-white/46">{item.label}</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/75">
                <Heart className="h-4 w-4 text-rose-300" />
                <span>{t("about.thanks")}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-6 sm:col-span-2 sm:px-6">
              <div className="relative z-[1] grid gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] sm:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Filosofía</p>
                  <p className="mt-2 text-xl font-bold tracking-tight sm:text-2xl text-gray-900">
                    Queremos que comprar aquí se sienta sencillo y confiable.
                  </p>
                </div>
                <p className="text-sm leading-7 text-gray-500">
                  Cuidamos la información, el soporte y el seguimiento para que
                  la experiencia se vea tan seria como el pedido final.
                </p>
              </div>
            </div>

            {values.map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-5 sm:px-6">
                <div className="relative z-[1]">
                  <div
                    className={cn(
                      "mb-4 flex h-11 w-11 items-center justify-center rounded-2xl",
                      item.color,
                    )}
                  >
                    <item.Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-gray-500">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-5 sm:px-6">
              <div className="relative z-[1]">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Intención</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  Mostrar productos útiles con información clara.
                </p>
                <p className="mt-2 text-sm leading-7 text-gray-500">
                  Preferimos explicar bien el producto, el pago y la entrega
                  antes que llenar la página con promesas vacías.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
