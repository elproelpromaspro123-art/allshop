"use client";

import Link from "next/link";
import { MessageSquareHeart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";

export function HomeSupport() {
  const { t } = useLanguage();

  return (
    <section className="v-section" data-tone="base">
      <div className="v-section-inner">
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="surface-panel px-6 py-6 sm:px-8 sm:py-8">
            <div className="relative z-[1] v-editorial-copy">
              <p className="section-badge">{t("feedback.badge")}</p>
              <h2 className="text-headline text-[var(--foreground)]">
                {t("feedback.title")}
              </h2>
              <p className="text-base leading-8 text-[var(--muted)]">
                {t("feedback.subtitle")}
              </p>
              <p className="text-sm leading-7 text-[var(--muted)]">
                El feedback deja de ser un accesorio cuando tiene un lugar claro
                dentro del producto. Por eso este bloque existe y no queda
                escondido al final del soporte.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/soporte#feedback-form" className="inline-flex">
                  <Button className="gap-2">
                    {t("feedback.button")}
                    <MessageSquareHeart className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Respuesta promedio en menos de 2 horas
                </div>
              </div>
            </div>
          </div>

          <div className="surface-panel-dark surface-ambient brand-v-slash px-6 py-6 sm:px-8 sm:py-8">
            <div className="relative z-[1]">
              <p className="v-kicker text-emerald-100/72">Soporte con contexto</p>
              <h3 className="mt-3 text-title-lg text-white">
                Preguntas reales, respuestas claras y un flujo visual sin ruido.
              </h3>
              <div className="mt-6 grid gap-3">
                {[
                  {
                    title: "Dudas antes de comprar",
                    body: "Te ayudamos a validar producto, tiempos y proceso de compra.",
                  },
                  {
                    title: "Seguimiento del pedido",
                    body: "Si ya compraste, acompañamos el estado de la orden y su entrega.",
                  },
                  {
                    title: "Feedback útil",
                    body: "Usamos los comentarios para ajustar comunicación, procesos y catálogo.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1.5 text-sm leading-7 text-white/68">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="v-section-divider" />
      </div>
    </section>
  );
}
