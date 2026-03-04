"use client";

import Link from "next/link";
import {
  CreditCard,
  Mail,
  ShieldCheck,
  ShieldEllipsis,
  ArrowUp,
  Instagram,
  Facebook,
} from "lucide-react";
import { PaymentLogos } from "./PaymentLogos";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { motion } from "framer-motion";

const socialLinks = [
  { href: "https://instagram.com", label: "Instagram", Icon: Instagram },
  { href: "https://facebook.com", label: "Facebook", Icon: Facebook },
  {
    href: "https://x.com",
    label: "X",
    Icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function Footer() {
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === "dark";
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

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
      className={`relative ${
        isDark
          ? "bg-[#0a0b0f] text-neutral-400"
          : "bg-[var(--background)] text-neutral-600"
      }`}
    >
      {/* Gradient divider */}
      <div
        className="h-px w-full"
        style={{
          background: isDark
            ? "linear-gradient(90deg, transparent 0%, rgba(74,222,128,0.35) 50%, transparent 100%)"
            : "linear-gradient(90deg, transparent 0%, rgba(22,163,74,0.25) 50%, transparent 100%)",
        }}
      />
      <div
        className="h-[1px] w-full"
        style={{
          background: isDark
            ? "linear-gradient(90deg, transparent 0%, rgba(74,222,128,0.08) 50%, transparent 100%)"
            : "linear-gradient(90deg, transparent 0%, rgba(22,163,74,0.06) 50%, transparent 100%)",
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
              className={`rounded-2xl px-5 py-4 flex items-center gap-4 transition-colors ${
                isDark
                  ? "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05]"
                  : "bg-neutral-50 border border-neutral-100 hover:bg-neutral-100/80"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isDark
                    ? "bg-[var(--accent)]/10 text-[var(--accent-strong)]"
                    : "bg-[var(--accent)]/10 text-[var(--accent-strong)]"
                }`}
              >
                <item.Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-sm font-semibold ${
                  isDark ? "text-neutral-300" : "text-neutral-700"
                }`}
              >
                {item.text}
              </span>
            </motion.div>
          ))}
        </motion.div>

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
              <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="text-sm font-extrabold text-[#071a0a]">V</span>
              </div>
              <span
                className={`text-lg font-bold tracking-tight ${
                  isDark ? "text-white" : "text-[var(--foreground)]"
                }`}
              >
                Vortixy
              </span>
            </Link>
            <p
              className={`text-sm leading-relaxed max-w-sm mb-1 ${
                isDark ? "text-neutral-500" : "text-neutral-500"
              }`}
            >
              {t("footer.description")}
            </p>
            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                className={`mt-4 inline-flex items-center gap-2.5 text-sm font-medium transition-colors ${
                  isDark
                    ? "text-neutral-400 hover:text-white"
                    : "text-neutral-500 hover:text-[var(--foreground)]"
                }`}
              >
                <Mail className="w-4 h-4" />
                {supportEmail}
              </a>
            )}

            {/* Social links */}
            <div className="flex items-center gap-2 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`h-9 px-4 rounded-full text-xs font-medium inline-flex items-center gap-2 transition-all duration-200 ${
                    isDark
                      ? "bg-white/[0.04] text-neutral-400 hover:bg-white/[0.1] hover:text-white border border-white/[0.06] hover:border-white/[0.12]"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <social.Icon />
                  <span>{social.label}</span>
                </a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          {linkColumns.map((col, i) => (
            <motion.div
              key={col.title}
              custom={i + 1}
              variants={fadeInUp}
              className="lg:col-span-2 lg:col-start-auto"
            >
              <h4
                className={`text-[11px] font-semibold uppercase tracking-[0.14em] mb-4 ${
                  isDark ? "text-neutral-500" : "text-neutral-400"
                }`}
              >
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`text-sm inline-flex items-center transition-all duration-200 hover:translate-x-1 ${
                        isDark
                          ? "hover:text-white"
                          : "hover:text-[var(--foreground)]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Scroll to top - desktop only, positioned in the last column */}
          <motion.div
            custom={4}
            variants={fadeInUp}
            className="hidden lg:flex lg:col-span-2 items-start justify-end"
          >
            <button
              onClick={scrollToTop}
              className={`group flex items-center gap-2 text-xs font-medium transition-all duration-200 rounded-full h-9 px-4 ${
                isDark
                  ? "bg-white/[0.04] text-neutral-400 hover:bg-white/[0.1] hover:text-white border border-white/[0.06] hover:border-white/[0.12]"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 border border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
              {t("footer.backToTop") || "Back to top"}
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div
        className={`border-t ${
          isDark ? "border-white/[0.06]" : "border-neutral-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <p
            className={`text-xs ${
              isDark ? "text-neutral-600" : "text-neutral-400"
            }`}
          >
            © {new Date().getFullYear()} {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-4">
            <PaymentLogos variant={isDark ? "light" : "dark"} size="sm" />
            {/* Scroll to top - mobile */}
            <button
              onClick={scrollToTop}
              className={`lg:hidden flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
                isDark
                  ? "bg-white/[0.04] text-neutral-400 hover:bg-white/[0.1] hover:text-white border border-white/[0.06]"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border border-neutral-200"
              }`}
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
