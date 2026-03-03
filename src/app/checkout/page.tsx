"use client";

import { useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ShippingBadge } from "@/components/ShippingBadge";
import { PaymentLogos } from "@/components/PaymentLogos";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import { useTheme } from "@/providers/ThemeProvider";

const COLOMBIA_DEPARTMENTS = [
  "Amazonas", "Antioquia", "Arauca", "Atlantico", "Bolivar", "Boyaca",
  "Caldas", "Caqueta", "Casanare", "Cauca", "Cesar", "Choco",
  "Cordoba", "Cundinamarca", "Guainia", "Guaviare", "Huila",
  "La Guajira", "Magdalena", "Meta", "Narino", "Norte de Santander",
  "Putumayo", "Quindio", "Risaralda", "San Andres", "Santander",
  "Sucre", "Tolima", "Valle del Cauca", "Vaupes", "Vichada", "Bogota D.C.",
];

const inputCls = (isDark: boolean) =>
  cn(
    "w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow",
    isDark
      ? "border-white/[0.1] bg-[var(--surface)] text-white placeholder:text-neutral-600"
      : "border-[var(--border)] bg-white"
  );

export default function CheckoutPage() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const { t } = useLanguage();
  const {
    currency,
    locale,
    countryCode,
    rateToDisplay,
    isDisplayDifferentFromPayment,
    formatDisplayPrice,
    formatPaymentPrice,
  } = usePricing();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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

  const trustItems = useMemo(
    () => [
      { icon: Shield, text: t("checkout.securePayment") },
      { icon: Truck, text: t("checkout.trackingIncluded") },
    ],
    [t]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckout = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.document ||
      !formData.address ||
      !formData.city ||
      !formData.department
    ) {
      alert(t("checkout.requiredFields"));
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
            picture_url: item.image,
            variant: item.variant,
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
          pricing: {
            display_currency: currency,
            display_locale: locale,
            country_code: countryCode,
            display_rate: rateToDisplay,
          },
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else if (data.sandbox_init_point) {
        window.location.href = data.sandbox_init_point;
      } else {
        alert(t("checkout.paymentError"));
      }
    } catch {
      alert(t("checkout.connectionError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          isDark ? "bg-[#090d14]" : "bg-[var(--background)]"
        )}
      >
        <div className="text-center px-4 py-24">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5",
              isDark ? "bg-white/[0.05]" : "bg-[var(--surface-muted)]"
            )}
          >
            <ShoppingBag className="w-7 h-7 text-neutral-400" />
          </div>
          <h1
            className={cn(
              "text-xl font-bold mb-2",
              isDark ? "text-white" : "text-[var(--foreground)]"
            )}
          >
            {t("checkout.emptyTitle")}
          </h1>
          <p className="text-neutral-500 mb-6 text-sm">
            {t("checkout.emptySubtitle")}
          </p>
          <Link href="/">
            <Button className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("checkout.continueShopping")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen",
        isDark ? "bg-[#090d14]" : "bg-[var(--background)]"
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <Link
              href="/"
              className={cn(
                "text-sm flex items-center gap-1.5 mb-2 transition-colors",
                isDark
                  ? "text-neutral-500 hover:text-white"
                  : "text-neutral-500 hover:text-[var(--foreground)]"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              {t("checkout.continueShopping")}
            </Link>
            <h1
              className={cn(
                "text-xl sm:text-2xl font-bold",
                isDark ? "text-white" : "text-[var(--foreground)]"
              )}
            >
              {t("checkout.title")}
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-neutral-500">
            <Lock className="w-4 h-4" />
            <span>{t("checkout.secureConnection")}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
          <div className="lg:col-span-3 space-y-5">
            {/* Contact info */}
            <motion.div
              className={cn(
                "rounded-2xl border p-5 sm:p-6",
                isDark
                  ? "bg-[var(--surface)] border-white/[0.06]"
                  : "bg-white border-[var(--border)]"
              )}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2
                className={cn(
                  "text-base font-bold mb-4",
                  isDark ? "text-white" : "text-[var(--foreground)]"
                )}
              >
                {t("checkout.contactInfo")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label
                    className={cn(
                      "block text-sm font-medium mb-1.5",
                      isDark ? "text-neutral-300" : "text-neutral-700"
                    )}
                  >
                    {t("checkout.fullName")} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("checkout.fullNamePlaceholder")}
                    className={inputCls(isDark)}
                  />
                </div>
                <div>
                  <label
                    className={cn(
                      "block text-sm font-medium mb-1.5",
                      isDark ? "text-neutral-300" : "text-neutral-700"
                    )}
                  >
                    {t("checkout.email")} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("checkout.emailPlaceholder")}
                    className={inputCls(isDark)}
                  />
                </div>
                <div>
                  <label
                    className={cn(
                      "block text-sm font-medium mb-1.5",
                      isDark ? "text-neutral-300" : "text-neutral-700"
                    )}
                  >
                    {t("checkout.phone")} *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("checkout.phonePlaceholder")}
                    className={inputCls(isDark)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    className={cn(
                      "block text-sm font-medium mb-1.5",
                      isDark ? "text-neutral-300" : "text-neutral-700"
                    )}
                  >
                    {t("checkout.document")} *
                  </label>
                  <input
                    type="text"
                    name="document"
                    value={formData.document}
                    onChange={handleChange}
                    placeholder={t("checkout.documentPlaceholder")}
                    className={inputCls(isDark)}
                  />
                </div>
              </div>
            </motion.div>

            {/* Shipping address */}
            <motion.div
              className={cn(
                "rounded-2xl border p-5 sm:p-6",
                isDark
                  ? "bg-[var(--surface)] border-white/[0.06]"
                  : "bg-white border-[var(--border)]"
              )}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <h2
                className={cn(
                  "text-base font-bold mb-4",
                  isDark ? "text-white" : "text-[var(--foreground)]"
                )}
              >
                {t("checkout.shippingAddress")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label
                    className={cn(
                      "block text-sm font-medium mb-1.5",
                      isDark ? "text-neutral-300" : "text-neutral-700"
                    )}
                  >
                    {t("checkout.address")} *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={t("checkout.addressPlaceholder")}
                    className={inputCls(isDark)}
                  />
                </div>
                <div>
                  <label
                    className={cn(
                      "block text-sm font-medium mb-1.5",
                      isDark ? "text-neutral-300" : "text-neutral-700"
                    )}
                  >
                    {t("checkout.city")} *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder={t("checkout.cityPlaceholder")}
                    className={inputCls(isDark)}
                  />
                </div>
                <div>
                  <label
                    className={cn(
                      "block text-sm font-medium mb-1.5",
                      isDark ? "text-neutral-300" : "text-neutral-700"
                    )}
                  >
                    {t("checkout.department")} *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={inputCls(isDark)}
                  >
                    <option value="">{t("checkout.select")}</option>
                    {COLOMBIA_DEPARTMENTS.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={cn(
                      "block text-sm font-medium mb-1.5",
                      isDark ? "text-neutral-300" : "text-neutral-700"
                    )}
                  >
                    {t("checkout.zipCode")}
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    placeholder={t("checkout.zipPlaceholder")}
                    className={inputCls(isDark)}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-2">
            <motion.div
              className={cn(
                "rounded-2xl border p-5 sm:p-6 lg:sticky lg:top-24",
                isDark
                  ? "bg-[var(--surface)] border-white/[0.06]"
                  : "bg-white border-[var(--border)]"
              )}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2
                className={cn(
                  "text-base font-bold mb-4",
                  isDark ? "text-white" : "text-[var(--foreground)]"
                )}
              >
                {t("checkout.orderSummary")}
              </h2>

              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variant}`}
                    className="flex gap-3"
                  >
                    <div
                      className={cn(
                        "w-14 h-14 rounded-xl shrink-0 flex items-center justify-center",
                        isDark
                          ? "bg-white/[0.04]"
                          : "bg-[var(--surface-muted)]"
                      )}
                    >
                      <Package className="w-5 h-5 text-neutral-400/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-semibold truncate",
                          isDark ? "text-white" : "text-[var(--foreground)]"
                        )}
                      >
                        {item.name}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-neutral-500">
                          {item.variant}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.variant,
                                item.quantity - 1
                              )
                            }
                            className={cn(
                              "w-6 h-6 flex items-center justify-center rounded-md border transition-colors",
                              isDark
                                ? "border-white/[0.1] hover:bg-white/[0.05] text-neutral-300"
                                : "border-[var(--border)] hover:bg-[var(--surface-muted)]"
                            )}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-medium">
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
                            className={cn(
                              "w-6 h-6 flex items-center justify-center rounded-md border transition-colors",
                              isDark
                                ? "border-white/[0.1] hover:bg-white/[0.05] text-neutral-300"
                                : "border-[var(--border)] hover:bg-[var(--surface-muted)]"
                            )}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              isDark ? "text-white" : "text-[var(--foreground)]"
                            )}
                          >
                            {formatDisplayPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() =>
                              removeItem(item.productId, item.variant)
                            }
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <ShippingBadge
                stockLocation={shippingType}
                compact
                className="mb-4"
              />

              <div
                className={cn(
                  "border-t pt-4 space-y-2",
                  isDark ? "border-white/[0.06]" : "border-[var(--border)]"
                )}
              >
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">
                    {t("checkout.subtotal")}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      isDark ? "text-white" : "text-[var(--foreground)]"
                    )}
                  >
                    {formatDisplayPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">
                    {t("checkout.shipping")}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      shippingCost === 0 && "text-[var(--accent-dim)]"
                    )}
                  >
                    {shippingCost === 0
                      ? t("checkout.free")
                      : formatDisplayPrice(shippingCost)}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-[var(--accent-dim)]">
                    {t("checkout.addMoreForFreeShipping")}{" "}
                    {formatDisplayPrice(99900 - subtotal)}
                  </p>
                )}
                <div
                  className={cn(
                    "flex justify-between text-base font-bold pt-3 border-t",
                    isDark
                      ? "border-white/[0.06] text-white"
                      : "border-[var(--border)]"
                  )}
                >
                  <span>{t("checkout.total")}</span>
                  <span>{formatDisplayPrice(total)}</span>
                </div>
                {isDisplayDifferentFromPayment && (
                  <div className="text-right text-xs text-neutral-500 pt-1">
                    {formatPaymentPrice(total)}
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="w-full mt-5 gap-2"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("checkout.processing")}
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {t("checkout.pay")} {formatPaymentPrice(total)}
                  </>
                )}
              </Button>

              <div className="mt-4 space-y-2">
                {trustItems.map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2 text-xs text-neutral-500"
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <div
                className={cn(
                  "mt-4 pt-4 border-t",
                  isDark ? "border-white/[0.06]" : "border-[var(--border)]"
                )}
              >
                <PaymentLogos
                  variant={isDark ? "light" : "dark"}
                  size="sm"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
