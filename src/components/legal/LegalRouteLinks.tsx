import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LegalRouteLink {
  href: string;
  title: string;
  description: string;
  accent?: string;
}

interface LegalRouteLinksProps {
  title: string;
  description: string;
  links: LegalRouteLink[];
}

export function LegalRouteLinks({
  title,
  description,
  links,
}: LegalRouteLinksProps) {
  return (
    <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
          {description}
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "group rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-200",
              "hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-sm",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-slate-950">
                  {link.title}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {link.description}
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors duration-200 group-hover:border-emerald-200 group-hover:text-emerald-600">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            {link.accent && (
              <div className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 shadow-sm">
                {link.accent}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
