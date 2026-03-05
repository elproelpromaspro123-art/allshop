"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Copy,
  Loader2,
  MailCheck,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import { useTheme } from "@/providers/ThemeProvider";
import type { Order, OrderStatus } from "@/types/database";

interface EmailConfirmationClientSnapshot {
  required: boolean;
  stage: "pending" | "confirmed" | "failed_to_send" | "blocked";
  confirmationAttempts: number;
  maxAttempts: number;
}

function parseNotes(rawNotes: string | null): Record<string, unknown> {
  if (!rawNotes) return {};

  try {
    const parsed = JSON.parse(rawNotes) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function getRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function extractTrackingCode(notes: string | null): string | null {
  const parsed = parseNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  const candidates = fulfillment.tracking_candidates;

  if (!Array.isArray(candidates)) return null;
  const found = candidates.find(
    (value) => typeof value === "string" && value.trim().length >= 4
  );
  return typeof found === "string" ? found.trim() : null;
}

function extractEmailConfirmation(notes: string | null): EmailConfirmationClientSnapshot {
  const parsed = parseNotes(notes);
  const confirmation = getRecord(parsed.email_confirmation);
  const normalizedStage = String(confirmation.stage || "").trim().toLowerCase();
  const stage =
    normalizedStage === "confirmed"
      ? "confirmed"
      : normalizedStage === "failed_to_send"
        ? "failed_to_send"
        : normalizedStage === "blocked"
          ? "blocked"
          : "pending";

  const confirmationAttempts = Math.max(
    0,
    Math.floor(Number(confirmation.confirmation_attempts) || 0)
  );
  const maxAttempts = Math.max(1, Math.floor(Number(confirmation.max_attempts) || 5));

  return {
    required: confirmation.required !== false,
    stage,
    confirmationAttempts,
    maxAttempts,
  };
}

async function fetchOrderSnapshot(
  orderId: string,
  token: string
): Promise<Order | null> {
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";
  const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}${tokenQuery}`);
  const data = (await res.json()) as { order: Order | null };
  return data.order;
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  const { t } = useLanguage();
  const {
    formatDisplayPrice,
    formatPaymentPrice,
    isDisplayDifferentFromPayment,
  } = usePricing();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const paymentId =
    searchParams.get("payment_id") || searchParams.get("collection_id");
  const orderId = searchParams.get("order_id");
  const queryOrderToken = searchParams.get("order_token") || "";

  const [orderToken, setOrderToken] = useState(queryOrderToken);
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);
  const [confirmingCode, setConfirmingCode] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);

  const statusLabels: Record<OrderStatus, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    processing: "Procesando",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
  };

  useEffect(() => {
    setOrderToken(queryOrderToken);
  }, [queryOrderToken]);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const loadOrder = useCallback(
    async (showSpinner: boolean) => {
      if (!orderId) return;

      if (showSpinner) setLoadingOrder(true);
      try {
        const nextOrder = await fetchOrderSnapshot(orderId, orderToken);
        setOrder(nextOrder);
      } catch {
        setOrder(null);
      } finally {
        if (showSpinner) setLoadingOrder(false);
      }
    },
    [orderId, orderToken]
  );

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    const load = async (showSpinner: boolean) => {
      if (cancelled) return;
      await loadOrder(showSpinner);
    };

    void load(true);
    const intervalId = window.setInterval(() => {
      void load(false);
    }, 20_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [orderId, loadOrder]);

  const displayReference = order?.id || orderId || paymentId;
  const displayEmail = order?.customer_email;
  const isPendingConfirmation = order ? order.status === "pending" : Boolean(orderId);
  const firstName = useMemo(() => {
    if (order?.customer_name) return order.customer_name.split(" ")[0];
    return null;
  }, [order?.customer_name]);
  const trackingCode = useMemo(
    () => extractTrackingCode(order?.notes ?? null),
    [order?.notes]
  );
  const emailConfirmation = useMemo(
    () => extractEmailConfirmation(order?.notes ?? null),
    [order?.notes]
  );
  const attemptsLeft = Math.max(
    0,
    emailConfirmation.maxAttempts - emailConfirmation.confirmationAttempts
  );
  const shouldShowCodeInput =
    isPendingConfirmation &&
    emailConfirmation.required &&
    emailConfirmation.stage === "pending";

  const handleCopyId = () => {
    if (displayReference) {
      navigator.clipboard.writeText(displayReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!orderId) return;

    const normalized = verificationCode.replace(/\D+/g, "");
    if (normalized.length !== 6) {
      setVerificationError(t("order.verifyCodeInvalid"));
      setVerificationSuccess(null);
      return;
    }

    setConfirmingCode(true);
    setVerificationError(null);
    setVerificationSuccess(null);

    try {
      const response = await fetch("/api/orders/confirm-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          order_token: orderToken,
          code: normalized,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        attempts_left?: number;
      };

      if (!response.ok) {
        const attemptsHint =
          typeof data.attempts_left === "number"
            ? ` ${t("order.verifyAttemptsLeft", { count: data.attempts_left })}`
            : "";
        setVerificationError((data.error || t("order.verifyCodeInvalid")) + attemptsHint);
        return;
      }

      setVerificationCode("");
      setVerificationSuccess(t("order.verifyCodeSuccess"));
      await loadOrder(false);
    } catch {
      setVerificationError(t("checkout.connectionError"));
    } finally {
      setConfirmingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (!orderId) return;

    setResendingCode(true);
    setVerificationError(null);
    setVerificationSuccess(null);

    try {
      const response = await fetch("/api/orders/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          order_token: orderToken,
        }),
      });
      const data = (await response.json()) as { error?: string; order_token?: string };

      if (!response.ok) {
        setVerificationError(data.error || t("order.verifyResendError"));
        return;
      }

      const nextToken = String(data.order_token || "").trim();
      if (nextToken && nextToken !== orderToken) {
        setOrderToken(nextToken);

        const params = new URLSearchParams(window.location.search);
        params.set("order_token", nextToken);
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?${params.toString()}`
        );
      }

      setVerificationCode("");
      setVerificationSuccess(t("order.verifyResendSuccess"));
      await loadOrder(false);
    } catch {
      setVerificationError(t("checkout.connectionError"));
    } finally {
      setResendingCode(false);
    }
  };

  return (
    <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-[#0a0b0f]" : "bg-[var(--background)]")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-lg mx-auto px-4 py-20 text-center"
      >
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
          isDark ? "bg-emerald-500/15" : "bg-emerald-100"
        )}>
          <CheckCircle2 className={cn("w-10 h-10", isDark ? "text-emerald-400" : "text-emerald-600")} />
        </div>
        <h1 className={cn("text-3xl font-bold mb-3", isDark ? "text-white" : "text-[var(--foreground)]")}>
          {isPendingConfirmation ? t("order.pendingTitle") : t("order.confirmedTitle")}
        </h1>
        <p className={cn("text-lg mb-2", isDark ? "text-neutral-400" : "text-neutral-500")}>
          {isPendingConfirmation
            ? t("order.pendingSubtitle")
            : firstName
              ? t("order.confirmedWithName", { name: firstName })
              : t("order.confirmedWithoutName")}
        </p>
        {isPendingConfirmation && (
          <p className={cn("text-sm mb-2", isDark ? "text-neutral-500" : "text-neutral-500")}>{t("order.pendingDescription")}</p>
        )}

        {displayReference && (
          <div className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 mb-6",
            isDark ? "bg-white/[0.05] border border-white/[0.08]" : "bg-neutral-100"
          )}>
            <span className="text-sm text-neutral-500">{t("common.reference")}:</span>
            <span className={cn("text-sm font-semibold font-mono", isDark ? "text-white" : "text-neutral-900")}>
              {displayReference}
            </span>
            <button
              onClick={handleCopyId}
              className={cn(
                "transition-colors",
                copied ? "text-emerald-500" : isDark ? "text-neutral-500 hover:text-white" : "text-neutral-400 hover:text-neutral-700"
              )}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}

        {loadingOrder && !order && (
          <div className="mb-6">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400 mx-auto" />
          </div>
        )}

        {order && (
          <div className={cn(
            "rounded-2xl p-5 mb-6 text-left border",
            isDark ? "bg-white/[0.03] border-white/[0.08]" : "bg-neutral-50 border-transparent"
          )}>
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">
              {t("order.summaryTitle")}
            </p>
            <div className={cn("space-y-1 text-sm", isDark ? "text-neutral-300" : "text-neutral-700")}>
              <p>
                {t("order.summaryStatus")}:{" "}
                <span className="font-semibold">{statusLabels[order.status] ?? order.status}</span>
              </p>
              <p>
                {t("order.summaryTotal")}: <span className="font-semibold">{formatDisplayPrice(order.total)}</span>
              </p>
              <p>
                {t("order.summaryItems")}: <span className="font-semibold">{order.items.length}</span>
              </p>
              {trackingCode && (
                <p>
                  Guia: <span className="font-semibold font-mono">{trackingCode}</span>
                </p>
              )}
              {isDisplayDifferentFromPayment && (
                <p>
                  <span className="font-semibold">{formatPaymentPrice(order.total)}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {isPendingConfirmation && (
          <div className={cn(
            "rounded-2xl p-5 mb-6 text-left border",
            isDark ? "bg-white/[0.03] border-white/[0.08]" : "bg-neutral-50 border-transparent"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <MailCheck className={cn("w-4 h-4", isDark ? "text-neutral-300" : "text-neutral-700")} />
              <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-neutral-900")}>
                {t("order.verifyCodeTitle")}
              </p>
            </div>

            {shouldShowCodeInput && (
              <form className="space-y-3" onSubmit={handleConfirmCode}>
                <label className={cn("block text-xs uppercase tracking-wider", isDark ? "text-neutral-500" : "text-neutral-500")}>
                  {t("order.verifyCodeLabel")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D+/g, "").slice(0, 6))}
                  placeholder={t("order.verifyCodePlaceholder")}
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent",
                    isDark
                      ? "border-white/[0.1] bg-[var(--surface)] text-white placeholder:text-neutral-600"
                      : "border-[var(--border)] bg-white text-neutral-900"
                  )}
                />
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" className="gap-2" disabled={confirmingCode}>
                    {confirmingCode ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("checkout.processing")}
                      </>
                    ) : (
                      t("order.verifyCodeSubmit")
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleResendCode}
                    disabled={resendingCode}
                  >
                    {resendingCode ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("order.verifyCodeResending")}
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        {t("order.verifyCodeResend")}
                      </>
                    )}
                  </Button>
                </div>
                <p className={cn("text-xs", isDark ? "text-neutral-500" : "text-neutral-500")}>
                  {t("order.verifyAttemptsLeft", { count: attemptsLeft })}
                </p>
              </form>
            )}

            {emailConfirmation.stage === "failed_to_send" && (
              <p className={cn("text-sm", isDark ? "text-amber-300" : "text-amber-700")}>
                {t("order.verifyEmailFailed")}
              </p>
            )}

            {emailConfirmation.stage === "blocked" && (
              <p className={cn("text-sm", isDark ? "text-red-300" : "text-red-700")}>
                {t("order.verifyBlocked")}
              </p>
            )}

            {verificationError && (
              <p className={cn("text-sm mt-3", isDark ? "text-red-300" : "text-red-700")}>
                {verificationError}
              </p>
            )}

            {verificationSuccess && (
              <p className={cn("text-sm mt-3", isDark ? "text-emerald-300" : "text-emerald-700")}>
                {verificationSuccess}
              </p>
            )}

            <div
              className={cn(
                "mt-4 rounded-xl border p-3 text-xs flex items-start gap-2",
                isDark
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                  : "border-amber-300 bg-amber-50 text-amber-900"
              )}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{t("order.verifyWarning")}</p>
            </div>
          </div>
        )}

        {displayEmail && (
          <p className={cn("text-sm mb-8", isDark ? "text-neutral-500" : "text-neutral-400")}>
            {t("order.emailNotice", { email: displayEmail })}
          </p>
        )}

        <div className={cn(
          "rounded-2xl p-6 mb-8 text-left border",
          isDark ? "bg-white/[0.03] border-white/[0.08]" : "bg-neutral-50 border-transparent"
        )}>
          <div className="flex items-center gap-3 mb-3">
            <Package className={cn("w-5 h-5", isDark ? "text-neutral-400" : "text-neutral-600")} />
            <span className={cn("text-sm font-semibold", isDark ? "text-white" : "text-neutral-900")}>
              {t("order.nextSteps")}
            </span>
          </div>
          <ul className={cn("space-y-2 text-sm", isDark ? "text-neutral-400" : "text-neutral-600")}>
            <li>{t("order.step1")}</li>
            <li>{t("order.step2")}</li>
            <li>{t("order.step3")}</li>
          </ul>
        </div>

        <Link href="/">
          <Button size="lg" className="gap-2">
            {t("order.continueShopping")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mx-auto" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
