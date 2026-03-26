"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, MessageCircleMore, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SystemStateShell } from "@/components/system/SystemStateShell";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/providers/LanguageProvider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    void logger.error("Route error boundary triggered", error, {
      path: typeof window !== "undefined" ? window.location.pathname : null,
      digest: error.digest || null,
    });
  }, [error]);

  return (
    <div className="min-h-[72vh] bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[72vh] max-w-4xl items-center justify-center">
        <SystemStateShell
          tone="danger"
          eyebrow="Error recuperable"
          badge="Ruta fallida"
          icon={<AlertTriangle className="h-7 w-7" />}
          title={t("error.title")}
          subtitle={t("error.subtitle")}
          actions={
            <>
              <Button
                onClick={() => reset()}
                className="gap-2 bg-slate-950 font-bold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] hover:bg-slate-900"
              >
                <RefreshCw className="h-4 w-4" />
                {t("error.retry")}
              </Button>
              <Button asChild variant="outline" className="gap-2 font-semibold">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  {t("error.backHome")}
                </Link>
              </Button>
              <Button asChild variant="ghost" className="gap-2 font-semibold">
                <Link href="/soporte">
                  <MessageCircleMore className="h-4 w-4" />
                  {t("footer.support")}
                </Link>
              </Button>
            </>
          }
        >
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {t("common.reference")}
            </p>
            <p className="mt-1 break-all font-mono text-xs text-slate-700">
              {error.digest || "N/D"}
            </p>
          </div>
        </SystemStateShell>
      </div>
    </div>
  );
}
