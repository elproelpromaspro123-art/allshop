"use client";

import Link from "next/link";
import { ArrowRight, MessageSquareHeart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";

export function HomeSupport() {
  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-24 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="surface-panel px-6 py-6 sm:px-8 sm:py-8">
            <div className="relative z-[1]">
              <p className="section-badge mb-4">{t("feedback.badge")}</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                {t("feedback.title")}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                {t("feedback.subtitle")}
              </p>
              <Link href="/soporte#feedback-form" className="mt-8 inline-flex">
                <Button className="gap-2">
                  {t("feedback.button")}
                  <MessageSquareHeart className="h-4 w-4" />
                </Button>
              </Link>
              <p className="mt-3 text-xs text-[var(--muted-soft)]">
                Respuesta promedio en menos de 2 horas
              </p>
            </div>
          </div>

          <div className="surface-panel-dark surface-ambient brand-v-slash px-6 py-6 sm:px-8 sm:py-8">
            <div className="relative z-[1]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                Soporte con contexto
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Preguntas reales, respuestas claras.
              </h3>
              <div className="mt-6 space-y-3">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4">
                  <p className="text-sm font-semibold text-white">
                    Dudas antes de comprar
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">
                    Te ayudamos a validar producto, tiempos y proceso de compra.
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4">
                  <p className="text-sm font-semibold text-white">
                    Seguimiento del pedido
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">
                    Si ya compraste, acompanamos el estado de la orden y su
                    entrega.
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4">
                  <p className="text-sm font-semibold text-white">
                    Feedback util
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">
                    Usamos los comentarios para ajustar comunicacion, procesos y
                    catalogo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
