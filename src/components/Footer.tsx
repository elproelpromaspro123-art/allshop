"use client";

import Link from "next/link";
import { Shield, CreditCard, Lock, Mail } from "lucide-react";
import { PaymentLogos } from "./PaymentLogos";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";

const socialLinks = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://facebook.com", label: "Facebook" },
  { href: "https://x.com", label: "X" },
];

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

  return (
    <footer
      className={
        isDark
          ? "bg-[#0b0d10] text-neutral-300 border-t border-white/10"
          : "bg-[#f3f8f5] text-neutral-700 border-t border-[var(--border)]"
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: Shield, text: t("guarantee.realWarranty") },
            { icon: CreditCard, text: t("footer.mercadoPago") },
            { icon: Lock, text: t("footer.ssl") },
          ].map((item) => (
            <div
              key={item.text}
              className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
                isDark ? "bg-white/5" : "bg-[var(--surface)] border border-[var(--border)]"
              }`}
            >
              <item.icon
                className={`w-4 h-4 ${
                  isDark ? "text-neutral-200" : "text-[var(--accent-strong)]"
                }`}
              />
              <span className="text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-12 gap-8">
          <div className="col-span-2 md:col-span-4">
            <Link href="/" className="inline-flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[#07230e] flex items-center justify-center text-sm font-semibold">
                A
              </div>
              <div>
                <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>
                  AllShop
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  {t("footer.tagline")}
                </p>
              </div>
            </Link>

            <p className={`text-sm leading-relaxed max-w-sm ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
              {t("footer.description")}
            </p>

            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                className={`mt-4 inline-flex items-center gap-2 text-sm transition-colors ${
                  isDark ? "text-neutral-300 hover:text-white" : "text-[#2f433a] hover:text-[var(--foreground)]"
                }`}
              >
                <Mail className="w-4 h-4" />
                {supportEmail}
              </a>
            )}
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-neutral-500">
              {t("footer.categories")}
            </h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-colors ${
                      isDark ? "text-neutral-400 hover:text-white" : "text-[#4a5f56] hover:text-[var(--accent-strong)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-neutral-500">
              {t("footer.help")}
            </h4>
            <ul className="space-y-2">
              {footerLinks.help.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-colors ${
                      isDark ? "text-neutral-400 hover:text-white" : "text-[#4a5f56] hover:text-[var(--accent-strong)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-neutral-500">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-2 mb-5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-colors ${
                      isDark ? "text-neutral-400 hover:text-white" : "text-[#4a5f56] hover:text-[var(--accent-strong)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                    isDark
                      ? "bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-white"
                      : "bg-[var(--surface)] text-[#42544c] hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_14%)]"
                  }`}
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`border-t ${isDark ? "border-white/10" : "border-[var(--border)]"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} {t("footer.copyright")}
          </p>
          <PaymentLogos variant={isDark ? "light" : "dark"} size="sm" />
        </div>
      </div>
    </footer>
  );
}
