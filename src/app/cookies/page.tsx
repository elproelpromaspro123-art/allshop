import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { ContentBlock, ContentList } from "@/components/ContentBlock";
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
      type="legal"
    >
      <ContentBlock title={t("policy.cookies.whatTitle")}>
        <p>{t("policy.cookies.whatText")}</p>
      </ContentBlock>

      <ContentBlock title={t("policy.cookies.typesTitle")}>
        <ContentList
          variant="dot"
          items={[
            t("policy.cookies.types1"),
            t("policy.cookies.types2"),
            t("policy.cookies.types3"),
          ]}
        />
      </ContentBlock>

      <ContentBlock title={t("policy.cookies.managementTitle")}>
        <p>{t("policy.cookies.managementText")}</p>
      </ContentBlock>
    </StaticPageLayout>
  );
}
