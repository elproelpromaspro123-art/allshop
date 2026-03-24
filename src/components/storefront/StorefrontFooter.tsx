"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ArrowUp, Lock, Mail, MapPin, Truck } from "lucide-react";
import { useState } from "react";
import { PaymentLogos } from "@/components/PaymentLogos";
import { useToast } from "@/components/ui/Toast";
import { SUPPORT_EMAIL } from "@/lib/site";
import { getRouteChromeConfig } from "@/lib/route-chrome";
import { fetchWithCsrf, isCsrfClientError } from "@/lib/csrf-client";
import { storefrontContent } from "@/content/config/storefront-content";

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { footer } = storefrontContent;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !email.includes("@")) {
      toast("Ingresa un email valido", "error");
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

      toast("Te avisaremos cuando haya novedades utiles.", "success");
      setEmail("");
    } catch (error) {
      const errorMessage = isCsrfClientError(error)
        ? "Error de seguridad. Recarga la pagina e intenta de nuevo."
        : error instanceof Error
          ? error.message
          : "Error al suscribirse";
      toast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Tu correo electronico"
        disabled={isLoading}
        className="h-11 flex-1 rounded-full border border-white/15 bg-white/12 px-4 text-xs text-white placeholder:text-white/38 focus:border-emerald-300/50 focus:bg-white/16 focus:outline-none focus:ring-2 focus:ring-emerald-300/20 transition-all duration-300 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="h-11 rounded-full bg-white px-5 text-xs font-semibold text-[#0b5e42] shadow-[0_12px_32px_rgba(4,19,16,0.18)] transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_16px_34px_rgba(4,19,16,0.22)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "..." : footer.newsletterTitle}
      </button>
    </form>
  );
}

export function StorefrontFooter() {
  const pathname = usePathname();
  const chrome = getRouteChromeConfig(pathname);
  const { footer } = storefrontContent;

  const footerLinks = {
    shop: [
      { label: "Cocina", href: "/categoria/cocina" },
      { label: "Tecnologia", href: "/categoria/tecnologia" },
      { label: "Hogar", href: "/categoria/hogar" },
      { label: "Belleza", href: "/categoria/belleza" },
      { label: "Fitness", href: "/categoria/fitness" },
    ],
    help: [
      { label: "Seguimiento del pedido", href: "/seguimiento" },
      { label: "Politica de envio", href: "/envios" },
      { label: "Devoluciones", href: "/devoluciones" },
      { label: "Preguntas frecuentes", href: "/faq" },
      { label: "Soporte", href: "/soporte" },
    ],
    legal: [
      { label: "Terminos y condiciones", href: "/terminos" },
      { label: "Politica de privacidad", href: "/privacidad" },
      { label: "Politica de cookies", href: "/cookies" },
    ],
  };

  const linkColumns = [
    { title: "Categorias", links: footerLinks.shop },
    { title: "Ayuda", links: footerLinks.help },
    { title: "Legales", links: footerLinks.legal },
  ];

  if (!chrome.showFooter) {
    return null;
  }

  return (
    <footer className="relative bg-[linear-gradient(180deg,#0a6b4d_0%,#0b7f5a_42%,#086647_100%)] text-white/60">
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-5 pb-10 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-12 lg:gap-6">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link href="/" className="group mb-4 inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#34d399_0%,#10b981_65%,#0f8d61_100%)] shadow-[0_14px_32px_rgba(4,19,16,0.18)] transition-transform group-hover:scale-105">
                <span className="text-sm font-black tracking-widest text-white">
                  V
                </span>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Vortixy
              </span>
            </Link>

            <p className="max-w-sm text-sm leading-7 text-white/70">
              {footer.description}
            </p>
            <p className="mb-5 mt-3 max-w-md text-sm leading-7 text-white/48">
              {footer.tagline}
            </p>

            <div className="grid gap-2">
              {footer.operations.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.1rem] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/74"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300/82">
                <Lock className="h-3 w-3" />
                <span>Compra segura y pago contraentrega</span>
              </div>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2.5 text-sm font-medium text-white/72 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4" />
                {SUPPORT_EMAIL}
              </a>
              <div className="flex items-center gap-2 text-sm text-white/56">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>Cucuta, Colombia · Operando desde 2026</span>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-emerald-300/72">
                <Truck className="h-3 w-3" />
                <span>Envios a toda Colombia</span>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/46">
                {footer.newsletterTitle}
              </p>
              <NewsletterForm />
            </div>
          </div>

          {linkColumns.map((column) => (
            <div key={column.title} className="lg:col-span-2 lg:col-start-auto">
              <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200/56">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group/link inline-flex items-center gap-1 text-sm text-white/76 transition-all duration-200 hover:text-white"
                    >
                      {link.label}
                      <ArrowRight className="h-3 w-3 -translate-x-1 text-emerald-300 opacity-0 transition-all duration-200 group-hover/link:translate-x-0 group-hover/link:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="hidden items-start justify-end lg:col-span-2 lg:flex">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Volver arriba"
              className="group flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 text-xs font-medium text-white/68 transition-all duration-200 hover:border-white/20 hover:bg-white/15 hover:text-white"
            >
              <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
              Volver arriba
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p suppressHydrationWarning className="text-xs text-white/45">
            Copyright {new Date().getFullYear()} Vortixy Colombia. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <PaymentLogos variant="dark" size="sm" />
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/68 transition-all duration-200 hover:bg-white/15 lg:hidden"
              aria-label="Volver arriba"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
