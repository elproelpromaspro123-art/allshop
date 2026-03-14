import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
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
    >
      <h2>{t("policy.privacy.dataCollectedTitle")}</h2>
      <ul>
        <li>{t("policy.privacy.dataCollected1")}</li>
        <li>{t("policy.privacy.dataCollected2")}</li>
        <li>{t("policy.privacy.dataCollected3")}</li>
      </ul>

      <h2>{t("policy.privacy.dataUseTitle")}</h2>
      <p>{t("policy.privacy.dataUseText")}</p>

      <h2>{t("policy.privacy.protectionTitle")}</h2>
      <p>{t("policy.privacy.protectionText")}</p>

      <h2>{t("policy.privacy.userRightsTitle")}</h2>
      <p>{t("policy.privacy.userRightsText")}</p>
    </StaticPageLayout>
  );
}
