import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { ContentBlock, ContentList } from "@/components/ContentBlock";
import { getServerT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t("policy.privacy.title"),
    description: t("policy.privacy.metaDescription"),
    alternates: {
      canonical: "/privacidad",
    },
  };
}

export default async function PrivacyPage() {
  const t = await getServerT();

  return (
    <StaticPageLayout
      title={t("policy.privacy.title")}
      subtitle={t("policy.privacy.subtitle")}
      updatedAt="2026-03-14"
      type="legal"
    >
      <ContentBlock title={t("policy.privacy.dataCollectedTitle")}>
        <ContentList
          items={[
            t("policy.privacy.dataCollected1"),
            t("policy.privacy.dataCollected2"),
            t("policy.privacy.dataCollected3"),
          ]}
        />
      </ContentBlock>

      <ContentBlock title={t("policy.privacy.dataUseTitle")}>
        <p>{t("policy.privacy.dataUseText")}</p>
      </ContentBlock>

      <ContentBlock title={t("policy.privacy.protectionTitle")}>
        <p>{t("policy.privacy.protectionText")}</p>
      </ContentBlock>

      <ContentBlock title={t("policy.privacy.userRightsTitle")}>
        <p>{t("policy.privacy.userRightsText")}</p>
      </ContentBlock>
    </StaticPageLayout>
  );
}
