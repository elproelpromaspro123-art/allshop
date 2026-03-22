import { getServerT } from "@/lib/i18n";
import { ShieldAlert, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function BlockedPage() {
  const t = await getServerT();

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--background)] px-5">
      <div className="bg-[var(--surface)] text-[var(--foreground)] rounded-[var(--section-radius)] p-10 sm:p-12 max-w-md text-center border border-[var(--border)] shadow-[var(--shadow-elevated)] animate-fade-in-up">
        {/* Blocked Icon with Premium Styling */}
        <div className="relative mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/60 shadow-lg">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-[var(--foreground)]">
          {t("blocked.title")}
        </h1>
        <p className="text-[var(--muted)] leading-relaxed text-sm mb-6">
          {t("blocked.subtitle")}
        </p>

        {/* Security Notice Card */}
        <div className="bg-gradient-to-br from-red-50/80 to-rose-50/50 border border-red-200/60 rounded-xl p-4 text-xs text-red-900/80 leading-relaxed mb-6">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <span>{t("blocked.note")}</span>
          </div>
        </div>

        <Link href="/">
          <Button
            size="lg"
            className="gap-2 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.backHome")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
