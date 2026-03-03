import Link from "next/link";
import { Shield, CreditCard, Lock, Mail, Phone, MapPin } from "lucide-react";
import { PaymentLogos } from "./PaymentLogos";

const footerLinks = {
  shop: [
    { label: "Cocina", href: "/categoria/cocina" },
    { label: "Tecnología", href: "/categoria/tecnologia" },
    { label: "Hogar", href: "/categoria/hogar" },
    { label: "Belleza", href: "/categoria/belleza" },
    { label: "Fitness", href: "/categoria/fitness" },
  ],
  help: [
    { label: "Seguir mi pedido", href: "/seguimiento" },
    { label: "Política de envíos", href: "/envios" },
    { label: "Devoluciones", href: "/devoluciones" },
    { label: "Preguntas frecuentes", href: "/faq" },
  ],
  legal: [
    { label: "Términos y condiciones", href: "/terminos" },
    { label: "Política de privacidad", href: "/privacidad" },
    { label: "Política de cookies", href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-400">
      {/* Trust Banner */}
      <div className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, text: "Garantía AllShop" },
              { icon: CreditCard, text: "Pagos Seguros" },
              { icon: Lock, text: "SSL Certificado" },
              { icon: Phone, text: "Soporte 24/7" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-neutral-500" />
                <span className="text-sm font-medium text-neutral-300">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-neutral-900 font-bold text-sm">A</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">AllShop</span>
            </div>
            <p className="text-sm text-neutral-500 mb-4 max-w-xs">
              Tu tienda de confianza en Colombia. Productos seleccionados con garantía local y envío protegido.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>soporte@allshop.co</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+57 300 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Bogotá, Colombia</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {title === "shop" ? "Categorías" : title === "help" ? "Ayuda" : "Legal"}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-500 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-neutral-600">
              © {new Date().getFullYear()} AllShop Colombia. Todos los derechos reservados.
            </p>
            <PaymentLogos variant="light" size="sm" />
          </div>
        </div>
      </div>
    </footer>
  );
}
