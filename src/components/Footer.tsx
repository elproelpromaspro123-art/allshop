"use client";

import Link from "next/link";
import {
  CreditCard,
  Mail,
  ShieldCheck,
  ShieldEllipsis,
  ArrowUp,
} from "lucide-react";
import { PaymentLogos } from "./PaymentLogos";
import { useLanguage } from "@/providers/LanguageProvider";
import { motion } from "framer-motion";
import { SUPPORT_EMAIL } from "@/lib/site";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function Footer() {
  const { t } = useLanguage();
  const supportEmail = SUPPORT_EMAIL;

  const footerLinks = {
    shop: [
      { label: t("nav.kitchen"), href: "/categoria/cocina" },
      { label: t("nav.tech"), href: "/categoria/tecnologia" },
      { label: t("nav.home"), href: "/categoria/hogar" },
      { label: t("nav.beauty"), href: "/categoria/belleza" },
      { label: t("nav.fitness"), href: "/categoria/fitness" },
    ],
    help: [
      { label: t("footer.track"), href: "/seguimiento" },
      { label: t("footer.shipping"), href: "/envios" },
      { label: t("footer.returns"), href: "/devoluciones" },
      { label: t("footer.faq"), href: "/faq" },
      { label: t("footer.support"), href: "/soporte" },
    ],
    legal: [
      { label: t("footer.terms"), href: "/terminos" },
      { label: t("footer.privacy"), href: "/privacidad" },
      { label: t("footer.cookies"), href: "/cookies" },
    ],
  };

  const trustPills = [
    { Icon: ShieldCheck, text: t("guarantee.realWarranty") },
    { Icon: CreditCard, text: t("footer.mercadoPago") },
    { Icon: ShieldEllipsis, text: t("footer.ssl") },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const linkColumns = [
    { title: t("footer.categories"), links: footerLinks.shop },
    { title: t("footer.help"), links: footerLinks.help },
    { title: t("footer.legal"), links: footerLinks.legal },
  ];

  return (
    <footer
      className="relative bg-[var(--background)] text-neutral-600"
    >
      {/* Subtle gradient divider */}
      <div
        className="h-px w-full"
        style={{
          background: "linear-gradient(90deg, transparent 5%, rgba(0,169,104,0.15) 50%, transparent 95%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-10">
        {/* Trust pills */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-14"
        >
          {trustPills.map((item, i) => (
            <motion.div
              key={item.text}
              custom={i}
              variants={fadeInUp}
              className="rounded-2xl px-5 py-4 flex items-center gap-4 transition-all duration-300 bg-white border border-[var(--border)] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.06)]"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--accent-strong)]/8 text-[var(--accent-strong)]"
              >
                <item.Icon className="w-5 h-5" />
              </div>
              <span
                className="text-sm font-semibold text-neutral-700"
              >
                {item.text}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <h2 className="sr-only">Enlaces a pie de página</h2>
        {/* Main grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-8 lg:gap-6"
        >
          {/* Brand column */}
          <motion.div
            custom={0}
            variants={fadeInUp}
            className="sm:col-span-2 lg:col-span-4"
          >
            <Link href="/" className="inline-flex items-center gap-3 group mb-4">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent-strong)] flex items-center justify-center transition-transform group-hover:scale-105 shadow-[0_2px_8px_-2px_rgba(0,169,104,0.3)]">
                <span className="text-sm font-extrabold text-white">V</span>
              </div>
              <span
                className="text-lg font-bold tracking-tight text-[var(--foreground)]"
              >
                Vortixy
              </span>
            </Link>
            <p
              className="text-sm leading-relaxed max-w-sm mb-1 text-neutral-500"
            >
              {t("footer.description")}
            </p>
            <a
              href={`mailto:${supportEmail}`}
              className="mt-4 inline-flex items-center gap-2.5 text-sm font-medium transition-colors text-neutral-500 hover:text-[var(--foreground)]"
            >
              <Mail className="w-4 h-4" />
              {supportEmail}
            </a>
          </motion.div>

          {/* Link columns */}
          {linkColumns.map((col, i) => (
            <motion.div
              key={col.title}
              custom={i + 1}
              variants={fadeInUp}
              className="lg:col-span-2 lg:col-start-auto"
            >
              <h3
                className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-4 text-neutral-500"
              >
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm inline-flex items-center transition-all duration-200 hover:translate-x-1 hover:text-[var(--foreground)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Scroll to top */}
          <motion.div
            custom={4}
            variants={fadeInUp}
            className="hidden lg:flex lg:col-span-2 items-start justify-end"
          >
            <button
              onClick={scrollToTop}
              className="group flex items-center gap-2 text-xs font-medium transition-all duration-200 rounded-full h-9 px-4 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 border border-[var(--border)] hover:shadow-sm"
            >
              <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
              {t("footer.backToTop") || "Volver arriba"}
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t border-[var(--border)]"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <p
            className="text-xs text-neutral-500"
          >
            © {new Date().getFullYear()} {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-4">
            <PaymentLogos variant="dark" size="sm" />
            {/* Scroll to top - mobile */}
            <button
              onClick={scrollToTop}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 bg-white text-neutral-500 hover:bg-neutral-50 border border-[var(--border)]"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
