"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
    // Optionally log the error to an error reporting service like Sentry
    console.error("Runtime Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-md w-full rounded-3xl border border-[var(--border)] bg-white p-8 sm:p-10 text-center shadow-[var(--shadow-soft)]">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mb-3">
          {t("error.title")}
        </h1>
        <p className="text-sm text-[var(--muted)] mb-8 leading-relaxed">
          {t("error.subtitle")}
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => reset()} className="w-full gap-2 font-bold">
            <RefreshCw className="w-4 h-4" />
            {t("error.retry")}
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full gap-2 font-bold">
              <Home className="w-4 h-4 text-[var(--muted-soft)]" />
              {t("error.backHome")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

