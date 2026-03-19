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
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <ContentBlock
          title={t("policy.support.mainChannelTitle")}
          variant="highlight"
        >
          <p>
            {t("policy.support.emailLabel")}{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="font-semibold text-[var(--accent-strong)] hover:underline"
            >
              {supportEmail}
            </a>
          </p>
          <p className="text-xs text-[var(--muted-soft)]">
            {t("policy.support.officialEmailNotice")}
          </p>
        </ContentBlock>

        <ContentBlock title={t("policy.support.responseTimesTitle")}>
          <p>{t("policy.support.responseTimesText")}</p>
        </ContentBlock>
      </div>

      <ContentBlock title={t("policy.support.includeInfoTitle")}>
        <ContentList
          items={[
            t("policy.support.includeInfo1"),
            t("policy.support.includeInfo2"),
            t("policy.support.includeInfo3"),
          ]}
        />
      </ContentBlock>

      <div className="surface-panel-dark surface-ambient brand-v-slash px-5 py-6 sm:px-6 sm:py-7 text-white">
        <h3 className="mb-2 text-base font-semibold text-white sm:text-lg">
          {t("policy.support.feedbackTitle")}
        </h3>
        <p className="mb-5 max-w-2xl text-sm leading-7 text-white/70">
          {t("policy.support.feedbackSubtitle")}
        </p>
        <div className="surface-panel p-4 sm:p-5">
          <FeedbackForm />
        </div>
      </div>
    </StaticPageLayout>
  );
}
