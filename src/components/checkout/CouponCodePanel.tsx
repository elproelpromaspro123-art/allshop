"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { type CouponApplication, normalizeCouponCode } from "@/lib/coupons";
import { fetchWithCsrf, isCsrfClientError } from "@/lib/csrf-client";
import { useLanguage } from "@/providers/LanguageProvider";
import { cn } from "@/lib/utils";

interface CouponCodePanelItem {
  productId: string;
  slug?: string | null;
  quantity: number;
}

interface CouponCodePanelProps {
  items: CouponCodePanelItem[];
  subtotal: number;
  shippingCost: number;
  appliedCode: string | null;
  application: CouponApplication | null;
  formatPrice: (price: number) => string;
  onApplyCode: (code: string) => void;
  onClearCode: () => void;
  className?: string;
  compact?: boolean;
}

interface CouponValidationPayload {
  ok?: boolean;
  error?: string;
  application?: CouponApplication;
}

export function CouponCodePanel({
  items,
  subtotal,
  shippingCost,
  appliedCode,
  application,
  formatPrice,
  onApplyCode,
  onClearCode,
  className,
  compact = false,
}: CouponCodePanelProps) {
  const { t } = useLanguage();
  const [draftCode, setDraftCode] = useState(appliedCode || "");
  const [isApplying, setIsApplying] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    setDraftCode(appliedCode || "");
  }, [appliedCode]);

  useEffect(() => {
    if (!appliedCode) {
      setRequestError(null);
    }
  }, [appliedCode]);

  const appliedMessage = useMemo(() => {
    if (!appliedCode || !application) return null;
    if (application.ok) return application.message;
    return application.message;
  }, [application, appliedCode]);

  const stateMessage =
    requestError ||
    (application && !application.ok && appliedCode ? application.message : null) ||
    null;

  const handleApply = async () => {
    const normalizedCode = normalizeCouponCode(draftCode);

    if (!normalizedCode) {
      setRequestError(t("checkout.couponRequired"));
      return;
    }

    setIsApplying(true);
    setRequestError(null);

    try {
      const response = await fetchWithCsrf("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: normalizedCode,
          subtotal,
          shippingCost,
          items: items.map((item) => ({
            id: item.productId,
            slug: item.slug || null,
            quantity: item.quantity,
          })),
        }),
      });
      const data = (await response.json()) as CouponValidationPayload;

      if (!response.ok || !data.application?.ok) {
        setRequestError(
          data.application?.message ||
            data.error ||
            t("checkout.couponInvalidFallback"),
        );
        return;
      }

      setDraftCode(data.application.normalizedCode);
      onApplyCode(data.application.normalizedCode);
    } catch (error) {
      setRequestError(
        isCsrfClientError(error)
          ? error.message
          : t("checkout.couponConnectionError"),
      );
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm",
        compact && "px-4 py-3",
        className,
      )}
      aria-labelledby="coupon-panel-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            id="coupon-panel-title"
            className="text-sm font-semibold text-gray-900"
          >
            {t("checkout.couponTitle")}
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {t("checkout.couponHint")}
          </p>
        </div>

        {application?.ok ? (
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            {application.normalizedCode}
          </div>
        ) : null}
      </div>

      <div className={cn("mt-4 flex gap-2", compact && "flex-col sm:flex-row")}>
        <Input
          name="coupon-code"
          type="text"
          value={draftCode}
          onChange={(event) => setDraftCode(event.target.value)}
          placeholder={t("checkout.couponPlaceholder")}
          icon={<Tag className="h-4 w-4" />}
          className="uppercase"
          autoComplete="off"
          spellCheck={false}
          maxLength={32}
        />
        <Button
          type="button"
          variant="outline"
          className={cn("shrink-0 gap-2", compact ? "sm:px-4" : "px-5")}
          onClick={handleApply}
          disabled={isApplying}
        >
          {isApplying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("checkout.couponApplying")}
            </>
          ) : (
            t("checkout.couponApply")
          )}
        </Button>
      </div>

      {application?.ok ? (
        <div
          className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                {application.coupon?.label || application.normalizedCode}
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-800/90">
                {appliedMessage}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                {t("checkout.discount")}: -{formatPrice(application.totalDiscount)}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full border border-emerald-200 bg-white/70 text-emerald-800"
              onClick={onClearCode}
              aria-label={t("checkout.couponRemove")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {stateMessage ? (
        <div
          className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <span>{stateMessage}</span>
            {appliedCode ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto shrink-0 px-2 py-1 text-amber-900"
                onClick={onClearCode}
              >
                {t("checkout.couponRemove")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
