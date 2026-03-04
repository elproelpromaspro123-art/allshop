"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, ArrowRight, Copy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";
import { useTheme } from "@/providers/ThemeProvider";

function OrderPendingContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
  const orderId = searchParams.get("order_id");
  const reference = orderId || paymentId;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (reference) {
      navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          isDark ? "bg-amber-500/15" : "bg-amber-100"
        )}>
          <Clock className={cn("w-10 h-10", isDark ? "text-amber-400" : "text-amber-600")} />
        </div>
        <h1 className={cn("text-3xl font-bold mb-3", isDark ? "text-white" : "text-[var(--foreground)]")}>
          {t("order.pendingTitle")}
        </h1>
        <p className={cn("text-lg mb-2", isDark ? "text-neutral-400" : "text-neutral-500")}>
          {t("order.pendingSubtitle")}
        </p>
        <p className={cn("text-sm mb-6", isDark ? "text-neutral-500" : "text-neutral-400")}>
          {t("order.pendingDescription")}
        </p>

        {reference && (
          <div className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 mb-8",
            isDark ? "bg-white/[0.05] border border-white/[0.08]" : "bg-neutral-100"
          )}>
            <span className="text-sm text-neutral-500">{t("common.reference")}:</span>
            <span className={cn("text-sm font-semibold font-mono", isDark ? "text-white" : "text-neutral-900")}>
              {reference}
            </span>
            <button
              onClick={handleCopy}
              className={cn(
                "transition-colors",
                copied ? "text-emerald-500" : isDark ? "text-neutral-500 hover:text-white" : "text-neutral-400 hover:text-neutral-700"
              )}
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
      </motion.div>
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
