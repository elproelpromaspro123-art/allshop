"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Clock, Copy, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";

function OrderPendingContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const paymentId =
    searchParams.get("payment_id") || searchParams.get("collection_id");
  const orderId = searchParams.get("order_id");
  const reference = orderId || paymentId;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!reference) return;
    navigator.clipboard.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center animate-fade-in-up">
        {/* Pending Icon with Premium Styling */}
        <div className="relative mx-auto mb-8 w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 shadow-lg">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/10 to-orange-400/10 animate-pulse" />
          <Clock className="w-10 h-10 text-amber-600 relative z-10" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight text-gray-900">
          {t("order.pendingTitle")}
        </h1>
        <p className="text-lg mb-2 text-gray-400">
          {t("order.pendingSubtitle")}
        </p>
        <p className="text-sm mb-6 text-gray-300">
          {t("order.pendingDescription")}
        </p>

        {reference && (
          <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 mb-8 bg-gray-100 border border-gray-100">
            <span className="text-sm text-gray-400">
              {t("common.reference")}:
            </span>
            <span className="text-sm font-semibold font-mono text-gray-900">
              {reference}
            </span>
            <button
              onClick={handleCopy}
              aria-label="Copiar referencia"
              className={cn(
                "transition-colors p-1 rounded-lg hover:bg-white",
                copied
                  ? "text-emerald-500"
                  : "text-gray-300 hover:text-gray-700",
              )}
              type="button"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Info Card */}
        <div className="rounded-3xl p-6 mb-8 text-left border bg-white border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50">
              <Info className="w-5 h-5 text-indigo-700" />
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {t("order.whatsHappening")}
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t("order.pendingInfoText")}
          </p>
        </div>

        <div className="block">
          <Button
            asChild
            size="lg"
            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
          >
            <Link href="/">
              {t("common.backHome")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-lg mx-auto px-4 py-20 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-emerald-700 animate-spin mx-auto" />
          </div>
        </div>
      }
    >
      <OrderPendingContent />
    </Suspense>
  );
}
