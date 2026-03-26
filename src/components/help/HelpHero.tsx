import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HelpHeroStat {
  label: string;
  value: string;
}

interface HelpHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  stats?: HelpHeroStat[];
  actions?: ReactNode;
}

export function HelpHero({
  eyebrow,
  title,
  description,
  stats = [],
  actions,
}: HelpHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-emerald-200/60 bg-[linear-gradient(180deg,rgba(236,253,245,0.92),rgba(255,255,255,0.98))] px-5 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:px-7 sm:py-8">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute -bottom-8 left-0 h-28 w-28 rounded-full bg-slate-900/5 blur-3xl" />

      <div className="relative z-10 space-y-6">
        <div className="space-y-3">
          <div className="editorial-kicker w-fit">
            {eyebrow}
          </div>
          <div className="space-y-2">
            <h2 className="max-w-3xl text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">
              {title}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              {description}
            </p>
          </div>
        </div>

        {stats.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={`${stat.label}-${stat.value}`}
                className={cn(
                  "rounded-[1.2rem] border border-emerald-200/60 bg-white/82 px-4 py-4 shadow-sm",
                )}
              >
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-950">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
      </div>
    </section>
  );
}
