import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getServerT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t("order.errorMetaTitle"),
  };
}

export default async function OrderErrorPage() {
  const t = await getServerT();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in-up">
        {/* Error Icon with Premium Styling */}
        <div className="relative mx-auto mb-8 w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/60 shadow-lg">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400/10 to-rose-400/10 animate-pulse" />
          <XCircle className="w-10 h-10 text-red-500 relative z-10" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
          {t("order.errorTitle")}
        </h1>
        <p className="text-gray-500 text-lg mb-2">
          {t("order.errorSubtitle")}
        </p>
        <p className="text-sm text-gray-400 mb-8">
          {t("order.errorDescription")}
        </p>

        {/* Help Card */}
        <div className="rounded-3xl p-6 mb-8 text-left border bg-white border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {t("order.needHelp")}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {t("order.errorHelpText")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/soporte"
              className="text-xs font-medium text-indigo-700 hover:text-indigo-500 transition-colors"
            >
              {t("common.contactSupport")} →
            </Link>
            <Link
              href="/faq"
              className="text-xs font-medium text-indigo-700 hover:text-indigo-500 transition-colors"
            >
              {t("common.viewFAQ")} →
            </Link>
          </div>
        </div>

        <Button
          asChild
          size="lg"
          className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
        >
          <Link href="/checkout">
            <ArrowLeft className="w-4 h-4" />
            {t("order.backCheckout")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
