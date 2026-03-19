"use client";

import { ShieldCheck, Truck, Headset } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

export function HomeValues() {
  const { t } = useLanguage();

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

  return (
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
  );
}
