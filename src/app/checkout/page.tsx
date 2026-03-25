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
  validateCheckoutConfirmations,
  type CheckoutFormData,
} from "@/lib/validation";
import {
  calculateNationalShippingCost,
  hasOnlyFreeShippingProducts,
} from "@/lib/shipping";
import type {
  CheckoutBody,
  CheckoutErrorResponse,
  CheckoutSuccessResponse,
} from "@/lib/checkout-contract";
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
  const [isMounted, setIsMounted] = useState(false);
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
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const detectDepartment = async () => {
      if (formData.department) return;

      try {
        const response = await fetch("/api/delivery/estimate?auto=1", {
          cache: "no-store",
        });
        if (!response.ok) return;
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

        if (!response.ok) {
          if (!cancelled) setDeliveryEstimate(null);
          return;
        }

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

    const confirmationError = validateCheckoutConfirmations(confirmations);
    if (confirmationError) {
      setFormError(confirmationError);
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

      const payload: CheckoutBody = {
        items: items.map((item) => ({
          id: item.productId,
          slug: normalizeProductSlug(item.slug || null),
          quantity: item.quantity,
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
      };

      const response = await fetchWithCsrf("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": checkoutIdempotencyKeyRef.current,
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as
        | CheckoutSuccessResponse
        | CheckoutErrorResponse;

      if (!response.ok) {
        const errorData = data as CheckoutErrorResponse;

        if (
          errorData.field_errors &&
          Object.keys(errorData.field_errors).length > 0
        ) {
          setFieldErrors((previous) => ({
            ...previous,
            ...errorData.field_errors,
          }));
          setTouchedFields((previous) => {
            const next = new Set(previous);
            Object.keys(errorData.field_errors || {}).forEach((field) =>
              next.add(field),
            );
            return next;
          });
        }

        // If server returned a different total, show it to the user so they see the real price
        if (
          errorData.error &&
          errorData.server_total &&
          errorData.server_total !== total
        ) {
          setFormError(
            `${errorData.error} (El total calculado por el servidor es diferente: ${formatPaymentPrice(errorData.server_total)})`,
          );
        } else {
          setFormError(errorData.error || t("checkout.paymentError"));
        }
        formErrorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      const successData = data as CheckoutSuccessResponse;

      if (successData.redirect_url) {
        clearCart();
        window.location.href = successData.redirect_url;
        return;
      }

      if (successData.order_id) {
        clearCart();
        const tokenQuery = successData.order_token
          ? `&order_token=${encodeURIComponent(successData.order_token)}`
          : "";
        window.location.href = `/orden/confirmacion?order_id=${encodeURIComponent(
          successData.order_id,
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
          ? (error.message.includes("red") || error.message.includes("conexión")
            ? error.message
            : "Error de seguridad. Recarga la pagina e intenta nuevamente.")
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

  if (!isMounted || !hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4 py-24">
          <Loader2 className="w-7 h-7 text-emerald-700 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">
            {t("checkout.loadingCart")}
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-6 py-24 max-w-sm mx-auto">
          <div className="relative mx-auto mb-8 w-28 h-28">
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-2 rounded-full bg-emerald-500/10 animate-pulse" />
            <div className="relative flex items-center justify-center w-full h-full rounded-full bg-white shadow-md ring-1 ring-gray-100">
              <ShoppingBag className="h-10 w-10 text-emerald-500" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-3 text-gray-900">
            Tu carrito está vacío
          </h1>
          <p className="text-gray-400 mb-10 text-sm leading-relaxed">
            Parece que aún no has agregado ningún producto. Explora nuestro catálogo y descubre ofertas increíbles.
          </p>
          <Button
            asChild
            className="w-full h-12 gap-2 text-[15px] shadow-xl shadow-emerald-600/20 hover:shadow-2xl shadow-emerald-600/30 transition-all animate-[bounce_2s_infinite]"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Descubrir Productos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 lg:pb-0 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-6 sm:mb-10 sm:px-6 sm:py-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-900"
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
            description="Completa tu pedido en un solo paso seguro y rápido."
          />

          {/* Visual Step Indicator */}
          <div className="mt-8 mb-2 max-w-3xl border-b border-gray-100 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-4 ring-emerald-300">
                  <span className="text-sm font-bold">1</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">Detalles</span>
              </div>
              <div className="h-[2px] flex-1 bg-emerald-500/30 mx-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500 w-1/2 rounded-full" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-100 text-gray-400">
                  <span className="text-sm font-bold">2</span>
                </div>
                <span className="text-xs font-medium text-gray-400">Confirmar</span>
              </div>
              <div className="h-[2px] flex-1 bg-gray-100 mx-4" />
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-100 text-gray-400">
                  <span className="text-sm font-bold">3</span>
                </div>
                <span className="text-xs font-medium text-gray-400">Recibir</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-500/18 bg-emerald-50 px-4 py-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700">
                <ClipboardList className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-gray-900">{t("checkout.shippingData")}</p>
              <p className="mt-1 text-xs leading-6 text-gray-500">{t("checkout.securePayment")}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                <User className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-gray-900">{t("checkout.contactInfo")}</p>
              <p className="mt-1 text-xs leading-6 text-gray-500">Campos compactos, errores visibles y lectura más rápida en celular.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-gray-900">{t("checkout.confirmOrder")}</p>
              <p className="mt-1 text-xs leading-6 text-gray-500">{t("checkout.codBadge")}</p>
            </div>
          </div>
        </div>

        {formError && (
          <div
            ref={formErrorRef}
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-4 text-red-900 sm:mb-8"
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
              className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-6 sm:px-7 sm:py-7"
            >
              <h2 className="mb-5 flex items-center gap-3 text-base font-bold text-gray-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
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
        isLoadingEstimate={isLoadingEstimate}
        itemCount={items.length}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
