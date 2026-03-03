"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { PaymentLogos } from "./PaymentLogos";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { TRUST_VISUALS } from "@/lib/trust-visuals";

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
      className={`border-t ${isDark
          ? "bg-[#090d14] border-white/[0.06] text-neutral-400"
          : "bg-[var(--background)] border-[var(--border)] text-neutral-600"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Top badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {[
            { image: TRUST_VISUALS.warranty, text: t("guarantee.realWarranty") },
            { image: TRUST_VISUALS.payment, text: t("footer.mercadoPago") },
            { image: TRUST_VISUALS.security, text: t("footer.ssl") },
          ].map((item) => (
            <div
              key={item.text}
              className={`rounded-xl px-4 py-3 flex items-center gap-3 ${isDark
                  ? "bg-white/[0.03] border border-white/[0.06]"
                  : "bg-[var(--surface)] border border-[var(--border)]"
                }`}
            >
              <Image
                src={item.image}
                alt={item.text}
                width={28}
                height={28}
                className="w-7 h-7 rounded-lg object-cover shrink-0"
              />
              <span className="text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <span className="text-xs font-extrabold text-[#071a0a]">
                  A
                </span>
              </div>
              <span
                className={`text-base font-bold ${isDark ? "text-white" : "text-[var(--foreground)]"
                  }`}
              >
                allshop
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              {t("footer.description")}
            </p>
            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                className={`mt-3 inline-flex items-center gap-2 text-sm transition-colors ${isDark
                    ? "text-neutral-400 hover:text-white"
                    : "text-neutral-500 hover:text-[var(--foreground)]"
                  }`}
              >
                <Mail className="w-3.5 h-3.5" />
                {supportEmail}
              </a>
            )}
          </div>

          {/* Categories */}
          <div>
            <h4
              className={`text-[11px] font-semibold uppercase tracking-[0.12em] mb-3 ${isDark ? "text-neutral-500" : "text-neutral-400"
                }`}
            >
              {t("footer.categories")}
            </h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-colors ${isDark
                        ? "hover:text-white"
                        : "hover:text-[var(--foreground)]"
                      }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4
              className={`text-[11px] font-semibold uppercase tracking-[0.12em] mb-3 ${isDark ? "text-neutral-500" : "text-neutral-400"
                }`}
            >
              {t("footer.help")}
            </h4>
            <ul className="space-y-2">
              {footerLinks.help.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-colors ${isDark
                        ? "hover:text-white"
                        : "hover:text-[var(--foreground)]"
                      }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Social */}
          <div>
            <h4
              className={`text-[11px] font-semibold uppercase tracking-[0.12em] mb-3 ${isDark ? "text-neutral-500" : "text-neutral-400"
                }`}
            >
              {t("footer.legal")}
            </h4>
            <ul className="space-y-2 mb-5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-colors ${isDark
                        ? "hover:text-white"
                        : "hover:text-[var(--foreground)]"
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
                  className={`h-8 px-3 rounded-full text-xs font-medium inline-flex items-center transition-colors ${isDark
                      ? "bg-white/[0.04] text-neutral-400 hover:bg-white/[0.08] hover:text-white"
                      : "bg-[var(--surface-muted)] text-neutral-500 hover:bg-[var(--border)]"
                    }`}
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className={`border-t ${isDark ? "border-white/[0.06]" : "border-[var(--border)]"
          }`}
      >
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
