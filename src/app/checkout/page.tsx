"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  Lock,
  Loader2,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import { normalizeProductSlug } from "@/lib/legacy-product-slugs";
import { CheckoutShippingForm } from "@/components/checkout/CheckoutShippingForm";
import { CheckoutConfirmations } from "@/components/checkout/CheckoutConfirmations";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { CheckoutMobileStickyBar } from "@/components/checkout/CheckoutMobileStickyBar";
import { validateField, validateAllFields, type CheckoutFormData } from "@/lib/validation";

import {
  calculateNationalShippingCost,
  hasOnlyFreeShippingProducts,
} from "@/lib/shipping";

interface DeliveryEstimate {
  department: string;
  city: string | null;
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
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  confidence?: "high" | "medium";
  cutOffApplied: boolean;
}

const inputCls = () =>
  cn(
    "w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow",
    "border-[var(--border)] bg-white"
  );

export default function CheckoutPage() {
  const items = useCartStore((store) => store.items);
  const hasHydrated = useCartStore((store) => store.hasHydrated);
  const removeItem = useCartStore((store) => store.removeItem);
  const updateQuantity = useCartStore((store) => store.updateQuantity);
  const getTotal = useCartStore((store) => store.getTotal);
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
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const formErrorRef = useRef<HTMLDivElement>(null);
  const checkoutIdempotencyKeyRef = useRef<string | null>(null);
  const csrfTokenRef = useRef<string | null>(null);

  const subtotal = getTotal();
  const hasOnlyFreeShipping = hasOnlyFreeShippingProducts(
    items.map((item) => ({
      id: item.productId,
      freeShipping: item.freeShipping ?? null,
    }))
  );

  const maxCustomShippingCost = items.reduce((max, item) => {
    if (item.freeShipping) return max;
    return item.shippingCost !== undefined && item.shippingCost !== null 
      ? Math.max(max, item.shippingCost)
      : max;
  }, -1);
  
  const baseShippingCost = maxCustomShippingCost >= 0 ? maxCustomShippingCost : undefined;

  const shippingCost = calculateNationalShippingCost({
    hasOnlyFreeShippingProducts: hasOnlyFreeShipping,
    baseShippingCost: baseShippingCost,
  });
  const total = subtotal + shippingCost;
  const shippingType = "nacional";

  useEffect(() => {
    let cancelled = false;

    const detectDepartment = async () => {
      if (formData.department) return;

      try {
        const response = await fetch("/api/delivery/estimate?auto=1", {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          location?: { department?: string | null };
          estimate?: DeliveryEstimate;
        };
        if (cancelled) return;

        const autoDepartment = String(
          data.location?.department || data.estimate?.department || ""
        ).trim();
        if (!autoDepartment) return;

        setFormData((previous) =>
          previous.department ? previous : { ...previous, department: autoDepartment }
        );
      } catch {
        // User can select the department manually if detection fails.
      }
    };

    void detectDepartment();

    return () => {
      cancelled = true;
    };
  }, [formData.department]);

  useEffect(() => {
    let cancelled = false;
    const department = formData.department || "Bogota D.C.";

    const loadEstimate = async () => {
      setIsLoadingEstimate(true);
      try {
        const response = await fetch(
          `/api/delivery/estimate?department=${encodeURIComponent(department)}`,
          { cache: "no-store" }
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
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (fieldErrors[name]) {
      startTransition(() => {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      });
    }
  };

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      startTransition(() => {
        setTouchedFields((prev) => new Set(prev).add(name));
        const error = validateField(name as keyof CheckoutFormData, value);
        setFieldErrors((prev) => {
          if (error) return { ...prev, [name]: error };
          const next = { ...prev };
          delete next[name];
          return next;
        });
      });
    },
    []
  );

  const handleCheckout = async () => {
    setFormError(null);

    // Validate all fields at once
    const allErrors = validateAllFields(formData);
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      setTouchedFields(new Set(Object.keys(allErrors)));
      setFormError(t("checkout.requiredFields"));
      formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!confirmations.addressConfirmed) {
      setFormError(
        "Debes confirmar que tus datos y dirección son correctos para continuar."
      );
      formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsLoading(true);
    try {
      if (!checkoutIdempotencyKeyRef.current) {
        checkoutIdempotencyKeyRef.current =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      }

      // Fetch CSRF token if not already fetched
      if (!csrfTokenRef.current) {
        try {
          const csrfRes = await fetch("/api/internal/csrf");
          const csrfData = await csrfRes.json();
          csrfTokenRef.current = csrfData.csrfToken || null;
        } catch {
          // Continue without CSRF token in dev, will fail in prod
        }
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": checkoutIdempotencyKeyRef.current,
          ...(csrfTokenRef.current ? { "x-csrf-token": csrfTokenRef.current } : {}),
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.productId,
            slug: normalizeProductSlug(item.slug || null),
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
        setFormError(data.error || t("checkout.paymentError"));
        formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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

      setFormError(t("checkout.paymentError"));
      formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {
      setFormError(t("checkout.connectionError"));
      formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasHydrated) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          "bg-[var(--background)]"
        )}
      >
        <div className="text-center px-4 py-24">
          <Loader2 className="w-7 h-7 text-[var(--accent-strong)] animate-spin mx-auto mb-4" />
          <p className={cn("text-sm", "text-neutral-500")}>
            Cargando carrito...
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          "bg-[var(--background)]"
        )}
      >
        <div className="text-center px-4 py-24">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5",
              "bg-[var(--surface-muted)]"
            )}
          >
            <ShoppingBag className="w-7 h-7 text-neutral-400" />
          </div>
          <h1
            className={cn(
              "text-xl font-bold mb-2",
              "text-[var(--foreground)]"
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
    <div className={cn("min-h-screen", "bg-[var(--background)]")}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <Link
              href="/"
              className={cn(
                "text-sm flex items-center gap-1.5 mb-2 transition-colors",
                "text-neutral-500 hover:text-[var(--foreground)]"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              {t("checkout.continueShopping")}
            </Link>
            <h1
              className={cn(
                "text-xl sm:text-2xl font-bold",
                "text-[var(--foreground)]"
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

        {formError && (
          <div
            ref={formErrorRef}
            className={cn(
              "rounded-xl border p-4 flex items-start gap-3 mb-6 sm:mb-8",
              "border-red-300 bg-red-50 text-red-900"
            )}
            role="alert"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">{formError}</p>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--accent-strong)] text-white">
              <ClipboardList className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-[var(--foreground)]">Datos de envío</span>
          </div>
          <div className="h-px flex-1 max-w-12 bg-[var(--border)]" />
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full",
              confirmations.addressConfirmed
                ? "bg-[var(--accent-strong)] text-white"
                : "border border-[var(--border)] bg-[var(--surface-muted)] text-neutral-400"
            )}>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className={cn(
              "text-sm font-semibold",
              confirmations.addressConfirmed ? "text-[var(--foreground)]" : "text-neutral-400"
            )}>Confirmar pedido</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
          <div className="lg:col-span-3 space-y-5">
            <div
              className={cn(
                "rounded-2xl border p-5 sm:p-6",
                "bg-white border-[var(--border)]"
              )}
            >
              <h2
                className={cn(
                  "text-base font-bold mb-4",
                  "text-[var(--foreground)]"
                )}
              >
                {t("checkout.contactInfo")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={cn("block text-sm font-medium mb-1.5", "text-neutral-700")}>
                    {t("checkout.fullName")} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t("checkout.fullNamePlaceholder")}
                    className={cn(inputCls(), touchedFields.has("name") && fieldErrors.name && "border-red-400 focus:ring-red-400")}
                  />
                  {touchedFields.has("name") && fieldErrors.name && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className={cn("block text-sm font-medium mb-1.5", "text-neutral-700")}>
                    {t("checkout.email")} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t("checkout.emailPlaceholder")}
                    className={cn(inputCls(), touchedFields.has("email") && fieldErrors.email && "border-red-400 focus:ring-red-400")}
                  />
                  {touchedFields.has("email") && fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className={cn("block text-sm font-medium mb-1.5", "text-neutral-700")}>
                    {t("checkout.phone")} *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t("checkout.phonePlaceholder")}
                    className={cn(inputCls(), touchedFields.has("phone") && fieldErrors.phone && "border-red-400 focus:ring-red-400")}
                  />
                  {touchedFields.has("phone") && fieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className={cn("block text-sm font-medium mb-1.5", "text-neutral-700")}>
                    {t("checkout.document")} *
                  </label>
                  <input
                    type="text"
                    name="document"
                    value={formData.document}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t("checkout.documentPlaceholder")}
                    className={cn(inputCls(), touchedFields.has("document") && fieldErrors.document && "border-red-400 focus:ring-red-400")}
                  />
                  {touchedFields.has("document") && fieldErrors.document && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.document}</p>
                  )}
                </div>
              </div>
            </div>

            <CheckoutShippingForm
              formData={formData}
              onChange={handleChange}
              onBlur={handleBlur}
              fieldErrors={fieldErrors}
              touchedFields={touchedFields}
              isLoadingEstimate={isLoadingEstimate}
              deliveryEstimate={deliveryEstimate}
            />

            <CheckoutConfirmations
              confirmations={confirmations}
              onChange={(field, checked) =>
                startTransition(() => setConfirmations((prev) => ({ ...prev, [field]: checked })))
              }
            />
          </div>

          <div className="lg:col-span-2">
            <CheckoutOrderSummary
              items={items}
              subtotal={subtotal}
              shippingCost={shippingCost}
              total={total}
              hasOnlyFreeShipping={hasOnlyFreeShipping}
              shippingType={shippingType}
              isLoading={isLoading}
              isDisplayDifferentFromPayment={isDisplayDifferentFromPayment}
              formatDisplayPrice={formatDisplayPrice}
              formatPaymentPrice={formatPaymentPrice}
              onCheckout={handleCheckout}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
            />
          </div>
        </div>
      </div>

      <CheckoutMobileStickyBar
        total={formatDisplayPrice(total)}
        isLoading={isLoading}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
