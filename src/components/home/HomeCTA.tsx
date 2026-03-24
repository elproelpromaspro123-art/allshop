"use client";

import Link from "next/link";
import {
  ArrowRight,
  MessageSquareHeart,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

export function HomeCTA() {
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotionSafe();
  const confidenceRows = [
    {
      icon: ShieldCheck,
      title: "Sin anticipos",
      detail: "Confirmas primero y pagas cuando recibes el pedido.",
    },
    {
      icon: Truck,
      title: "Cobertura validada",
      detail: "La ciudad y la entrega se revisan antes de cerrar la compra.",
    },
    {
      icon: MessageSquareHeart,
      title: "Soporte humano",
      detail: "Puedes resolver dudas reales sin salir del flujo de compra.",
    },
  ];

  return (
    <section className="v-section" data-density="compact" data-tone="warm">
      <div className="v-section-inner">
        <motion.div
          className="surface-panel-dark surface-ambient brand-v-slash px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
          initial={
            prefersReducedMotion ? false : { opacity: 0, y: 30, scale: 0.98 }
          }
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.65,
            ease: "easeOut",
          }}
        >
          <div className="relative z-[1] grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div className="v-editorial-copy">
              <div className="v-chip-row">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/76">
                  Contraentrega
                </span>
                <span className="inline-flex items-center rounded-full border border-emerald-300/16 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100/80">
                  Sin anticipos
                </span>
              </div>

              <p className="v-kicker text-white/88">{t("cta.noRisk.badge")}</p>
              <h2 className="text-headline text-white">
                {t("cta.noRisk.title")}
              </h2>
              <p className="max-w-2xl text-base leading-8 text-emerald-100/82 sm:text-lg">
                {t("cta.noRisk.text")}
              </p>
              <p className="text-sm text-white/76">
                Ves tus datos, el resumen del pedido y la confirmacion en el
                mismo flujo, tambien en celular.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {confidenceRows.map((row, index) => (
                  <motion.div
                    key={row.title}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.06] px-4 py-4"
                    initial={
                      prefersReducedMotion ? false : { opacity: 0, y: 18 }
                    }
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: prefersReducedMotion ? 0 : 0.12 + index * 0.06,
                      duration: prefersReducedMotion ? 0 : 0.4,
                    }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-emerald-200">
                      <row.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">
                      {row.title}
                    </p>
                    <p className="mt-1.5 text-xs leading-6 text-white/70">
                      {row.detail}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              className="space-y-3"
              initial={
                prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.98 }
              }
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: prefersReducedMotion ? 0 : 0.15,
                duration: prefersReducedMotion ? 0 : 0.45,
              }}
            >
              <Button
                asChild
                size="lg"
                className="w-full gap-2 border border-white/12 bg-[#0d3c29] text-white shadow-[0_22px_50px_rgba(4,19,16,0.22)] hover:bg-[#145238]"
              >
                <Link href="#productos">
                  <ShieldCheck className="h-5 w-5" />
                  {t("cta.noRisk.button")}
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full border-white/12 bg-white/[0.08] text-white hover:border-white/18 hover:bg-white/[0.12] hover:text-white"
              >
                <Link href="/soporte#feedback-form">
                  Resolver una duda
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <p className="text-xs leading-6 text-white/62">
                Si quieres validar cobertura, tiempos o un producto puntual,
                soporte te responde sin sacarte del proceso.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
