"use client";

import Link from "next/link";

const footerLinks = {
  tienda: [
    { href: "/categoria/cocina", label: "Cocina" },
    { href: "/categoria/tecnologia", label: "Tecnología" },
    { href: "/categoria/hogar", label: "Hogar" },
    { href: "/categoria/belleza", label: "Belleza" },
    { href: "/categoria/fitness", label: "Fitness" },
  ],
  ayuda: [
    { href: "/seguimiento", label: "Rastrear pedido" },
    { href: "/faq", label: "Preguntas frecuentes" },
    { href: "/soporte", label: "Contacto" },
    { href: "/envios", label: "Envíos" },
    { href: "/devoluciones", label: "Devoluciones" },
  ],
  legal: [
    { href: "/terminos", label: "Términos y condiciones" },
    { href: "/privacidad", label: "Política de privacidad" },
    { href: "/cookies", label: "Cookies" },
  ],
};

export function StorefrontFooter() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md">
                <span className="text-xs font-black tracking-widest text-white">V</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-gray-900">Vortixy</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
              Tu tienda online en Colombia. Envío nacional, pago contra entrega y soporte directo.
            </p>
            <p className="mt-4 text-xs text-gray-400">
              vortixyoficial@gmail.com
            </p>
          </div>

          {/* Tienda */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-gray-900">
              Tienda
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.tienda.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-emerald-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-gray-900">
              Ayuda
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.ayuda.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-emerald-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-gray-900">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-emerald-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Vortixy. Todos los derechos reservados. Cúcuta, Colombia.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Pago contra entrega</span>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <span>Envío nacional</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
