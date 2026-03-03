import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.backHome")}
        </Link>

        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2">
            {title}
          </h1>
          <p className="text-[var(--muted)] mb-4">{subtitle}</p>
          {updatedAt && (
            <p className="text-xs text-[var(--muted)] mb-8">
              {t("static.lastUpdated", { date: updatedAt })}
            </p>
          )}

          <div className="prose prose-neutral dark:prose-invert max-w-none text-[var(--muted)]">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
