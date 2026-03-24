import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { ContentBlock, ContentList } from "@/components/ContentBlock";
import { MyOrdersPanel } from "@/components/orders/MyOrdersPanel";
import { getServerT } from "@/lib/i18n";
import { storefrontContent } from "@/content/config/storefront-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t("policy.tracking.title"),
    description: t("policy.tracking.metaDescription"),
    alternates: {
      canonical: "/seguimiento",
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function TrackingPage() {
  const t = await getServerT();
  const { support } = storefrontContent;

  return (
    <StaticPageLayout
      title={t("policy.tracking.title")}
      subtitle={t("policy.tracking.subtitle")}
      updatedAt="2026-03-14"
      type="help"
    >
      <div className="not-prose surface-panel-dark surface-ambient brand-v-slash px-5 py-5 text-white">
        <p className="text-sm font-medium text-white/88">
          {t("policy.tracking.emailNotice")}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {support.tracking.map((item) => (
            <div
              key={item}
              className="rounded-[1.15rem] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-7 text-white/80"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="not-prose">
        <MyOrdersPanel />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ContentBlock title={t("policy.tracking.howTitle")}>
          <ContentList
            items={[
              t("policy.tracking.how1"),
              t("policy.tracking.how2"),
              t("policy.tracking.how3"),
            ]}
          />
        </ContentBlock>

        <ContentBlock title={t("policy.tracking.timesTitle")}>
          <ContentList
            items={[
              t("policy.tracking.times1"),
              t("policy.tracking.times2"),
              t("policy.tracking.times3"),
            ]}
          />
        </ContentBlock>

        <ContentBlock
          title={t("policy.tracking.noMovementTitle")}
          variant="highlight"
        >
          <p>{t("policy.tracking.noMovementText")}</p>
        </ContentBlock>
      </div>
    </StaticPageLayout>
  );
}
