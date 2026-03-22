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
                ¿Necesitas ayuda o quieres dejarnos una sugerencia?
              </h2>
              <p className="text-base leading-8 text-[var(--muted)]">
                Si viste algo por mejorar o tienes una duda, puedes escribirnos
                desde soporte.
              </p>
              <p className="text-sm leading-7 text-[var(--muted)]">
                Revisamos cada mensaje para ajustar la tienda, el catálogo y la
                atención cuando hace falta.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/soporte#feedback-form" passHref legacyBehavior>
                  <Button asChild className="gap-2">
                    <a>
                      {t("feedback.button")}
                      <MessageSquareHeart className="h-4 w-4" />
                    </a>
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
              <p className="v-kicker text-white/95">Soporte directo</p>
              <h3 className="mt-3 text-title-lg text-white">
                Te ayudamos antes y después de comprar.
              </h3>
              <div className="mt-6 grid gap-3">
                {[
                  {
                    title: "Dudas antes de comprar",
                    body: "Te orientamos sobre producto, tiempos y proceso de compra.",
                  },
                  {
                    title: "Seguimiento del pedido",
                    body: "Si ya compraste, te ayudamos a revisar el estado y la entrega.",
                  },
                  {
                    title: "Mejoras de la tienda",
                    body: "Tomamos en cuenta tus comentarios para seguir puliendo la experiencia.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1.5 text-sm leading-7 text-white/76">
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
