"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, ArrowRight, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";

function OrderPendingContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
  const orderId = searchParams.get("order_id");
  const reference = orderId || paymentId;

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Clock className="w-10 h-10 text-amber-600" />
      </div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-3">
        {t("order.pendingTitle")}
      </h1>
      <p className="text-neutral-500 text-lg mb-2">
        {t("order.pendingSubtitle")}
      </p>
      <p className="text-neutral-400 text-sm mb-6">
        {t("order.pendingDescription")}
      </p>

      {reference && (
        <div className="inline-flex items-center gap-2 bg-neutral-100 rounded-xl px-4 py-2 mb-8">
          <span className="text-sm text-neutral-500">{t("common.reference")}:</span>
          <span className="text-sm font-semibold text-neutral-900 font-mono">
            {reference}
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(reference)}
            className="text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="block">
        <Link href="/">
          <Button size="lg">
            {t("common.backHome")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function OrderPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mx-auto" />
        </div>
      }
    >
      <OrderPendingContent />
    </Suspense>
  );
}
