"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { TRUST_VISUALS } from "@/lib/trust-visuals";

interface TrustBarProps {
  className?: string;
  variant?: "horizontal" | "vertical" | "compact";
}

export function TrustBar({ className, variant = "horizontal" }: TrustBarProps) {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const trustItems = [
    {
      image: TRUST_VISUALS.warranty,
      title: t("trustbar.guaranteeTitle"),
      description: t("trustbar.guaranteeDesc"),
    },
    {
      image: TRUST_VISUALS.payment,
      title: t("trustbar.paymentTitle"),
      description: t("trustbar.paymentDesc"),
    },
    {
      image: TRUST_VISUALS.returns,
      title: t("trustbar.returnsTitle"),
      description: t("trustbar.returnsDesc"),
    },
    {
      image: TRUST_VISUALS.security,
      title: t("trustbar.securityTitle"),
      description: t("trustbar.securityDesc"),
    },
    {
      image: TRUST_VISUALS.support,
      title: t("trustbar.supportTitle"),
      description: t("trustbar.supportDesc"),
    },
  ];

  if (variant === "compact") {
    return (
      <div
        className={cn(
          `flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-3 ${isDark ? "text-neutral-500" : "text-[var(--muted)]"}`,
          className
        )}
      >
        {trustItems.slice(0, 4).map((item) => (
          <div key={item.title} className="flex items-center gap-1.5">
            <Image
              src={item.image}
              alt={item.title}
              width={16}
              height={16}
              className="w-4 h-4 rounded-full object-cover"
            />
            <span className="text-xs font-medium">{item.title}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={cn("space-y-3", className)}>
        {trustItems.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3"
          >
            <div
              className={`shrink-0 w-8 h-8 rounded-lg overflow-hidden border ${isDark
                  ? "bg-white/[0.05] text-[var(--accent)]"
                  : "bg-[var(--surface-muted)] text-[var(--accent-dim)]"
                }`}
            >
              <Image
                src={item.image}
                alt={item.title}
                width={32}
                height={32}
                className="w-8 h-8 object-cover"
              />
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-[var(--foreground)]"
                  }`}
              >
                {item.title}
              </p>
              <p
                className={`text-xs ${isDark ? "text-neutral-500" : "text-[var(--muted)]"
                  }`}
              >
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-4", className)}>
      {trustItems.map((item) => (
        <div
          key={item.title}
          className="flex flex-col items-center text-center gap-2 p-4"
        >
          <div
            className={`w-10 h-10 rounded-xl overflow-hidden border ${isDark
                ? "bg-white/[0.05] text-[var(--accent)]"
                : "bg-[var(--surface-muted)] text-[var(--accent-dim)]"
              }`}
          >
            <Image
              src={item.image}
              alt={item.title}
              width={40}
              height={40}
              className="w-10 h-10 object-cover"
            />
          </div>
          <div>
            <p
              className={`text-sm font-semibold ${isDark ? "text-white" : "text-[var(--foreground)]"
                }`}
            >
              {item.title}
            </p>
            <p
              className={`text-xs ${isDark ? "text-neutral-500" : "text-[var(--muted)]"
                }`}
            >
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
