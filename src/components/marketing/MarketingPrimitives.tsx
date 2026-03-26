import type { ReactNode } from "react";
import { Quote, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MarketingTone =
  | "emerald"
  | "sky"
  | "violet"
  | "amber"
  | "rose"
  | "slate";

const toneClasses: Record<
  MarketingTone,
  {
    surface: string;
    border: string;
    icon: string;
    halo: string;
    text: string;
    muted: string;
    ring: string;
  }
> = {
  emerald: {
    surface: "from-emerald-50/92 via-white to-white",
    border: "border-emerald-200/70",
    icon: "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700",
    halo: "bg-emerald-200/35",
    text: "text-emerald-700",
    muted: "text-emerald-600/75",
    ring: "ring-emerald-200/60",
  },
  sky: {
    surface: "from-sky-50/92 via-white to-white",
    border: "border-sky-200/70",
    icon: "bg-gradient-to-br from-sky-100 to-sky-200 text-sky-700",
    halo: "bg-sky-200/35",
    text: "text-sky-700",
    muted: "text-sky-600/75",
    ring: "ring-sky-200/60",
  },
  violet: {
    surface: "from-violet-50/92 via-white to-white",
    border: "border-violet-200/70",
    icon: "bg-gradient-to-br from-violet-100 to-violet-200 text-violet-700",
    halo: "bg-violet-200/35",
    text: "text-violet-700",
    muted: "text-violet-600/75",
    ring: "ring-violet-200/60",
  },
  amber: {
    surface: "from-amber-50/92 via-white to-white",
    border: "border-amber-200/70",
    icon: "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700",
    halo: "bg-amber-200/35",
    text: "text-amber-700",
    muted: "text-amber-600/75",
    ring: "ring-amber-200/60",
  },
  rose: {
    surface: "from-rose-50/92 via-white to-white",
    border: "border-rose-200/70",
    icon: "bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700",
    halo: "bg-rose-200/35",
    text: "text-rose-700",
    muted: "text-rose-600/75",
    ring: "ring-rose-200/60",
  },
  slate: {
    surface: "from-slate-100/92 via-white to-white",
    border: "border-slate-200/70",
    icon: "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700",
    halo: "bg-slate-200/35",
    text: "text-slate-700",
    muted: "text-slate-600/75",
    ring: "ring-slate-200/60",
  },
};

export function MarketingSurface({
  children,
  className,
  tone = "emerald",
}: {
  children: ReactNode;
  className?: string;
  tone?: MarketingTone;
}) {
  const theme = toneClasses[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.85rem] border bg-gradient-to-br shadow-[0_24px_80px_rgba(15,23,42,0.08)]",
        theme.surface,
        theme.border,
        className,
      )}
    >
      <div className={cn("absolute -right-16 -top-14 h-44 w-44 rounded-full blur-3xl", theme.halo)} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function MarketingSignalCard({
  icon: Icon,
  title,
  description,
  tone = "emerald",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: MarketingTone;
  className?: string;
}) {
  const theme = toneClasses[tone];

  return (
    <div
      className={cn(
        "group rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-4 shadow-[0_14px_38px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset",
            theme.icon,
            theme.ring,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-[-0.02em] text-slate-950">
            {title}
          </p>
          <p className={cn("mt-1 text-sm leading-6", theme.muted)}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function MarketingBadgePill({
  icon: Icon,
  label,
  sublabel,
  tone = "emerald",
  className,
  labelClassName,
  sublabelClassName,
}: {
  icon?: LucideIcon;
  label: string;
  sublabel?: string;
  tone?: MarketingTone;
  className?: string;
  labelClassName?: string;
  sublabelClassName?: string;
}) {
  const theme = toneClasses[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-white/92 px-3 py-1.5 text-left text-xs font-semibold shadow-[0_10px_28px_rgba(15,23,42,0.05)]",
        theme.border,
        className,
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-inset",
            theme.icon,
            theme.ring,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <span className="flex flex-col leading-tight">
        <span className={cn("font-bold", theme.text, labelClassName)}>
          {label}
        </span>
        {sublabel ? (
          <span
            className={cn(
              "text-[11px] font-medium text-slate-500",
              sublabelClassName,
            )}
          >
            {sublabel}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function MarketingSectionHeader({
  eyebrow,
  title,
  description,
  meta,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-slate-200/70 pb-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-emerald-700">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-[2rem]">
          {title}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          {description}
        </p>
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </div>
  );
}

export function MarketingQuoteCard({
  name,
  city,
  date,
  text,
  rating,
  className,
}: {
  name: string;
  city: string;
  date: string;
  text: string;
  rating: number;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_48px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_58px_rgba(15,23,42,0.1)] sm:p-6",
        className,
      )}
    >
      <div className="absolute right-4 top-4 text-emerald-100 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-6">
        <Quote className="h-8 w-8" />
      </div>

      <div className="relative z-[1] flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              "h-4 w-4",
              index < rating
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200",
            )}
          />
        ))}
      </div>

      <p className="relative z-[1] mt-4 text-sm leading-7 text-slate-600">
        {text}
      </p>

      <div className="relative z-[1] mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-xs font-black text-emerald-800">
          {name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-[-0.02em] text-slate-950">
            {name}
          </p>
          <p className="truncate text-xs font-medium text-slate-500">
            {city} · {date}
          </p>
        </div>
      </div>
    </article>
  );
}
