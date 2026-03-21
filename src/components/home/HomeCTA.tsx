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
    <section className="py-16 sm:py-24 bg-[var(--background)] relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--emerald-panel-strong)_0%,var(--emerald-panel-mid)_55%,var(--emerald-panel-soft)_100%)] px-5 py-5 shadow-[var(--shadow-cta)] transition-shadow duration-500 hover:shadow-[var(--shadow-cta-hover)] surface-ambient brand-v-slash sm:px-8 sm:py-6 lg:px-10 lg:py-7"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.7, ease: "easeOut" }}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
        >
          {!prefersReducedMotion && (
            <>
              <motion.div
                className="absolute -right-10 top-[-1.5rem] h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(0,212,130,0.12)_0%,transparent_72%)] pointer-events-none sm:h-44 sm:w-44"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -left-8 bottom-[-2rem] h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(0,168,104,0.08)_0%,transparent_72%)] pointer-events-none sm:h-36 sm:w-36"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.6, 0.9, 0.6],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              />
            </>
          )}

          <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <motion.div
                className="mb-4 flex flex-wrap gap-2"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.3, duration: prefersReducedMotion ? 0 : 0.5 }}
              >
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/76">
                  Contraentrega
                </span>
                <span className="inline-flex items-center rounded-full border border-emerald-300/16 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100/80">
                  Sin anticipos
                </span>
              </motion.div>
              <motion.p
                className="text-xs text-emerald-100/60 mt-2"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.35, duration: prefersReducedMotion ? 0 : 0.5 }}
              >
                +200 pedidos procesados con este método
              </motion.p>

              <motion.p
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.4, duration: prefersReducedMotion ? 0 : 0.5 }}
              >
                {t("cta.noRisk.badge")}
              </motion.p>
              <motion.h2
                className="mt-3 max-w-xl text-headline text-white"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.5, duration: prefersReducedMotion ? 0 : 0.5 }}
              >
                {t("cta.noRisk.title")}
              </motion.h2>
              <motion.p
                className="mt-3 max-w-xl text-base sm:text-lg text-emerald-100/80"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.6, duration: prefersReducedMotion ? 0 : 0.5 }}
              >
                {t("cta.noRisk.text")}
              </motion.p>
            </div>

            <motion.div
              className="w-full shrink-0 lg:w-auto lg:justify-self-end"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.7, duration: prefersReducedMotion ? 0 : 0.5 }}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            >
              <Link href="#productos" className="block w-full">
                <Button
                  size="lg"
                  className="w-full gap-2 border-0 bg-white text-[#052e1a] shadow-[var(--shadow-elevated)] hover:bg-emerald-50 lg:w-auto"
                >
                  <ShieldCheck className="h-5 w-5" />
                  {t("cta.noRisk.button")}
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}