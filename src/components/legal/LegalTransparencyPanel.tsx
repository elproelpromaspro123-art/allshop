import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

interface TransparencyColumn {
  title: string;
  description: string;
  bullets: string[];
}

interface LegalTransparencyPanelProps {
  title: string;
  description: string;
  columns: TransparencyColumn[];
  note?: ReactNode;
}

export function LegalTransparencyPanel({
  title,
  description,
  columns,
  note,
}: LegalTransparencyPanelProps) {
  return (
    <section className="rounded-[28px] border border-slate-100 bg-slate-950 px-6 py-8 text-white shadow-sm sm:px-8">
      <div className="max-w-2xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
          Transparencia
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-[15px]">
          {description}
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <article
            key={column.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <h3 className="text-base font-semibold text-white">{column.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {column.description}
            </p>
            <ul className="mt-4 space-y-3">
              {column.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {note && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-slate-300">
          {note}
        </div>
      )}
    </section>
  );
}
