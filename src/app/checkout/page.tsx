"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  Shield,
  Lock,
  Truck,
  Package,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ShippingBadge } from "@/components/ShippingBadge";
import { PaymentLogos } from "@/components/PaymentLogos";
import { useCartStore } from "@/store/cart";

const COLOMBIA_DEPARTMENTS = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá",
  "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó",
  "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila",
  "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander",
  "Putumayo", "Quindío", "Risaralda", "San Andrés", "Santander",
  "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada", "Bogotá D.C.",
];

export default function CheckoutPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    address: "",
    city: "",
    department: "",
    zip: "",
  });

  const subtotal = getTotal();
  const shippingCost = subtotal >= 99900 ? 0 : 12900;
  const total = subtotal + shippingCost;
  const hasNacional = items.some(
    (i) => i.stockLocation === "nacional" || i.stockLocation === "ambos"
  );
  const shippingType = hasNacional ? "nacional" : "internacional";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckout = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.document || !formData.address || !formData.city || !formData.department) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.productId,
            title: item.name,
            quantity: item.quantity,
            unit_price: item.price,
          })),
          payer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            document: formData.document,
          },
          shipping: {
            address: formData.address,
            city: formData.city,
            department: formData.department,
            zip: formData.zip,
            type: shippingType,
            cost: shippingCost,
          },
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else if (data.sandbox_init_point) {
        window.location.href = data.sandbox_init_point;
      } else {
        alert("Error al procesar el pago. Intenta nuevamente.");
      }
    } catch {
      alert("Error de conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8 text-neutral-400" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-3">
          Tu carrito está vacío
        </h1>
        <p className="text-neutral-500 mb-8">
          Explora nuestros productos y encuentra algo que te encante.
        </p>
        <Link href="/">
          <Button size="lg">
            <ArrowLeft className="w-4 h-4" />
            Seguir comprando
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/"
              className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Seguir comprando
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              Checkout
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Lock className="w-4 h-4" />
            <span>Conexión segura</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Contact Info */}
            <motion.div
              className="bg-white rounded-2xl border border-neutral-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-lg font-bold text-neutral-900 mb-4">
                Información de contacto
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Tu nombre completo"
                    className="w-full h-11 px-4 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    className="w-full h-11 px-4 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="300 123 4567"
                    className="w-full h-11 px-4 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Cédula de ciudadanía *
                  </label>
                  <input
                    type="text"
                    name="document"
                    value={formData.document}
                    onChange={handleChange}
                    placeholder="1234567890"
                    className="w-full h-11 px-4 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
            </motion.div>

            {/* Shipping */}
            <motion.div
              className="bg-white rounded-2xl border border-neutral-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-lg font-bold text-neutral-900 mb-4">
                Dirección de envío
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Cra 7 #45-10 Apto 501"
                    className="w-full h-11 px-4 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Bogotá"
                    className="w-full h-11 px-4 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Departamento *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full h-11 px-4 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    {COLOMBIA_DEPARTMENTS.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Código postal
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    placeholder="110111"
                    className="w-full h-11 px-4 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <motion.div
              className="bg-white rounded-2xl border border-neutral-200 p-6 sticky top-24"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg font-bold text-neutral-900 mb-4">
                Resumen del pedido
              </h2>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variant}`}
                    className="flex gap-3"
                  >
                    <div className="w-16 h-16 bg-neutral-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                      <Package className="w-6 h-6 text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {item.name}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-neutral-500">{item.variant}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.variant,
                                item.quantity - 1
                              )
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.variant,
                                item.quantity + 1
                              )
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() =>
                              removeItem(item.productId, item.variant)
                            }
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Info */}
              <ShippingBadge stockLocation={shippingType} compact className="mb-4" />

              {/* Totals */}
              <div className="border-t border-neutral-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Envío</span>
                  <span className={cn("font-medium", shippingCost === 0 && "text-emerald-600")}>
                    {shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-emerald-600">
                    Agrega {formatPrice(99900 - subtotal)} más para envío gratis
                  </p>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-neutral-100">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Pay Button */}
              <Button
                size="xl"
                className="w-full mt-6"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Pagar {formatPrice(total)}
                  </>
                )}
              </Button>

              {/* Trust */}
              <div className="mt-4 space-y-2">
                {[
                  { icon: Shield, text: "Pago 100% seguro y protegido" },
                  { icon: Truck, text: "Rastreo incluido en todos los envíos" },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2 text-xs text-neutral-500"
                  >
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Payment Methods */}
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <PaymentLogos variant="dark" size="sm" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
