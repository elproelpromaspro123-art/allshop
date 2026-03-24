"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, MessageCircle, Package } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { GuaranteeSeal } from "@/components/GuaranteeSeal";
import { useDeliveryEstimate } from "@/lib/use-delivery-estimate";
import { storefrontContent } from "@/content/config/storefront-content";

export function StorefrontHero() {
  const deliveryEstimate = useDeliveryEstimate();
  const { hero } = storefrontContent;

  const deliveryWindow = deliveryEstimate
    ? `${deliveryEstimate.min}-${deliveryEstimate.max} dias habiles`
    : "Tiempo estimado segun ciudad";

  const heroSignals = [
    { icon: CreditCard, text: hero.signals.payment },
    { icon: Package, text: `Entrega estimada: ${deliveryWindow}` },
    { icon: MessageCircle, text: hero.signals.support },
  ];

  const heroOverview = [
    { label: hero.metrics.paymentLabel, value: hero.metrics.paymentValue },
    { label: hero.metrics.deliveryLabel, value: deliveryWindow },
    { label: hero.metrics.coverageLabel, value: hero.metrics.coverageValue },
  ];

  return (
    <section className="v-section" data-density="hero" data-tone="mist">
      <div className="v-section-inner">
        <div className="v-section-grid" data-layout="hero">
          <motion.div
            className="v-editorial-copy"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <p className="section-badge">{hero.badge}</p>

            <div className="v-editorial-copy">
              <h1 className="display-title max-w-4xl font-extrabold leading-[1.02] text-[var(--foreground)]">
                Productos utiles, entrega visible y soporte real para comprar{" "}
                <span className="inline-block pb-[0.1em] pr-[0.08em] font-display italic text-gradient-accent">
                  {hero.titleAccent}
                </span>
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
                {hero.subtitle}
              </p>
            </div>

            <div className="v-chip-row">
              {heroSignals.map((signal, index) => (
                <motion.span
                  key={signal.text}
                  className="v-chip"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.08, duration: 0.4 }}
                  suppressHydrationWarning
                >
                  <signal.icon className="h-4 w-4 text-[var(--accent-strong)]" />
                  <span>{signal.text}</span>
                </motion.span>
              ))}
            </div>

            <GuaranteeSeal variant="inline" />

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2 px-8">
                <Link href="#productos">
                  Ver productos
                  <ArrowRight className="h-[18px] w-[18px]" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#categorias">Explorar categorias</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="surface-panel-dark surface-ambient brand-v-slash px-5 py-6 sm:px-7 sm:py-8 lg:px-8"
            initial={{ opacity: 0, x: 32, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          >
            <div className="relative z-[1]">
              <p className="v-kicker text-white/76">{hero.editorialKicker}</p>
              <h2 className="mt-3 max-w-xl text-[1.9rem] font-semibold leading-[1.02] tracking-tight text-white sm:text-[2.4rem]">
                {hero.editorialTitle}
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/76 sm:text-base">
                {hero.editorialDescription}
              </p>

              <div className="hero-metric-grid v-metric-grid mt-8">
                {heroOverview.map((item) => (
                  <div key={item.label} className="v-metric-card">
                    <p className="v-metric-label">{item.label}</p>
                    <p className="v-metric-value" suppressHydrationWarning>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.4rem] border border-white/12 bg-white/[0.06] px-4 py-4 text-sm leading-7 text-white/82">
                {hero.editorialNote}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
