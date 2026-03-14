import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { FeedbackForm } from "@/components/FeedbackForm";
import { getServerT } from "@/lib/i18n";
import { SUPPORT_EMAIL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t("policy.support.title"),
    description: t("policy.support.metaDescription"),
    alternates: {
      canonical: "/soporte",
    },
  };
}

export default async function SupportPage() {
  const supportEmail = SUPPORT_EMAIL;
  const t = await getServerT();

  return (
    <StaticPageLayout
      title={t("policy.support.title")}
      subtitle={t("policy.support.subtitle")}
      updatedAt="2026-03-14"
    >
      <h2>{t("policy.support.mainChannelTitle")}</h2>
      <p>
        {t("policy.support.emailLabel")} <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>
      <p>{t("policy.support.officialEmailNotice")}</p>

      <h2>{t("policy.support.includeInfoTitle")}</h2>
      <ul>
        <li>{t("policy.support.includeInfo1")}</li>
        <li>{t("policy.support.includeInfo2")}</li>
        <li>{t("policy.support.includeInfo3")}</li>
      </ul>

      <h2>{t("policy.support.responseTimesTitle")}</h2>
      <p>{t("policy.support.responseTimesText")}</p>

      <div
        id="feedback-form"
        className="not-prose mt-8 rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
      >
        <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-2">
          {t("policy.support.feedbackTitle")}
        </h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          {t("policy.support.feedbackSubtitle")}
        </p>
        <FeedbackForm />
      </div>
    </StaticPageLayout>
  );
}
