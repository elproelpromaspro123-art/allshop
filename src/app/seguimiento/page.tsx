import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { getServerT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t("policy.tracking.title"),
    description: t("policy.tracking.metaDescription"),
    alternates: {
      canonical: "/seguimiento",
    },
  };
}

export default async function TrackingPage() {
  const t = await getServerT();

  return (
    <StaticPageLayout
      title={t("policy.tracking.title")}
      subtitle={t("policy.tracking.subtitle")}
      updatedAt="2026-03-03"
    >
      <h2>{t("policy.tracking.howTitle")}</h2>
      <ol>
        <li>{t("policy.tracking.how1")}</li>
        <li>{t("policy.tracking.how2")}</li>
        <li>{t("policy.tracking.how3")}</li>
      </ol>

      <h2>{t("policy.tracking.timesTitle")}</h2>
      <ul>
        <li>{t("policy.tracking.times1")}</li>
        <li>{t("policy.tracking.times2")}</li>
        <li>{t("policy.tracking.times3")}</li>
      </ul>

      <h2>{t("policy.tracking.noMovementTitle")}</h2>
      <p>{t("policy.tracking.noMovementText")}</p>
    </StaticPageLayout>
  );
}
