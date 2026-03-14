import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { getServerT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t("policy.returns.title"),
    description: t("policy.returns.metaDescription"),
    alternates: {
      canonical: "/devoluciones",
    },
  };
}

export default async function ReturnsPage() {
  const t = await getServerT();

  return (
    <StaticPageLayout
      title={t("policy.returns.title")}
      subtitle={t("policy.returns.subtitle")}
      updatedAt="2026-03-14"
    >
      <h2>{t("policy.returns.requestWindowTitle")}</h2>
      <p>{t("policy.returns.requestWindowText")}</p>

      <h2>{t("policy.returns.eligibilityTitle")}</h2>
      <ul>
        <li>{t("policy.returns.eligibility1")}</li>
        <li>{t("policy.returns.eligibility2")}</li>
        <li>{t("policy.returns.eligibility3")}</li>
      </ul>

      <h2>{t("policy.returns.nonEligibleTitle")}</h2>
      <ul>
        <li>{t("policy.returns.nonEligible1")}</li>
        <li>{t("policy.returns.nonEligible2")}</li>
      </ul>

      <h2>{t("policy.returns.refundTitle")}</h2>
      <p>{t("policy.returns.refundText")}</p>
    </StaticPageLayout>
  );
}
