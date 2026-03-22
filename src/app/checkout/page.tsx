"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  Lock,
  Loader2,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import { normalizeProductSlug } from "@/lib/legacy-product-slugs";
import { CheckoutShippingForm } from "@/components/checkout/CheckoutShippingForm";
import { CheckoutConfirmations } from "@/components/checkout/CheckoutConfirmations";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { CheckoutMobileStickyBar } from "@/components/checkout/CheckoutMobileStickyBar";
import {
  validateField,
  validateAllFields,
  type CheckoutFormData,
} from "@/lib/validation";

import {
  calculateNationalShippingCost,
  hasOnlyFreeShippingProducts,
} from "@/lib/shipping";
import { fetchWithCsrf, isCsrfClientError } from "@/lib/csrf-client";

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

export default function CheckoutPage() {
  const items = useCartStore((store) => store.items);
  const hasHydrated = useCartStore((store) => store.hasHydrated);
  const removeItem = useCartStore((store) => store.removeItem);
  const updateQuantity = useCartStore((store) => store.updateQuantity);
  const clearCart = useCartStore((store) => store.clearCart);
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
  const [deliveryEstimate, setDeliveryEstimate] =
    useState<DeliveryEstimate | null>(null);
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

  const subtotal = getTotal();
  const hasOnlyFreeShipping = hasOnlyFreeShippingProducts(
    items.map((item) => ({
      id: item.productId,
      freeShipping: item.freeShipping ?? null,
    })),
  );

  const maxCustomShippingCost = items.reduce((max, item) => {
    if (item.freeShipping) return max;
    return item.shippingCost !== undefined && item.shippingCost !== null
      ? Math.max(max, item.shippingCost)
      : max;
  }, -1);

  const baseShippingCost =
    maxCustomShippingCost >= 0 ? maxCustomShippingCost : undefined;

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
          data.location?.department || data.estimate?.department || "",
        ).trim();
        if (!autoDepartment) return;

        setFormData((previous) =>
          previous.department
            ? previous
            : { ...previous, department: autoDepartment },
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
          { cache: "no-store" },
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
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
    [],
  );

  const handleCheckout = async () => {
    if (isLoading) return;
    setFormError(null);

    // Validate all fields at once
    const allErrors = validateAllFields(formData);
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      setTouchedFields(new Set(Object.keys(allErrors)));
      setFormError(t("checkout.requiredFields"));
      formErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      requestAnimationFrame(() => {
        const firstField = Object.keys(allErrors)[0];
        const el = document.querySelector<HTMLElement>(`[name="${firstField}"]`);
        el?.focus();
      });
      return;
    }

    if (!confirmations.addressConfirmed) {
      setFormError(t("checkout.confirmAddressRequired"));
      formErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
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

      const response = await fetchWithCsrf("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": checkoutIdempotencyKeyRef.current,
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
        // If server returned a different total, show it to the user so they see the real price
        if (data.error && data.server_total && data.server_total !== total) {
          setFormError(
            `${data.error} (El total calculado por el servidor es diferente: ${formatPaymentPrice(data.server_total)})`,
          );
        } else {
          setFormError(data.error || t("checkout.paymentError"));
        }
        formErrorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      if (data.redirect_url) {
        clearCart();
        window.location.href = data.redirect_url;
        return;
      }

      if (data.order_id) {
        clearCart();
        const tokenQuery = data.order_token
          ? `&order_token=${encodeURIComponent(data.order_token)}`
          : "";
        window.location.href = `/orden/confirmacion?order_id=${encodeURIComponent(
          data.order_id,
        )}${tokenQuery}`;
        return;
      }

      setFormError(t("checkout.paymentError"));
      formErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } catch (error) {
      setFormError(
        isCsrfClientError(error)
          ? "Error de seguridad. Recarga la pagina e intenta nuevamente."
          : t("checkout.connectionError"),
      );
      formErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center px-4 py-24">
          <Loader2 className="w-7 h-7 text-[var(--accent-strong)] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--muted-soft)]">
            {t("checkout.loadingCart")}
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center px-4 py-24">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 bg-[var(--surface-muted)] ring-4 ring-[var(--border-subtle)]">
            <ShoppingBag className="h-14 w-14 mx-auto text-[var(--muted-faint)] mb-2" />
          </div>
          <h1 className="text-xl font-bold mb-2 text-[var(--foreground)]">
            {t("checkout.emptyTitle")}
          </h1>
          <p className="text-[var(--muted-soft)] mb-6 text-sm">
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
    <div className="min-h-screen pb-28 lg:pb-0 bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 panel-surface px-5 py-6 sm:mb-10 sm:px-6 sm:py-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-soft)] transition-colors hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("checkout.continueShopping")}
            </Link>
            <span className="panel-chip border-emerald-300/30 bg-emerald-50 text-emerald-800">
              <Lock className="h-3.5 w-3.5" />
              {t("checkout.secureConnection")}
            </span>
          </div>

          <PageHeader
            className="mt-5"
            eyebrow="Checkout"
            title={t("checkout.title")}
            description="Datos claros, validación visible y un resumen legible antes de confirmar."
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--radius-md)] border border-[var(--accent)]/18 bg-[var(--accent-surface)] px-4 py-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent-strong)]">
                <ClipboardList className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{t("checkout.shippingData")}</p>
              <p className="mt-1 text-xs leading-6 text-[var(--muted)]">{t("checkout.securePayment")}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-4 py-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--secondary-surface)] text-[var(--secondary-strong)]">
                <User className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{t("checkout.contactInfo")}</p>
              <p className="mt-1 text-xs leading-6 text-[var(--muted)]">Campos compactos, errores visibles y lectura más rápida en celular.</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-4 py-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{t("checkout.confirmOrder")}</p>
              <p className="mt-1 text-xs leading-6 text-[var(--muted)]">{t("checkout.codBadge")}</p>
            </div>
          </div>
        </div>

        {formError && (
          <div
            ref={formErrorRef}
            className="mb-6 flex items-start gap-3 rounded-[var(--radius-md)] border border-red-300 bg-red-50 px-4 py-4 text-red-900 sm:mb-8"
            role="alert"
            aria-live="polite"
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
              <span className="sr-only">{t("common.close")}</span>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-5 lg:gap-10">
          <div className="storefront-rhythm lg:col-span-3">
            <div
              id="checkout-contacto"
              className="panel-surface px-5 py-6 sm:px-7 sm:py-7"
            >
              <h2 className="mb-5 flex items-center gap-3 text-base font-bold text-[var(--foreground)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--secondary-surface)] text-[var(--secondary-strong)]">
                  <User className="h-4 w-4" />
                </div>
                {t("checkout.contactInfo")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t("checkout.fullNamePlaceholder")}
                    label={`${t("checkout.fullName")} *`}
                    autoComplete="name"
                    error={
                      touchedFields.has("name") ? fieldErrors.name : undefined
                    }
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t("checkout.emailPlaceholder")}
                    label={`${t("checkout.email")} *`}
                    autoComplete="email"
                    error={
                      touchedFields.has("email") ? fieldErrors.email : undefined
                    }
                  />
                </div>
                <div>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t("checkout.phonePlaceholder")}
                    label={`${t("checkout.phone")} *`}
                    autoComplete="tel"
                    error={
                      touchedFields.has("phone") ? fieldErrors.phone : undefined
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    type="text"
                    name="document"
                    value={formData.document}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t("checkout.documentPlaceholder")}
                    label={`${t("checkout.document")} *`}
                    autoComplete="off"
                    error={
                      touchedFields.has("document")
                        ? fieldErrors.document
                        : undefined
                    }
                  />
                </div>
              </div>
            </div>

            <div id="checkout-envio">
              <CheckoutShippingForm
                formData={formData}
                onChange={handleChange}
                onBlur={handleBlur}
                fieldErrors={fieldErrors}
                touchedFields={touchedFields}
                isLoadingEstimate={isLoadingEstimate}
                deliveryEstimate={deliveryEstimate}
              />
            </div>

            <div id="checkout-confirmaciones">
              <CheckoutConfirmations
                confirmations={confirmations}
                onChange={(field, checked) =>
                  startTransition(() =>
                    setConfirmations((prev) => ({ ...prev, [field]: checked })),
                  )
                }
              />
            </div>
          </div>

          <div id="checkout-resumen" className="lg:col-span-2">
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
