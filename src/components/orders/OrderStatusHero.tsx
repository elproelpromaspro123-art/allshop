"use client";
import { useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Clock3,
  Copy,
  ShieldAlert,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatusTone = "success" | "warning" | "danger";
type OrderStatusHeroIcon = "tracking" | "success" | "pending" | "danger" | LucideIcon;

const TONE_STYLES: Record<
  OrderStatusTone,
  {
    shell: string;
    badge: string;
    icon: string;
    accent: string;
  }
> = {
  success: {
    shell: "border-emerald-200/70 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98))]",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: "bg-emerald-500/12 text-emerald-700",
    accent: "text-emerald-700",
  },
  warning: {
    shell: "border-amber-200/70 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.98))]",
    badge: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "bg-amber-500/12 text-amber-700",
    accent: "text-amber-700",
  },
  danger: {
    shell: "border-rose-200/70 bg-[linear-gradient(180deg,rgba(255,241,242,0.96),rgba(255,255,255,0.98))]",
    badge: "border-rose-200 bg-rose-50 text-rose-800",
    icon: "bg-rose-500/12 text-rose-700",
    accent: "text-rose-700",
  },
};

interface OrderStatusHeroProps {
  tone: OrderStatusTone;
  icon: OrderStatusHeroIcon;
  badge: string;
  title: string;
  subtitle: string;
  reference?: string | null;
  referenceLabel: string;
  actions: ReactNode;
  note?: ReactNode;
}

export function OrderStatusHero({
  tone,
  badge,
  title,
  subtitle,
  reference,
  referenceLabel,
  icon,
  actions,
  note,
}: OrderStatusHeroProps) {
  const styles = TONE_STYLES[tone];
  const [copied, setCopied] = useState(false);
  const cleanReference = reference?.trim() || "";
  const Icon =
    typeof icon !== "string"
      ? icon
      : icon === "tracking"
      ? Waypoints
      : icon === "success"
        ? CheckCircle2
        : icon === "pending"
          ? Clock3
          : ShieldAlert;

  const handleCopy = async () => {
    if (!cleanReference || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(cleanReference);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className={cn("overflow-hidden rounded-[2rem] border shadow-[0_24px_70px_rgba(15,23,42,0.08)]", styles.shell)}>
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/50 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-emerald-400/8 blur-3xl" />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-5">
              <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em]", styles.badge)}>
                <Icon className={cn("h-3.5 w-3.5", styles.accent)} />
                {badge}
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl lg:text-5xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  {subtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">{actions}</div>
          </div>

          {cleanReference ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                {referenceLabel}
              </span>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 shadow-sm">
                <span className="font-mono text-sm font-semibold text-slate-950">
                  {cleanReference}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-950/5 hover:text-slate-950"
                  aria-label="Copiar referencia"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {copied ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Copiado
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {note ? <div className="mt-6">{note}</div> : null}
        </div>
      </div>
    </section>
  );
}
