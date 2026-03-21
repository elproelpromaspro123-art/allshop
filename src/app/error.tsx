"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
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
    console.error("Runtime Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-md w-full rounded-3xl border border-[var(--border)] bg-white p-8 sm:p-10 text-center shadow-xl shadow-black/[0.04] animate-fade-in-up">
        {/* Error Icon with Premium Styling */}
        <motion.div 
          className="relative mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/60 shadow-lg"
          animate={{
            scale: [1, 1.05, 1],
            y: [0, -4, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400/10 to-rose-400/10 animate-pulse" />
          <AlertTriangle className="w-8 h-8 text-red-600 relative z-10" />
        </motion.div>

        <h1 className="text-title-lg text-[var(--foreground)] mb-3">
          {t("error.title")}
        </h1>
        <p className="text-sm text-[var(--muted)] mb-8 leading-relaxed">
          {t("error.subtitle")}
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => reset()}
            className="w-full gap-2 font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
          >
            <RefreshCw className="w-4 h-4" />
            {t("error.retry")}
          </Button>
          <Link href="/" className="w-full">
            <Button
              variant="outline"
              className="w-full gap-2 font-bold border-[var(--border)] hover:bg-[var(--surface-muted)]"
            >
              <Home className="w-4 h-4 text-[var(--muted-soft)]" />
              {t("error.backHome")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
