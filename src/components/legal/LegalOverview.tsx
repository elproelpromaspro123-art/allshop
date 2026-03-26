import type { ReactNode } from "react";
import { BadgeInfo } from "lucide-react";

interface LegalFact {
  label: string;
  value: string;
  note: string;
}

interface LegalOverviewProps {
  eyebrow: string;
  title: string;
  description: string;
  facts: LegalFact[];
  footer?: ReactNode;
}

export function LegalOverview({
  eyebrow,
  title,
  description,
  facts,
  footer,
}: LegalOverviewProps) {
  return (
    <section className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
            <BadgeInfo className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
            {description}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:w-[34rem]">
          {facts.map((fact) => (
            <article
              key={fact.label}
              className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {fact.label}
              </div>
              <div className="mt-2 text-base font-semibold text-slate-950">
                {fact.value}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {fact.note}
              </p>
            </article>
          ))}
        </div>
      </div>

      {footer && (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-white/80 p-4 text-sm leading-relaxed text-slate-600 shadow-sm">
          {footer}
        </div>
      )}
    </section>
  );
}
