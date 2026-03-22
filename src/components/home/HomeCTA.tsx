"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";

export function HomeCTA() {
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="v-section" data-tone="warm">
      <div className="v-section-inner">
        <motion.div
          className="surface-panel-dark surface-ambient brand-v-slash px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 30, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.65, ease: "easeOut" }}
        >
          <div className="relative z-[1] grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
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
                Vas viendo tus datos, el resumen del pedido y la confirmación en
                el mismo flujo, también en celular.
              </p>
            </div>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.15, duration: 0.45 }}
            >
              <Button
                asChild
                size="lg"
                className="w-full gap-2 border border-white/12 bg-[#0d3c29] text-white shadow-[0_22px_50px_rgba(4,19,16,0.22)] hover:bg-[#145238] lg:w-auto"
              >
                <Link href="#productos">
                  <ShieldCheck className="h-5 w-5" />
                  {t("cta.noRisk.button")}
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <div className="v-section-divider" />
      </div>
    </section>
  );
}
