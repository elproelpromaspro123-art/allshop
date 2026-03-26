import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { ContentBlock, ContentList } from "@/components/ContentBlock";
import { FeedbackForm } from "@/components/FeedbackForm";
import { SupportHub } from "@/components/support/SupportHub";
import { getServerT } from "@/lib/i18n";
import { safeJsonLd } from "@/lib/json-ld";
import {
  buildStaticPageBreadcrumbs,
  buildStaticPageMetadata,
  generateBreadcrumbJsonLd,
  generateContactPageJsonLd,
} from "@/lib/seo";
import { SUPPORT_EMAIL, WHATSAPP_PHONE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return buildStaticPageMetadata({
    title: t("policy.support.title"),
    description: t("policy.support.metaDescription"),
    path: "/soporte",
  });
}

export default async function SupportPage() {
  const t = await getServerT();
  const title = t("policy.support.title");
  const description = t("policy.support.metaDescription");
  const structuredData = [
    generateContactPageJsonLd({
      title,
      description,
      path: "/soporte",
    }),
    generateBreadcrumbJsonLd(
      buildStaticPageBreadcrumbs({
        title,
        path: "/soporte",
        type: "help",
      }),
    ),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
      />
      <StaticPageLayout
        title={title}
        subtitle={t("policy.support.subtitle")}
        updatedAt="2026-03-25"
        type="help"
        path="/soporte"
      >
        <div className="space-y-5">
        <SupportHub />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
          <ContentBlock
            title={t("policy.support.mainChannelTitle")}
            variant="highlight"
          >
            <ContentList
              items={[
                `${t("policy.support.emailLabel")} ${SUPPORT_EMAIL} - canal oficial para pedidos, soporte y validacion.`,
                `WhatsApp +${WHATSAPP_PHONE} - ideal para dudas rapidas, contexto de compra y seguimiento.`,
                "Seguimiento - revisa el estado de tu pedido, la referencia y los proximos pasos.",
                "Devoluciones y garantia - consulta condiciones, cobertura y el flujo recomendado.",
              ]}
            />
            <p className="pt-1 text-xs leading-6 text-emerald-700">
              {t("policy.support.officialEmailNotice")}
            </p>
          </ContentBlock>

          <ContentBlock title={t("policy.support.responseTimesTitle")}>
            <ContentList
              items={[
                t("policy.support.responseTimesText"),
                "Usa el mismo correo con el que hiciste la compra para acelerar la ubicacion del pedido.",
                "Si escribes por WhatsApp, incluye el numero de pedido o la referencia para no repetir pasos.",
              ]}
            />
          </ContentBlock>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <ContentBlock title={t("policy.support.includeInfoTitle")}>
            <ContentList
              items={[
                t("policy.support.includeInfo1"),
                t("policy.support.includeInfo2"),
                t("policy.support.includeInfo3"),
              ]}
            />
          </ContentBlock>

          <ContentBlock title="Ruta recomendada" variant="highlight">
            <ContentList
              items={[
                "Primero revisa FAQ, envios y devoluciones si tu duda es operativa.",
                "Si necesitas verificacion de pedido, usa seguimiento con tu referencia.",
                "Si quieres reportar una mejora o incidencia, abre el formulario de feedback.",
              ]}
            />
          </ContentBlock>
        </div>

        <section
          id="feedback-form"
          className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] px-5 py-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:px-6 sm:py-7"
        >
          <div className="mb-5 space-y-2">
            <h2 className="text-2xl font-black tracking-[-0.05em] text-white sm:text-3xl">
              {t("policy.support.feedbackTitle")}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
              {t("policy.support.feedbackSubtitle")}
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_44px_rgba(15,23,42,0.12)] sm:p-5">
            <FeedbackForm />
          </div>
        </section>
        </div>
      </StaticPageLayout>
    </>
  );
}
