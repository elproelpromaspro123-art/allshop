import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3">
          {t("order.errorTitle")}
        </h1>
        <p className="text-[var(--muted)] text-lg mb-8">
          {t("order.errorSubtitle")}
        </p>
        <Link href="/checkout">
          <Button size="lg" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("order.backCheckout")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
