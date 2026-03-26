"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Lock,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCartStore } from "@/store/cart";
import { useCheckoutProfileStore } from "@/store/checkout-profile";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import { normalizeProductSlug } from "@/lib/legacy-product-slugs";
import { CheckoutShippingForm } from "@/components/checkout/CheckoutShippingForm";
import { CheckoutConfirmations } from "@/components/checkout/CheckoutConfirmations";
import { CouponCodePanel } from "@/components/checkout/CouponCodePanel";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { CheckoutMobileStickyBar } from "@/components/checkout/CheckoutMobileStickyBar";
import { evaluateCoupon } from "@/lib/coupons";
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
import { trackClientEvent } from "@/lib/analytics";
import {
  formatCheckoutDocumentInput,
  formatCheckoutPhoneInput,
  formatCheckoutZipInput,
} from "@/lib/checkout-input-format";
import {
  CHECKOUT_RESERVATION_MS,
  formatReservationCountdown,
  getReservationRemainingMs,
  normalizeReservationTimestamp,
} from "@/lib/checkout-reservation";
import { cn } from "@/lib/utils";

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

const CONTACT_FIELDS: Array<keyof CheckoutFormData> = [
  "name",
  "email",
  "phone",
  "document",
];
const SHIPPING_FIELDS: Array<keyof CheckoutFormData> = [
  "address",
  "city",
  "department",
];
const CHECKOUT_RESERVATION_STORAGE_KEY =
  "vortixy_checkout_reservation_started_at";

export default function CheckoutPage() {
  const items = useCartStore((store) => store.items);
  const couponCode = useCartStore((store) => store.couponCode);
  const hasHydrated = useCartStore((store) => store.hasHydrated);
  const removeItem = useCartStore((store) => store.removeItem);
  const updateQuantity = useCartStore((store) => store.updateQuantity);
  const setCouponCode = useCartStore((store) => store.setCouponCode);
  const clearCouponCode = useCartStore((store) => store.clearCouponCode);
  const clearCart = useCartStore((store) => store.clearCart);
  const savedCheckoutProfile = useCheckoutProfileStore((store) => store.profile);
  const hasCheckoutProfileHydrated = useCheckoutProfileStore(
    (store) => store.hasHydrated,
  );
  const saveCheckoutProfile = useCheckoutProfileStore(
    (store) => store.saveProfile,
  );
  const clearCheckoutProfile = useCheckoutProfileStore(
    (store) => store.clearProfile,
  );
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
  const [autoDetectedDepartment, setAutoDetectedDepartment] = useState(false);
  const [reservationStartedAt, setReservationStartedAt] = useState<
    number | null
  >(null);
  const [reservationNow, setReservationNow] = useState(() => Date.now());
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
  const savedProfileAppliedRef = useRef(false);
  const checkoutTrackedRef = useRef(false);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
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
    baseShippingCost,
  });
  const rawTotal = subtotal + shippingCost;
  const shippingType = "nacional";
  const couponApplication = useMemo(() => {
    if (!couponCode) return null;

    return evaluateCoupon({
      code: couponCode,
      subtotal,
      shippingCost,
      items: items.map((item) => ({
        id: item.productId,
        slug: item.slug || null,
        quantity: item.quantity,
      })),
    });
  }, [couponCode, items, shippingCost, subtotal]);
  const discountAmount = couponApplication?.ok
    ? couponApplication.totalDiscount
    : 0;
  const total = couponApplication?.ok
    ? couponApplication.discountedTotal
    : rawTotal;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !hasCheckoutProfileHydrated) return;
    if (savedProfileAppliedRef.current) return;
    if (!savedCheckoutProfile) return;

    const isFormBlank = Object.values(formData).every(
      (value) => String(value || "").trim().length === 0,
    );
    if (!isFormBlank) return;

    savedProfileAppliedRef.current = true;
    setFormData({
      name: savedCheckoutProfile.name,
      email: savedCheckoutProfile.email,
      phone: savedCheckoutProfile.phone,
      document: savedCheckoutProfile.document,
      address: savedCheckoutProfile.address,
      reference: savedCheckoutProfile.reference,
      city: savedCheckoutProfile.city,
      department: savedCheckoutProfile.department,
      zip: savedCheckoutProfile.zip,
    });
    setAutoDetectedDepartment(false);
  }, [
    formData,
    hasCheckoutProfileHydrated,
    isMounted,
    savedCheckoutProfile,
  ]);

  useEffect(() => {
    if (!isMounted || !hasHydrated) return;

    if (items.length === 0) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(CHECKOUT_RESERVATION_STORAGE_KEY);
      }
      setReservationStartedAt(null);
      return;
    }

    if (typeof window === "undefined") return;

    const storedValue = window.sessionStorage.getItem(
      CHECKOUT_RESERVATION_STORAGE_KEY,
    );
    const normalizedValue = normalizeReservationTimestamp(storedValue);
    const nextStartedAt = normalizedValue ?? Date.now();

    window.sessionStorage.setItem(
      CHECKOUT_RESERVATION_STORAGE_KEY,
      String(nextStartedAt),
    );
    setReservationStartedAt(nextStartedAt);
    setReservationNow(Date.now());
  }, [hasHydrated, isMounted, items.length]);

  useEffect(() => {
    if (!reservationStartedAt) return;

    const timer = window.setInterval(() => {
      setReservationNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [reservationStartedAt]);

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

        setAutoDetectedDepartment(true);
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
    if (!isMounted || !hasHydrated || items.length === 0) return;
    if (checkoutTrackedRef.current) return;

    checkoutTrackedRef.current = true;
    void trackClientEvent({
      event_type: "begin_checkout",
      metadata: {
        source: "checkout_page",
        itemCount,
        subtotal,
        shippingCost,
        discountAmount,
        total,
      },
    });
  }, [
    discountAmount,
    hasHydrated,
    isMounted,
    itemCount,
    items.length,
    shippingCost,
    subtotal,
    total,
  ]);

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
        setDeliveryEstimate(data.estimate || null);
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

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const isFieldComplete = useCallback(
    (field: keyof CheckoutFormData) => {
      const rawValue = String(formData[field] || "").trim();
      if (!rawValue) return false;
      return !validateField(field, formData[field]);
    },
    [formData],
  );

  const fieldSuccess = useMemo<Record<string, boolean>>(
    () => ({
      name: isFieldComplete("name"),
      email: isFieldComplete("email"),
      phone: isFieldComplete("phone"),
      document: isFieldComplete("document"),
      address: isFieldComplete("address"),
      city: isFieldComplete("city"),
      department: isFieldComplete("department"),
      reference:
        formData.reference.trim().length > 0 && !Boolean(fieldErrors.reference),
      zip: formData.zip.trim().length > 0 && !Boolean(fieldErrors.zip),
    }),
    [fieldErrors.reference, fieldErrors.zip, formData.reference, formData.zip, isFieldComplete],
  );

  const contactComplete = CONTACT_FIELDS.every(isFieldComplete);
  const shippingComplete = SHIPPING_FIELDS.every(isFieldComplete);
  const confirmationsComplete =
    validateCheckoutConfirmations(confirmations) === null;

  const reservationRemainingMs = reservationStartedAt
    ? getReservationRemainingMs(reservationStartedAt, reservationNow)
    : CHECKOUT_RESERVATION_MS;
  const reservationCountdownLabel =
    formatReservationCountdown(reservationRemainingMs);
  const deliveryWindowLabel = deliveryEstimate?.formattedRange || null;
  const hasSavedCheckoutProfile =
    isMounted && hasCheckoutProfileHydrated && Boolean(savedCheckoutProfile);
  const savedProfileLastUsedLabel = useMemo(() => {
    if (!savedCheckoutProfile?.lastUsedAt) return null;
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(savedCheckoutProfile.lastUsedAt);
  }, [savedCheckoutProfile?.lastUsedAt]);

  const stepItems = useMemo(
    () => [
      {
        id: "checkout-contacto",
        label: "Contacto",
        detail: "Datos del comprador",
        completed: contactComplete,
      },
      {
        id: "checkout-envio",
        label: "Envío",
        detail: "Dirección y ciudad",
        completed: shippingComplete,
      },
      {
        id: "checkout-confirmaciones",
        label: "Confirmación",
        detail: "Validación final",
        completed: confirmationsComplete,
      },
    ],
    [confirmationsComplete, contactComplete, shippingComplete],
  );

  const activeStepIndex = stepItems.findIndex((step) => !step.completed);
  const resolvedActiveStepIndex =
    activeStepIndex === -1 ? stepItems.length - 1 : activeStepIndex;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name } = event.target;
    const rawValue = event.target.value;
    const value =
      name === "phone"
        ? formatCheckoutPhoneInput(rawValue)
        : name === "document"
          ? formatCheckoutDocumentInput(rawValue)
          : name === "zip"
            ? formatCheckoutZipInput(rawValue)
            : rawValue;

    setFormData((previous) => ({ ...previous, [name]: value }));
    if (name === "department" && rawValue) {
      setAutoDetectedDepartment(false);
    }
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
        const element = document.querySelector<HTMLElement>(`[name="${firstField}"]`);
        element?.focus();
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

    if (couponCode && (!couponApplication || !couponApplication.ok)) {
      setFormError(
        couponApplication?.message ||
          "El codigo promocional activo ya no aplica al pedido actual.",
      );
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
        promotion: couponApplication?.ok
          ? {
              code: couponApplication.normalizedCode,
            }
          : undefined,
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

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(CHECKOUT_RESERVATION_STORAGE_KEY);
      }

      if (successData.redirect_url) {
        void trackClientEvent({
          event_type: "purchase",
          order_id: successData.order_id || null,
          metadata: {
            source: "checkout_page",
            itemCount,
            discountAmount,
            total,
          },
        });
        saveCheckoutProfile(formData);
        clearCart();
        window.location.href = successData.redirect_url;
        return;
      }

      if (successData.order_id) {
        void trackClientEvent({
          event_type: "purchase",
          order_id: successData.order_id,
          metadata: {
            source: "checkout_page",
            itemCount,
            discountAmount,
            total,
          },
        });
        saveCheckoutProfile(formData);
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
          ? error.message.includes("red") || error.message.includes("conexión")
            ? error.message
            : "Error de seguridad. Recarga la página e intenta nuevamente."
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="px-4 py-24 text-center">
          <Loader2 className="mx-auto mb-4 h-7 w-7 animate-spin text-emerald-700" />
          <p className="text-sm text-gray-400">{t("checkout.loadingCart")}</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-sm px-6 py-24 text-center">
          <div className="relative mx-auto mb-8 h-28 w-28">
            <div
              className="absolute inset-0 animate-ping rounded-full bg-emerald-500/10 opacity-20"
              style={{ animationDuration: "3s" }}
            />
            <div className="absolute inset-2 animate-pulse rounded-full bg-emerald-500/10" />
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-100">
              <ShoppingBag className="h-10 w-10 text-emerald-500" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-900">
            Tu carrito está vacío
          </h1>
          <p className="mb-10 text-sm leading-relaxed text-gray-400">
            Parece que aún no has agregado ningún producto. Explora nuestro
            catálogo y descubre ofertas increíbles.
          </p>
          <Button
            asChild
            className="h-12 w-full gap-2 text-[15px] shadow-xl shadow-emerald-600/20 transition-all hover:shadow-2xl hover:shadow-emerald-600/30"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Descubrir productos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28 lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-6 shadow-sm sm:mb-10 sm:px-6 sm:py-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
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
            description="Cierra tu pedido con bloques más claros, validación visible y una ventana de cierre pensada para móvil."
          />

          {hasSavedCheckoutProfile ? (
            <div className="mt-6 flex flex-col gap-3 rounded-[1.35rem] border border-emerald-300/40 bg-emerald-50 px-4 py-4 shadow-[0_16px_36px_rgba(16,185,129,0.08)] sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-950">
                  {t("checkout.savedProfileTitle")}
                </p>
                <p className="text-xs leading-6 text-slate-600">
                  {t("checkout.savedProfileDescription", {
                    date:
                      savedProfileLastUsedLabel ||
                      t("checkout.savedProfileFallbackDate"),
                  })}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-center text-slate-700 sm:justify-start"
                onClick={() => clearCheckoutProfile()}
              >
                {t("checkout.forgetSavedProfile")}
              </Button>
            </div>
          ) : null}

          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            {stepItems.map((step, index) => {
              const isActive = index === resolvedActiveStepIndex;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => scrollToSection(step.id)}
                  className={cn(
                    "rounded-[1.35rem] border px-4 py-4 text-left transition-all",
                    step.completed
                      ? "border-emerald-300/40 bg-emerald-50 shadow-[0_14px_34px_rgba(16,185,129,0.08)]"
                      : isActive
                        ? "border-slate-300 bg-slate-50 shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                        : "border-gray-200 bg-white",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-sm font-black",
                        step.completed
                          ? "bg-emerald-500 text-white"
                          : isActive
                            ? "bg-slate-950 text-white"
                            : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {step.completed ? "✓" : index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500">{step.detail}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-500/18 bg-emerald-50 px-4 py-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700">
                <ClipboardList className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {t("checkout.shippingData")}
              </p>
              <p className="mt-1 text-xs leading-6 text-gray-500">
                {deliveryWindowLabel || "La ventana de entrega aparece cuando defines el destino."}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                <User className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {t("checkout.contactInfo")}
              </p>
              <p className="mt-1 text-xs leading-6 text-gray-500">
                Campos con validación clara y formato más legible en celular.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {t("checkout.confirmOrder")}
              </p>
              <p className="mt-1 text-xs leading-6 text-gray-500">
                Ventana sugerida para cerrar: {reservationCountdownLabel}.
              </p>
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
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">{formError}</p>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="shrink-0 text-red-400 transition-colors hover:text-red-600"
            >
              <span className="sr-only">{t("common.close")}</span>
              <svg
                className="h-4 w-4"
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
              className="rounded-2xl border border-gray-100 bg-white px-5 py-6 shadow-sm sm:px-7 sm:py-7"
            >
              <h2 className="mb-5 flex items-center gap-3 text-base font-bold text-gray-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <User className="h-4 w-4" />
                </div>
                {t("checkout.contactInfo")}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    success={fieldSuccess.name}
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
                    success={fieldSuccess.email}
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
                    success={fieldSuccess.phone}
                    hint="Formato recomendado: 300 123 4567"
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
                    success={fieldSuccess.document}
                    hint="Puedes pegarlo sin puntos; lo ordenamos automáticamente."
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
                fieldSuccess={fieldSuccess}
                isLoadingEstimate={isLoadingEstimate}
                deliveryEstimate={deliveryEstimate}
                autoDetectedDepartment={autoDetectedDepartment}
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
            <div className="space-y-4">
              <CouponCodePanel
                items={items.map((item) => ({
                  productId: item.productId,
                  slug: item.slug || null,
                  quantity: item.quantity,
                }))}
                subtotal={subtotal}
                shippingCost={shippingCost}
                appliedCode={couponCode}
                application={couponApplication}
                formatPrice={formatDisplayPrice}
                onApplyCode={setCouponCode}
                onClearCode={clearCouponCode}
              />

              <CheckoutOrderSummary
                items={items}
                itemCount={itemCount}
                subtotal={subtotal}
                shippingCost={shippingCost}
                discountAmount={discountAmount}
                couponCode={couponApplication?.ok ? couponApplication.normalizedCode : null}
                total={total}
                hasOnlyFreeShipping={hasOnlyFreeShipping}
                shippingType={shippingType}
                isLoading={isLoading}
                isDisplayDifferentFromPayment={isDisplayDifferentFromPayment}
                reservationCountdownLabel={reservationCountdownLabel}
                deliveryWindowLabel={deliveryWindowLabel}
                formatDisplayPrice={formatDisplayPrice}
                formatPaymentPrice={formatPaymentPrice}
                onCheckout={handleCheckout}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onJumpToSection={scrollToSection}
              />
            </div>
          </div>
        </div>
      </div>

      <CheckoutMobileStickyBar
        total={formatDisplayPrice(total)}
        isLoading={isLoading}
        isLoadingEstimate={isLoadingEstimate}
        itemCount={itemCount}
        reservationLabel={reservationCountdownLabel}
        deliveryLabel={deliveryWindowLabel}
        discountLabel={
          discountAmount > 0
            ? `${couponApplication?.ok ? couponApplication.normalizedCode : "Promo"} · -${formatDisplayPrice(
                discountAmount,
              )}`
            : null
        }
        onCheckout={handleCheckout}
      />
    </div>
  );
}
