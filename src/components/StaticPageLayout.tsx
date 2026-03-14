import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { getServerT } from "@/lib/i18n";

interface StaticPageLayoutProps {
  title: string;
  subtitle: string;
  updatedAt?: string;
  children: ReactNode;
}

export async function StaticPageLayout({
  title,
  subtitle,
  updatedAt,
  children,
}: StaticPageLayoutProps) {
  const t = await getServerT();

  return (
    <section className="bg-[var(--background)] min-h-screen">
      {/* Decorative gradient header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--accent-strong)]/8 via-[var(--background)] to-[var(--surface)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--accent-strong)_0%,transparent_70%)] opacity-[0.07]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 sm:pb-20">
          {/* Breadcrumb-style back link */}
          <nav className="mb-8 sm:mb-10">
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] shadow-sm hover:text-[var(--foreground)] hover:border-[var(--accent-strong)]/40 hover:shadow-md transition-all duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
              {t("common.backHome")}
            </Link>
          </nav>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--foreground)] mb-3 sm:mb-4">
            {title}
          </h1>
          <p className="text-base sm:text-lg text-[var(--muted)] max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Content card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 pb-12 sm:pb-16">
        <div className="relative bg-[var(--surface)] rounded-[var(--card-radius)] border border-[var(--border)] shadow-lg shadow-black/[0.04] overflow-hidden">
          {/* Green accent line */}
          <div className="h-[3px] bg-gradient-to-r from-[var(--accent-strong)] via-[var(--accent-strong)]/70 to-transparent" />

          <div className="p-6 sm:p-8 lg:p-10">
            {updatedAt && (
              <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-8 pb-6 border-b border-[var(--border)]">
                <CalendarDays className="w-3.5 h-3.5 text-[var(--accent-strong)]" />
                <span>{t("static.lastUpdated", { date: updatedAt })}</span>
              </div>
            )}

            <div className="prose prose-neutral max-w-none text-[var(--muted)] prose-headings:text-[var(--foreground)] prose-headings:font-semibold prose-p:leading-relaxed prose-li:leading-relaxed prose-a:text-[var(--accent-strong)] prose-a:no-underline hover:prose-a:underline">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
