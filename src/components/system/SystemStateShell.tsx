import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SystemStateShellProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  badge?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  tone?: "neutral" | "danger" | "warning";
}

const toneClasses: Record<
  NonNullable<SystemStateShellProps["tone"]>,
  string
> = {
  neutral:
    "from-emerald-500/12 via-transparent to-transparent border-emerald-200/70",
  danger: "from-rose-500/14 via-transparent to-transparent border-rose-200/75",
  warning:
    "from-amber-500/14 via-transparent to-transparent border-amber-200/75",
};

export function SystemStateShell({
  title,
  subtitle,
  eyebrow,
  badge,
  icon,
  actions,
  children,
  className,
  tone = "neutral",
}: SystemStateShellProps) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-[2rem] border bg-white px-6 py-7 shadow-[0_30px_90px_rgba(15,23,42,0.08)] sm:px-8 sm:py-9",
        toneClasses[tone],
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.04),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/35 to-transparent" />

      <div className="relative z-10">
        {(eyebrow || badge) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {eyebrow ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {eyebrow}
              </span>
            ) : null}
            {badge ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {badge}
              </span>
            ) : null}
          </div>
        )}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-[0_18px_42px_rgba(15,23,42,0.16)]">
              {icon}
            </div>
            <h1 className="text-[2rem] font-black tracking-[-0.06em] text-slate-950 sm:text-[2.8rem] sm:leading-[0.95]">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              {subtitle}
            </p>
          </div>

          {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
        </div>

        {children ? <div className="relative z-10 mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
