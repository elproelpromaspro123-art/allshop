"use client";

import { usePathname } from "next/navigation";
import { ArrowUp, Heart, Mail, MapPin, Sparkles, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { PaymentLogos } from "./PaymentLogos";
import { useToast } from "./ui/Toast";
import { SUPPORT_EMAIL } from "@/lib/site";
import { getRouteChromeConfig, isFloatingVisible } from "@/lib/route-chrome";
import { useLanguage } from "@/providers/LanguageProvider";
import { fetchWithCsrf, isCsrfClientError } from "@/lib/csrf-client";
import {
  NavigationBrandLockup,
  NavigationFooterSections,
  NavigationShortcutStrip,
  NavigationTrustPills,
  buildFooterSections,
} from "@/components/navigation/SiteNavigation";

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
  const footerSections = buildFooterSections(t);
  const footerShortcuts = [
    { label: t("footer.track"), hint: "Pedido", icon: Truck },
    { label: t("footer.favorites"), hint: "Guardar", icon: Heart },
    { label: t("footer.support"), hint: "Ayuda", icon: Sparkles },
  ];
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const showBackToTop = isFloatingVisible(chrome.backToTopVisibility, isMobile);

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
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.22em] text-white/72">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_0.25rem_rgba(16,185,129,0.2)]" />
                Novedades de la tienda
              </div>
              <div className="space-y-3">
                <NavigationBrandLockup tone="dark" />
                <h2 className="max-w-2xl text-3xl font-black tracking-[-0.05em] text-white sm:text-[2.6rem]">
                  Novedades y ofertas sin llenar tu correo.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                  Te avisamos cuando hay algo nuevo o una oferta que vale la
                  pena. Sin correos de relleno.
                </p>
              </div>

              <NavigationTrustPills className="text-white/72" />
            </div>

            <div className="space-y-4">
              <NavigationShortcutStrip
                title="Atajos útiles"
                items={footerShortcuts}
              />
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/52">
                Ofertas y novedades
              </p>
              <NewsletterForm />
              <p className="text-xs leading-6 text-white/52">
                Solo novedades útiles sobre productos, stock y promociones reales.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.65fr)]">
          <div className="space-y-5">
            <NavigationBrandLockup tone="dark" />

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

          <NavigationFooterSections sections={footerSections} />
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
            {showBackToTop ? (
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
