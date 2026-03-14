import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { getServerT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t("policy.cookies.title"),
    description: t("policy.cookies.metaDescription"),
    alternates: {
      canonical: "/cookies",
    },
  };
}

export default async function CookiesPage() {
  const t = await getServerT();

  return (
    <StaticPageLayout
      title={t("policy.cookies.title")}
      subtitle={t("policy.cookies.subtitle")}
      updatedAt="2026-03-14"
    >
      <h2>{t("policy.cookies.whatTitle")}</h2>
      <p>{t("policy.cookies.whatText")}</p>

      <h2>{t("policy.cookies.typesTitle")}</h2>
      <ul>
        <li>{t("policy.cookies.types1")}</li>
        <li>{t("policy.cookies.types2")}</li>
        <li>{t("policy.cookies.types3")}</li>
      </ul>

      <h2>{t("policy.cookies.managementTitle")}</h2>
      <p>{t("policy.cookies.managementText")}</p>
    </StaticPageLayout>
  );
}
