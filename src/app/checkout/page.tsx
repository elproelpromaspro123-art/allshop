"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  Lock,
  Package,
  Loader2,
  ShieldCheck,
  Waypoints,
  Clock3,
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
import {
  calculateNationalShippingCost,
  hasOnlyFreeShippingProducts,
} from "@/lib/shipping";
import { COLOMBIA_DEPARTMENTS } from "@/lib/delivery";

interface DeliveryEstimate {
  department: string;
  carrier: {
    code: string;
    name: string;
    insured: boolean;
  };
  availableCarriers: Array<{
    code: string;
    name: string;
    insured: boolean;
  }>;
  minBusinessDays: number;
  maxBusinessDays: number;
  formattedRange: string;
  cutOffApplied: boolean;
}

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
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(true);
  const [deliveryEstimate, setDeliveryEstimate] = useState<DeliveryEstimate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    address: "",
    reference: "",
    city: "",
    department: "",
    zip: "",
  });
  const [confirmations, setConfirmations] = useState({
    addressConfirmed: false,
    availabilityConfirmed: false,
    productAcknowledged: false,
  });

  const subtotal = getTotal();
  const hasOnlyFreeShipping = hasOnlyFreeShippingProducts(
    items.map((item) => ({
      id: item.productId,
      freeShipping: item.freeShipping ?? null,
    }))
  );
  const shippingCost = calculateNationalShippingCost({
    hasOnlyFreeShippingProducts: hasOnlyFreeShipping,
  });
  const total = subtotal + shippingCost;
  const shippingType = "nacional";

  const trustItems = useMemo(
    () => [
      { Icon: ShieldCheck, text: t("checkout.securePayment") },
      { Icon: Waypoints, text: t("checkout.trackingIncluded") },
    ],
    [t]
  );

  useEffect(() => {
    let cancelled = false;
    const department = formData.department || "Bogota D.C.";

    const loadEstimate = async () => {
      setIsLoadingEstimate(true);
      try {
        const response = await fetch(
          `/api/delivery/estimate?department=${encodeURIComponent(department)}`
        );
        const data = (await response.json()) as { estimate?: DeliveryEstimate };

        if (cancelled) return;

        if (data.estimate) {
          setDeliveryEstimate(data.estimate);
        }
      } catch {
        if (!cancelled) {
          setDeliveryEstimate(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEstimate(false);
        }
      }
    };

    void loadEstimate();

    return () => {
      cancelled = true;
    };
  }, [formData.department]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const handleCheckout = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.document ||
      !formData.address ||
      !formData.reference ||
      !formData.city ||
      !formData.department
    ) {
      alert(t("checkout.requiredFields"));
      return;
    }

    if (
      !confirmations.addressConfirmed ||
      !confirmations.availabilityConfirmed ||
      !confirmations.productAcknowledged
    ) {
      alert(
        "Debes confirmar dirección, disponibilidad de recepción y tipo de producto para continuar."
      );
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
            reference: formData.reference,
            city: formData.city,
            department: formData.department,
            zip: formData.zip,
            type: shippingType,
            cost: shippingCost,
            carrier_code: deliveryEstimate?.carrier.code || null,
            carrier_name: deliveryEstimate?.carrier.name || null,
            insured: deliveryEstimate?.carrier.insured || false,
            eta_min_days: deliveryEstimate?.minBusinessDays || null,
            eta_max_days: deliveryEstimate?.maxBusinessDays || null,
            eta_range: deliveryEstimate?.formattedRange || null,
          },
          verification: {
            address_confirmed: confirmations.addressConfirmed,
            availability_confirmed: confirmations.availabilityConfirmed,
            product_acknowledged: confirmations.productAcknowledged,
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

      if (!response.ok) {
        alert(data.error || t("checkout.paymentError"));
        return;
      }

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }

      if (data.order_id) {
        const tokenQuery = data.order_token
          ? `&order_token=${encodeURIComponent(data.order_token)}`
          : "";
        window.location.href = `/orden/confirmacion?order_id=${encodeURIComponent(
          data.order_id
        )}${tokenQuery}`;
        return;
      }

      alert(t("checkout.paymentError"));
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
          isDark ? "bg-[#0a0b0f]" : "bg-[var(--background)]"
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
          <p className="text-neutral-500 mb-6 text-sm">{t("checkout.emptySubtitle")}</p>
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
    <div className={cn("min-h-screen", isDark ? "bg-[#0a0b0f]" : "bg-[var(--background)]")}>
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
            <motion.div
              className={cn(
                "rounded-2xl border p-5 sm:p-6",
                isDark ? "bg-[var(--surface)] border-white/[0.06]" : "bg-white border-[var(--border)]"
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
                  <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-neutral-300" : "text-neutral-700")}>
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
                  <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-neutral-300" : "text-neutral-700")}>
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
                  <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-neutral-300" : "text-neutral-700")}>
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
                  <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-neutral-300" : "text-neutral-700")}>
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

            <motion.div
              className={cn(
                "rounded-2xl border p-5 sm:p-6",
                isDark ? "bg-[var(--surface)] border-white/[0.06]" : "bg-white border-[var(--border)]"
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
                  <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-neutral-300" : "text-neutral-700")}>
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
                <div className="sm:col-span-2">
                  <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-neutral-300" : "text-neutral-700")}>
                    Referencia de dirección (barrio, apartamento o punto clave) *
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    placeholder="Ejemplo: Barrio Cedritos, Torre 2 apto 503, portería blanca"
                    className={inputCls(isDark)}
                  />
                </div>
                <div>
                  <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-neutral-300" : "text-neutral-700")}>
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
                  <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-neutral-300" : "text-neutral-700")}>
                    {t("checkout.department")} *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={inputCls(isDark)}
                  >
                    <option value="">{t("checkout.select")}</option>
                    {COLOMBIA_DEPARTMENTS.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-neutral-300" : "text-neutral-700")}>
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

              <div
                className={cn(
                  "mt-4 rounded-xl border p-3 text-sm",
                  isDark ? "border-white/[0.08] bg-white/[0.02] text-neutral-300" : "border-[var(--border)] bg-[var(--surface-muted)] text-neutral-600"
                )}
              >
                <p className="flex items-center gap-1.5">
                  <Clock3 className="w-4 h-4 text-[var(--accent-strong)]" />
                  <span className="text-neutral-500">Entrega estimada:</span>
                  {isLoadingEstimate ? (
                    <span className="text-neutral-500">Calculando...</span>
                  ) : deliveryEstimate ? (
                    <span className="font-semibold text-[var(--accent-strong)]">
                      {deliveryEstimate.minBusinessDays} a {deliveryEstimate.maxBusinessDays} días hábiles
                    </span>
                  ) : (
                    <span className="text-neutral-500">No disponible por ahora</span>
                  )}
                </p>
              </div>

              <div
                className={cn(
                  "mt-3 rounded-xl border p-3 space-y-2.5 text-sm",
                  isDark
                    ? "border-white/[0.08] bg-white/[0.02]"
                    : "border-[var(--border)] bg-[var(--surface-muted)]"
                )}
              >
                <label className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[var(--accent-strong)]"
                    checked={confirmations.addressConfirmed}
                    onChange={(event) =>
                      setConfirmations((prev) => ({
                        ...prev,
                        addressConfirmed: event.target.checked,
                      }))
                    }
                  />
                  <span className={cn(isDark ? "text-neutral-300" : "text-neutral-700")}>
                    Confirmo que mi dirección y referencia están completas y correctas.
                  </span>
                </label>
                <label className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[var(--accent-strong)]"
                    checked={confirmations.availabilityConfirmed}
                    onChange={(event) =>
                      setConfirmations((prev) => ({
                        ...prev,
                        availabilityConfirmed: event.target.checked,
                      }))
                    }
                  />
                  <span className={cn(isDark ? "text-neutral-300" : "text-neutral-700")}>
                    Confirmo que habrá una persona para recibir el pedido y responder llamada de entrega.
                  </span>
                </label>
                <label className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[var(--accent-strong)]"
                    checked={confirmations.productAcknowledged}
                    onChange={(event) =>
                      setConfirmations((prev) => ({
                        ...prev,
                        productAcknowledged: event.target.checked,
                      }))
                    }
                  />
                  <span className={cn(isDark ? "text-neutral-300" : "text-neutral-700")}>
                    Entiendo que el producto Stanley publicado es una réplica Triple A (no original).
                  </span>
                </label>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-2">
            <motion.div
              className={cn(
                "rounded-2xl border p-5 sm:p-6 lg:sticky lg:top-24",
                isDark ? "bg-[var(--surface)] border-white/[0.06]" : "bg-white border-[var(--border)]"
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
                  <div key={`${item.productId}-${item.variant}`} className="flex gap-3">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-xl shrink-0 overflow-hidden relative flex items-center justify-center",
                        isDark ? "bg-white/[0.04]" : "bg-[var(--surface-muted)]"
                      )}
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain p-1.5"
                          sizes="56px"
                          quality={100}
                          unoptimized
                        />
                      ) : (
                        <Package className="w-5 h-5 text-neutral-400/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold truncate", isDark ? "text-white" : "text-[var(--foreground)]")}>
                        {item.name}
                      </p>
                      {item.variant && <p className="text-xs text-neutral-500">{item.variant}</p>}
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.productId, item.variant, item.quantity - 1)}
                            className={cn(
                              "w-6 h-6 flex items-center justify-center rounded-md border transition-colors",
                              isDark
                                ? "border-white/[0.1] hover:bg-white/[0.05] text-neutral-300"
                                : "border-[var(--border)] hover:bg-[var(--surface-muted)]"
                            )}
                            type="button"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                            className={cn(
                              "w-6 h-6 flex items-center justify-center rounded-md border transition-colors",
                              isDark
                                ? "border-white/[0.1] hover:bg-white/[0.05] text-neutral-300"
                                : "border-[var(--border)] hover:bg-[var(--surface-muted)]"
                            )}
                            type="button"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-semibold", isDark ? "text-white" : "text-[var(--foreground)]")}>
                            {formatDisplayPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeItem(item.productId, item.variant)}
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                            type="button"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <ShippingBadge stockLocation={shippingType} compact className="mb-4" />

              <div className={cn("border-t pt-4 space-y-2", isDark ? "border-white/[0.06]" : "border-[var(--border)]")}>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">{t("checkout.subtotal")}</span>
                  <span className={cn("font-medium", isDark ? "text-white" : "text-[var(--foreground)]")}>
                    {formatDisplayPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">{t("checkout.shipping")}</span>
                  <span className={cn("font-medium", shippingCost === 0 && "text-[var(--accent-strong)]")}>
                    {shippingCost === 0 ? t("checkout.free") : formatDisplayPrice(shippingCost)}
                  </span>
                </div>
                {hasOnlyFreeShipping && (
                  <p className="text-xs text-[var(--accent-strong)]">
                    Envio gratis aplicado por producto.
                  </p>
                )}
                <div
                  className={cn(
                    "flex justify-between text-base font-bold pt-3 border-t",
                    isDark ? "border-white/[0.06] text-white" : "border-[var(--border)]"
                  )}
                >
                  <span>{t("checkout.total")}</span>
                  <span>{formatDisplayPrice(total)}</span>
                </div>
                {isDisplayDifferentFromPayment && (
                  <div className="text-right text-xs text-neutral-500 pt-1">{formatPaymentPrice(total)}</div>
                )}
              </div>

              <Button size="lg" className="w-full mt-5 gap-2" onClick={handleCheckout} disabled={isLoading}>
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
                  <div key={item.text} className="flex items-center gap-2 text-xs text-neutral-500">
                    <item.Icon className="w-4 h-4 text-[var(--accent-strong)] shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <div className={cn("mt-4 pt-4 border-t", isDark ? "border-white/[0.06]" : "border-[var(--border)]")}>
                <PaymentLogos variant={isDark ? "light" : "dark"} size="sm" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
