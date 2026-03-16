import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { ContentBlock, ContentList } from "@/components/ContentBlock";
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
      type="help"
    >
      <ContentBlock title={t("policy.support.mainChannelTitle")}>
        <p>
          {t("policy.support.emailLabel")}{" "}
          <a href={`mailto:${supportEmail}`} className="text-[var(--accent-strong)] hover:underline">
            {supportEmail}
          </a>
        </p>
        <p className="text-xs text-[var(--muted-soft)]">{t("policy.support.officialEmailNotice")}</p>
      </ContentBlock>

      <ContentBlock title={t("policy.support.includeInfoTitle")}>
        <ContentList
          items={[
            t("policy.support.includeInfo1"),
            t("policy.support.includeInfo2"),
            t("policy.support.includeInfo3"),
          ]}
        />
      </ContentBlock>

      <ContentBlock title={t("policy.support.responseTimesTitle")}>
        <p>{t("policy.support.responseTimesText")}</p>
      </ContentBlock>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5 sm:p-6">
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">
          {t("policy.support.feedbackTitle")}
        </h3>
        <p className="text-sm text-[var(--muted)] mb-4">
          {t("policy.support.feedbackSubtitle")}
        </p>
        <FeedbackForm />
      </div>
    </StaticPageLayout>
  );
}
