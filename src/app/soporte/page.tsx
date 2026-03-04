import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { getServerT } from "@/lib/i18n";

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
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "soporte@vortixy.co";
  const t = await getServerT();

  return (
    <StaticPageLayout
      title={t("policy.support.title")}
      subtitle={t("policy.support.subtitle")}
      updatedAt="2026-03-03"
    >
      <h2>{t("policy.support.mainChannelTitle")}</h2>
      <p>
        {t("policy.support.emailLabel")} <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>

      <h2>{t("policy.support.includeInfoTitle")}</h2>
      <ul>
        <li>{t("policy.support.includeInfo1")}</li>
        <li>{t("policy.support.includeInfo2")}</li>
        <li>{t("policy.support.includeInfo3")}</li>
      </ul>

      <h2>{t("policy.support.responseTimesTitle")}</h2>
      <p>{t("policy.support.responseTimesText")}</p>
    </StaticPageLayout>
  );
}

