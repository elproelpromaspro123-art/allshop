"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ArrowUp, Lock, Mail, MapPin, Sparkles, Truck } from "lucide-react";
import { useState } from "react";
import { PaymentLogos } from "./PaymentLogos";
import { useToast } from "./ui/Toast";
import { SUPPORT_EMAIL } from "@/lib/site";
import { getRouteChromeConfig } from "@/lib/route-chrome";
import { useLanguage } from "@/providers/LanguageProvider";
import { fetchWithCsrf, isCsrfClientError } from "@/lib/csrf-client";

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !email.includes("@")) {
      toast("Ingresa un email válido", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetchWithCsrf("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al suscribirse");
      }

      toast(t("footer.subscribed"), "success");
      setEmail("");
    } catch (error) {
      const errorMessage = isCsrfClientError(error)
        ? "Error de seguridad. Recarga la página e intenta nuevamente."
        : error instanceof Error
          ? error.message
          : "Error al suscribirse";
      toast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={t("footer.emailPlaceholder")}
        disabled={isLoading}
        className="h-12 flex-1 rounded-full border border-white/12 px-4 text-sm text-white placeholder:text-white/46 focus:border-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-300/20 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="h-12 rounded-full bg-white px-5 text-sm font-semibold text-[#0f3a2e] shadow-[0_16px_34px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
      >
        {isLoading ? "Enviando..." : t("footer.subscribe")}
      </button>
    </form>
  );
}

export function Footer() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const chrome = getRouteChromeConfig(pathname);
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

  if (!chrome.showFooter) {
    return null;
  }

  return (
    <footer className="shell-footer text-white/72">
      <div className="relative z-[1] mx-auto max-w-7xl px-5 pb-8 pt-12 sm:px-6 lg:px-8">
        <div className="shell-footer__newsletter mb-10 rounded-[2rem] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:items-end">
            <div className="space-y-5">
              <div className="editorial-kicker border-white/10 bg-white/10 text-white/86 before:shadow-[0_0_0_0.35rem_rgba(16,185,129,0.14)]">
                Capa editorial y comercial
              </div>
              <div className="space-y-3">
                <h2 className="max-w-2xl text-3xl font-black tracking-[-0.05em] text-white sm:text-[2.6rem]">
                  Un storefront más fino, más claro y más útil para comprar.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                  Seguimos afinando la experiencia completa. Recibe lanzamientos,
                  piezas destacadas y ajustes premium sin perder la claridad que
                  necesita una tienda contraentrega en Colombia.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 text-xs font-semibold text-white/76">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
                  <Truck className="h-3.5 w-3.5 text-emerald-300" />
                  Envíos a toda Colombia
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-300" />
                  Pago contraentrega
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                  Soporte humano
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/52">
                Ofertas y novedades
              </p>
              <NewsletterForm />
              <p className="text-xs leading-6 text-white/52">
                Solo comunicaciones de producto, tienda y mejoras reales de la
                experiencia. Sin ruido.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,0.55fr))]">
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="shell-brand-mark h-11 w-11 rounded-[1.25rem]">
                <span className="text-sm font-black tracking-[0.26em]">V</span>
              </div>
              <div>
                <p className="text-[0.62rem] font-black uppercase tracking-[0.34em] text-white/42">
                  Editorial Commerce
                </p>
                <p className="text-xl font-black tracking-[-0.05em] text-white">
                  Vortixy
                </p>
              </div>
            </Link>

            <p className="max-w-md text-sm leading-7 text-white/68">
              {t("footer.description")}
            </p>
            <p className="max-w-md text-sm leading-7 text-white/48">
              {t("footer.tagline")}
            </p>

            <div className="space-y-2.5 text-sm text-white/72">
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center gap-2.5 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 text-emerald-300" />
                {supportEmail}
              </a>
              <div className="inline-flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-300" />
                <span>{t("footer.location")}</span>
              </div>
            </div>
          </div>

          {linkColumns.map((column) => (
            <div key={column.title} className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-white/74 transition-colors hover:text-white"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-emerald-300 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/48">
            <span suppressHydrationWarning>
              Copyright {new Date().getFullYear()} {t("footer.copyright")}
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:inline-block" />
            <span>{t("footer.region")}</span>
            <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:inline-block" />
            <span>{t("footer.madeInColombia")}</span>
          </div>

          <div className="flex items-center gap-4">
            <PaymentLogos variant="dark" size="sm" />
            {chrome.backToTopVisibility !== "hidden" ? (
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/78 transition-colors hover:bg-white/14 hover:text-white"
                aria-label={t("footer.backToTop")}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
