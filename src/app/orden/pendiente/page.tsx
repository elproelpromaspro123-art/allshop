"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Clock, Copy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";

function OrderPendingContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in-up">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-amber-100">
          <Clock className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold mb-3 text-[var(--foreground)]">
          {t("order.pendingTitle")}
        </h1>
        <p className="text-lg mb-2 text-neutral-500">{t("order.pendingSubtitle")}</p>
        <p className="text-sm mb-6 text-neutral-400">{t("order.pendingDescription")}</p>

        {reference && (
          <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2 mb-8 bg-neutral-100">
            <span className="text-sm text-neutral-500">{t("common.reference")}:</span>
            <span className="text-sm font-semibold font-mono text-neutral-900">
              {reference}
            </span>
            <button
              onClick={handleCopy}
              className={cn(
                "transition-colors",
                copied ? "text-emerald-500" : "text-neutral-400 hover:text-neutral-700"
              )}
              type="button"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="block">
          <Link href="/">
            <Button size="lg" className="gap-2">
              {t("common.backHome")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
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
