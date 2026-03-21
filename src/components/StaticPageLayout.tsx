import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  HelpCircle,
  Scale,
} from "lucide-react";
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
    <section className="v-section relative bg-[var(--background)]" data-tone="mist">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,212,130,0.08),transparent_34%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_32%)]" />
      <div className="absolute top-56 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.84),transparent_72%)] blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-10 sm:pb-14">
        <nav className="mb-6 sm:mb-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--muted)] shadow-[var(--shadow-card)] backdrop-blur hover:border-[var(--accent)]/25 hover:text-[var(--foreground)] transition-all duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            {t("common.backHome")}
          </Link>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_340px] lg:items-stretch">
          <div className="surface-panel px-5 py-6 sm:px-8 sm:py-9 lg:px-10">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(135deg,var(--secondary-surface),var(--accent-surface))] shadow-[var(--shadow-card)]">
                <Icon className="w-5 h-5 text-[var(--secondary-strong)]" />
              </div>
              {updatedAt && (
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-white px-3 py-1.5 text-[11px] font-medium text-[var(--muted)] shadow-sm">
                  <CalendarDays className="w-3.5 h-3.5 text-[var(--accent-strong)]" />
                  <span>{t("static.lastUpdated", { date: updatedAt })}</span>
                </div>
              )}
            </div>

            <h1 className="max-w-3xl text-headline text-[var(--foreground)]">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              {subtitle}
            </p>
          </div>

          <aside className="surface-panel-dark surface-ambient brand-v-slash px-5 py-6 sm:px-6 sm:py-7 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
              <Icon className="w-6 h-6 text-emerald-300" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
              Vortixy
            </p>
            <p className="mt-3 text-lg font-semibold leading-tight text-white">
              {title}
            </p>
            <p className="mt-3 text-sm leading-7 text-white/72">{subtitle}</p>
            {updatedAt && (
              <div className="mt-6 rounded-[calc(var(--radius-md)-4px)] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/76">
                <div className="flex items-center gap-2 text-white/55">
                  <CalendarDays className="w-4 h-4 text-emerald-300" />
                  <span>{t("static.lastUpdated", { date: updatedAt })}</span>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className="space-y-5 sm:space-y-6">{children}</div>
      </div>
    </section>
  );
}
