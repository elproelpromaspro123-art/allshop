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
    <section className="bg-neutral-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.backHome")}
        </Link>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
            {title}
          </h1>
          <p className="text-neutral-600 mb-4">{subtitle}</p>
          {updatedAt && (
            <p className="text-xs text-neutral-500 mb-8">
              {t("static.lastUpdated", { date: updatedAt })}
            </p>
          )}

          <div className="prose prose-neutral max-w-none text-neutral-700">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
