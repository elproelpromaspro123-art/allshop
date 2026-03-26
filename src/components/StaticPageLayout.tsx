import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  FileText,
  HelpCircle,
  Scale,
} from "lucide-react";
import { getServerT } from "@/lib/i18n";
import { buildStaticPageBreadcrumbs } from "@/lib/seo";

interface StaticPageLayoutProps {
  title: string;
  subtitle: string;
  updatedAt?: string;
  type?: "default" | "help" | "legal";
  path?: string;
  children: ReactNode;
}

export async function StaticPageLayout({
  title,
  subtitle,
  updatedAt,
  type = "default",
  path = "/",
  children,
}: StaticPageLayoutProps) {
  const t = await getServerT();

  const icons = {
    default: FileText,
    help: HelpCircle,
    legal: Scale,
  };
  const Icon = icons[type];
  const breadcrumbs = buildStaticPageBreadcrumbs({
    title,
    path,
    type,
  });

  return (
    <section className="min-h-screen bg-gray-50/50">
      {/* Clean header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8">
          <nav className="mb-6">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:text-gray-900"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
              {t("common.backHome")}
            </Link>
          </nav>

          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
          >
            {breadcrumbs.map((breadcrumb, index) => {
              const isCurrent = index === breadcrumbs.length - 1;
              return (
                <div
                  key={`${breadcrumb.path}-${breadcrumb.name}`}
                  className="inline-flex items-center gap-2"
                >
                  {isCurrent ? (
                    <span
                      aria-current="page"
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700"
                    >
                      {breadcrumb.name}
                    </span>
                  ) : (
                    <Link
                      href={breadcrumb.path}
                      className="rounded-full border border-transparent px-2 py-1 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                    >
                      {breadcrumb.name}
                    </Link>
                  )}

                  {!isCurrent ? (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
                {subtitle}
              </p>
              {updatedAt && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{t("static.lastUpdated", { date: updatedAt })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="space-y-4 sm:space-y-5">{children}</div>
      </div>
    </section>
  );
}
