"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  Lock,
  Mail,
  MapPin,
  Truck,
} from "lucide-react";
import { PaymentLogos } from "./PaymentLogos";
import { useLanguage } from "@/providers/LanguageProvider";
import { SUPPORT_EMAIL } from "@/lib/site";

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const linkColumns = [
    { title: t("footer.categories"), links: footerLinks.shop },
    { title: t("footer.help"), links: footerLinks.help },
    { title: t("footer.legal"), links: footerLinks.legal },
  ];

  return (
    <footer className="relative bg-[var(--background)] text-[var(--muted)]">
      {/* Gradient top transition */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10">
        <h2 className="sr-only">{t("footer.linksTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-8 lg:gap-6">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-3 group mb-4">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dim)] flex items-center justify-center transition-transform group-hover:scale-105 shadow-[0_2px_8px_rgba(0,143,88,0.25)]">
                <span className="text-sm font-black text-white tracking-widest">V</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                Vortixy
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm mb-3 text-[var(--muted)]">
              {t("footer.description")}
            </p>

            {/* Trust micro-badges */}
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <Lock className="w-3 h-3" />
                <span>Compra segura · Pago contraentrega</span>
              </div>
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center gap-2.5 text-sm font-medium transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <Mail className="w-4 h-4" />
                {supportEmail}
              </a>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-soft)]">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{t("footer.location")}</span>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-emerald-600">
                <Truck className="w-3 h-3" />
                <span>Envíos a toda Colombia</span>
              </div>
            </div>
          </div>

          {linkColumns.map((col) => (
            <div key={col.title} className="lg:col-span-2 lg:col-start-auto">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-5 text-[var(--muted-soft)]">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group/link text-sm inline-flex items-center gap-1 transition-all duration-200 hover:text-[var(--foreground)]"
                    >
                      {link.label}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-200 text-[var(--accent-strong)]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="hidden lg:flex lg:col-span-2 items-start justify-end">
            <button
              onClick={scrollToTop}
              aria-label={t("footer.backToTop")}
              className="group flex items-center gap-2 text-xs font-medium transition-all duration-200 rounded-full h-9 px-4 bg-white text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)] border border-[var(--border)] hover:shadow-sm"
            >
              <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
              {t("footer.backToTop") || "Volver arriba"}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <p className="text-xs text-[var(--muted)]">
            © {new Date().getFullYear()} {t("footer.copyright")} · {t("footer.region")} · Hecho con ❤️ en Colombia
          </p>
          <div className="flex items-center gap-4">
            <PaymentLogos variant="dark" size="sm" />
            <button
              onClick={scrollToTop}
              className="lg:hidden flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 bg-white text-[var(--muted)] hover:bg-[var(--background)] border border-[var(--border)]"
              aria-label={t("footer.backToTop")}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
