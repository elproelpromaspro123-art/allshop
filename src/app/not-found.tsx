"use client";

import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";
import { motion } from "framer-motion";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--background)] overflow-hidden">
      {/* Decorative grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Gradient blob */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-[var(--accent)] opacity-[0.06] blur-[120px]" />

      {/* 404 watermark */}
      <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[14rem] sm:text-[22rem] font-black tracking-tighter text-[var(--foreground)] opacity-[0.025] select-none leading-none">
        404
      </span>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-6 text-center">
        <motion.div
          className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[var(--accent)]/10"
          style={{
            background: "linear-gradient(135deg, var(--accent-strong), var(--accent-dim))"
          }}
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity 
          }}
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <SearchX className="w-11 h-11 text-white" />
          </motion.div>
        </motion.div>

        <h1 className="text-headline text-[var(--foreground)] mb-4">
          {t("notFound.title")}
        </h1>
        <p className="text-[var(--muted)] text-lg leading-relaxed mb-10 max-w-sm mx-auto">
          {t("notFound.subtitle")}
        </p>

        <Link href="/">
          <Button size="lg">
            <ArrowLeft className="w-4 h-4" />
            {t("notFound.backHome")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
