"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, Package, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GuaranteeSeal } from "@/components/GuaranteeSeal";
import { useLanguage } from "@/providers/LanguageProvider";
import { useDeliveryEstimate } from "@/lib/use-delivery-estimate";

export function HomeHero() {
  const { t } = useLanguage();
  const deliveryEstimate = useDeliveryEstimate();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const deliveryWindow = isHydrated && deliveryEstimate
    ? `${deliveryEstimate.min}-${deliveryEstimate.max} días hábiles`
    : "Calculando envío...";

  const heroSignals = [
    { icon: CreditCard, text: "Pago claro y contraentrega" },
    { icon: Package, text: `Entrega estimada ${deliveryWindow}` },
    { icon: MessageCircle, text: "Soporte humano por WhatsApp" },
  ];

  const heroOverview = [
    { label: "Pago", value: "Contraentrega" },
    { label: "Entrega", value: deliveryWindow },
    { label: "Soporte", value: "WhatsApp y correo" },
  ];

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "var(--gradient-hero-vibrant)" }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,130,0.15),transparent_40%)]" />
        <div className="absolute left-[-10%] top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute right-[-5%] bottom-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(0,212,130,0.08),transparent_60%)] blur-3xl" />
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 lg:px-8 lg:pt-10 lg:pb-8">
        <div className="grid items-center gap-6 lg:min-h-[20rem] lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 2xl:min-h-[24rem]">
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <motion.p
              className="section-badge mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {t("hero.badge")}
            </motion.p>

            <motion.h1
              className="display-title font-extrabold text-[var(--foreground)] overflow-visible"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {t("hero.title")}{" "}
              <span className="inline-block font-display italic text-gradient-accent pr-8 pb-2">
                {t("hero.titleAccent")}
              </span>
            </motion.h1>

            <motion.p
              className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {t("hero.subtitle")}
            </motion.p>

            <motion.div
              className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {heroSignals.map((signal, i) => (
                <motion.span
                  key={signal.text}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-200/60 bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-semibold text-emerald-800 shadow-sm hover:shadow-md hover:border-emerald-300/80 transition-all duration-300 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                  whileHover={{ scale: 1.02, y: -1 }}
                  suppressHydrationWarning
                >
                  <signal.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
                  <span className="whitespace-nowrap">{signal.text}</span>
                </motion.span>
              ))}
            </motion.div>

            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <GuaranteeSeal variant="inline" />
            </motion.div>

            <motion.div
              className="mt-4 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <Link href="#productos">
                <Button size="lg" className="gap-2 px-8">
                  {t("hero.ctaPrimary")}
                  <ArrowRight className="h-[18px] w-[18px]" />
                </Button>
              </Link>
              <Link href="#categorias">
                <Button variant="outline" size="lg">
                  {t("hero.ctaSecondary")}
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="surface-panel-dark surface-ambient brand-v-slash px-4 py-3 sm:px-5 sm:py-4"
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="relative z-[1]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-lg">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                  Operación Vortixy
                  </p>
                  <h2 className="mt-1 text-[1.5rem] font-semibold leading-[1.02] tracking-tight text-white sm:text-[1.75rem]">
                    Contraentrega, entrega clara y soporte directo en un solo
                    vistazo.
                  </h2>
                  <p className="mt-1.5 max-w-md text-xs leading-relaxed text-white/66 sm:text-sm">
                    La primera pantalla muestra lo esencial. El resto del
                    proceso se despliega por bloques, con aire y lectura más
                    limpia.
                  </p>
                </div>
                <span className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/[0.06] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                  Colombia
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {heroOverview.map((item, index) => (
                  <motion.div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/[0.05] px-3 py-1.5 sm:py-2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                    whileHover={{ borderColor: "rgba(255,255,255,0.2)" }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {item.value}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="mt-2.5 rounded-[22px] border border-emerald-400/16 bg-emerald-400/10 px-3 py-2.5 text-xs leading-relaxed text-emerald-100/84"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
              >
                El flujo detallado, la cobertura y el soporte quedan justo
                debajo para mantener esta primera vista enfocada.
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}