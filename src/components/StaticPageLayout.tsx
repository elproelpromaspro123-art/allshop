import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, FileText, HelpCircle, Scale } from "lucide-react";
import { getServerT } from "@/lib/i18n";

interface StaticPageLayoutProps {
  title: string;
  subtitle: string;
  updatedAt?: string;
  type?: "default" | "help" | "legal";
  children: ReactNode;
}

export async function StaticPageLayout({
  title,
  subtitle,
  updatedAt,
  type = "default",
  children,
}: StaticPageLayoutProps) {
  const t = await getServerT();

  const icons = {
    default: FileText,
    help: HelpCircle,
    legal: Scale,
  };
  const Icon = icons[type];

  return (
    <section className="bg-[var(--background)] min-h-screen">
      {/* Decorative gradient header */}
      <div className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--secondary)_0%,transparent_70%)] opacity-[0.04]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--accent)_0%,transparent_60%)] opacity-[0.03]" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10 sm:pb-14">
          {/* Breadcrumb-style back link */}
          <nav className="mb-8">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--muted)] shadow-sm hover:text-[var(--foreground)] hover:border-[var(--secondary)]/40 hover:shadow-md transition-all duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
              {t("common.backHome")}
            </Link>
          </nav>

          {/* Title with icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--secondary-surface)] to-[var(--accent-surface)] border border-[var(--border-subtle)] shadow-sm">
              <Icon className="w-5 h-5 text-[var(--secondary-strong)]" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--foreground)] mb-3">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Content card */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="relative bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-card)] overflow-hidden">
          {/* Subtle accent line */}
          <div className="h-px bg-gradient-to-r from-[var(--accent)] via-[var(--border)] to-transparent opacity-60" />

          <div className="p-5 sm:p-7 lg:p-9">
            {updatedAt && (
              <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-6 pb-5 border-b border-[var(--border-subtle)]">
                <CalendarDays className="w-3.5 h-3.5 text-[var(--secondary-strong)]" />
                <span>{t("static.lastUpdated", { date: updatedAt })}</span>
              </div>
            )}

            <div className="space-y-6 text-[var(--muted)] leading-relaxed">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
