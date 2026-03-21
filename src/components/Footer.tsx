"use client";

import Link from "next/link";
import { ArrowRight, ArrowUp, Lock, Mail, MapPin, Truck } from "lucide-react";
import { PaymentLogos } from "./PaymentLogos";
import { useLanguage } from "@/providers/LanguageProvider";
import { useToast } from "./ui/Toast";
import { SUPPORT_EMAIL } from "@/lib/site";

export function Footer() {
  const { t } = useLanguage();
  const { toast } = useToast();
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

  const linkColumns = [
    { title: t("footer.categories"), links: footerLinks.shop },
    { title: t("footer.help"), links: footerLinks.help },
    { title: t("footer.legal"), links: footerLinks.legal },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[linear-gradient(180deg,var(--emerald-panel-strong)_0%,#09845d_48%,#086647_100%)] text-white/60">
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10">
        <h2 className="sr-only">{t("footer.linksTitle")}</h2>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-12 lg:gap-6">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link
              href="/"
              className="group mb-4 inline-flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_2px_8px_rgba(0,143,88,0.3)] transition-transform group-hover:scale-105">
                <span className="text-sm font-black tracking-widest text-white">
                  V
                </span>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Vortixy
              </span>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-white/50">
              {t("footer.description")}
            </p>
            <p className="mt-3 mb-5 max-w-md text-sm leading-relaxed text-white/35">
              {t("footer.tagline")}
            </p>

            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400/80">
                <Lock className="h-3 w-3" />
                <span>{t("footer.securePurchase")}</span>
              </div>
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center gap-2.5 text-sm font-medium text-white/50 transition-colors hover:text-white/80"
              >
                <Mail className="h-4 w-4" />
                {supportEmail}
              </a>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{t("footer.location")}</span>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-emerald-400/60">
                <Truck className="h-3 w-3" />
                <span>{t("footer.shippingColombia")}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40 mb-3">
                {t("footer.exclusiveOffers")}
              </p>
              <form onSubmit={(e) => { e.preventDefault(); toast(t("footer.subscribed"), "success"); }} className="flex gap-2">
                <input
                  type="email"
                  placeholder={t("footer.emailPlaceholder")}
                  className="flex-1 h-10 rounded-full bg-white/10 border border-white/15 px-4 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/40 focus:bg-white/15 transition-all duration-300"
                />
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(0,212,130,0.3)] hover:shadow-[0_8px_24px_rgba(0,212,130,0.4)] hover:scale-105 transition-all duration-300"
                >
                  {t("footer.subscribe")}
                </button>
              </form>
            </div>
          </div>

          {linkColumns.map((column) => (
            <div key={column.title} className="lg:col-span-2 lg:col-start-auto">
              <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300/50">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group/link inline-flex items-center gap-1 text-sm transition-all duration-200 hover:text-white"
                    >
                      {link.label}
                      <ArrowRight className="h-3 w-3 -translate-x-1 text-emerald-400 opacity-0 transition-all duration-200 group-hover/link:translate-x-0 group-hover/link:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="hidden items-start justify-end lg:col-span-2 lg:flex">
            <button
              onClick={scrollToTop}
              aria-label={t("footer.backToTop")}
              className="group flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 text-xs font-medium text-white/60 transition-all duration-200 hover:border-white/20 hover:bg-white/15 hover:text-white"
            >
              <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
              {t("footer.backToTop") || "Volver arriba"}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-5 px-5 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-white/35">
            Copyright {new Date().getFullYear()} {t("footer.copyright")} /{" "}
            {t("footer.region")} / {t("footer.madeInColombia")}
          </p>
          <div className="flex items-center gap-4">
            <PaymentLogos variant="dark" size="sm" />
            <button
              onClick={scrollToTop}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/60 transition-all duration-200 hover:bg-white/15 lg:hidden"
              aria-label={t("footer.backToTop")}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
