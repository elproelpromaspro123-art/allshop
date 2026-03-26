import type { Metadata } from "next";
import Link from "next/link";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { ContentBlock, ContentList } from "@/components/ContentBlock";
import { HabeasDataForm } from "@/components/HabeasDataForm";
import { LegalOverview } from "@/components/legal/LegalOverview";
import { LegalRouteLinks } from "@/components/legal/LegalRouteLinks";
import { LegalTransparencyPanel } from "@/components/legal/LegalTransparencyPanel";
import { getServerT } from "@/lib/i18n";
import { safeJsonLd } from "@/lib/json-ld";
import {
  buildStaticPageBreadcrumbs,
  buildStaticPageMetadata,
  generateBreadcrumbJsonLd,
  generateWebPageJsonLd,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  const title = t("policy.privacy.title");
  const description = t("policy.privacy.metaDescription");

  return buildStaticPageMetadata({
    title,
    description,
    path: "/privacidad",
    openGraphType: "article",
  });
}

export default async function PrivacyPage() {
  const t = await getServerT();
  const title = t("policy.privacy.title");
  const description = t("policy.privacy.metaDescription");
  const structuredData = [
    generateWebPageJsonLd({
      title,
      description,
      path: "/privacidad",
    }),
    generateBreadcrumbJsonLd(
      buildStaticPageBreadcrumbs({
        title,
        path: "/privacidad",
        type: "legal",
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
        subtitle={t("policy.privacy.subtitle")}
        updatedAt="2026-03-25"
        type="legal"
        path="/privacidad"
      >
      <LegalOverview
        eyebrow="Resumen de datos"
        title="Qué recogemos y para qué"
        description="Tratamos solo los datos necesarios para operar el catálogo, resolver pedidos y responder solicitudes relacionadas con tu información."
        facts={[
          {
            label: "Recogida",
            value: "Mínima y funcional",
            note: "Solo pedimos datos que ayudan a concretar el pedido o atender una solicitud legal.",
          },
          {
            label: "Uso",
            value: "Operación y contacto",
            note: "Se emplean para gestionar pedidos, soporte y cumplimiento de obligaciones.",
          },
          {
            label: "Control",
            value: "Derechos vigentes",
            note: "Puedes consultar, actualizar o pedir eliminación mediante los canales habilitados.",
          },
        ]}
        footer={
          <span>
            Si lo que buscas es gestionar preferencias de navegación, revisa{" "}
            <Link className="font-semibold text-emerald-700" href="/cookies">
              cookies
            </Link>
            . Si necesitas ayuda operativa, pasa por{" "}
            <Link className="font-semibold text-emerald-700" href="/soporte">
              soporte
            </Link>
            .
          </span>
        }
      />

      <ContentBlock title={t("policy.privacy.dataCollectedTitle")}>
        <ContentList
          items={[
            t("policy.privacy.dataCollected1"),
            t("policy.privacy.dataCollected2"),
            t("policy.privacy.dataCollected3"),
          ]}
        />
        <div className="grid gap-3 pt-2 sm:grid-cols-3">
          {[
            "Datos de contacto para confirmar pedidos y responder solicitudes.",
            "Datos de navegación y sesión para mejorar estabilidad y medición.",
            "Datos de la orden para trazabilidad y soporte postcompra.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600"
            >
              {item}
            </div>
          ))}
        </div>
      </ContentBlock>

      <ContentBlock title={t("policy.privacy.dataUseTitle")}>
        <p className="max-w-3xl">{t("policy.privacy.dataUseText")}</p>
      </ContentBlock>

      <ContentBlock title={t("policy.privacy.protectionTitle")}>
        <LegalTransparencyPanel
          title="Cómo protegemos tus datos"
          description="La protección se basa en acceso restringido, uso responsable de la información y procesos que minimizan exposición innecesaria."
          columns={[
            {
              title: "Acceso interno",
              description: "Solo los roles que necesitan los datos pueden verlos.",
              bullets: [
                "La operación de pedidos usa acceso limitado por función.",
                "Los datos sensibles no se exponen a canales públicos.",
                "Las solicitudes de soporte siguen el mínimo necesario.",
              ],
            },
            {
              title: "Uso responsable",
              description: "Cada dato debe servir a una tarea concreta y explicable.",
              bullets: [
                "Confirmar y rastrear pedidos.",
                "Responder consultas y ejercer derechos.",
                "Cumplir obligaciones legales o contractuales.",
              ],
            },
            {
              title: "Retención",
              description: "Conservamos lo necesario durante el tiempo útil y legal.",
              bullets: [
                "Pedidos: 5 años según la política publicada.",
                "Datos de cuenta: se eliminan a solicitud del titular.",
                "Solicitudes de habeas data: quedan registradas para seguimiento.",
              ],
            },
          ]}
        />
      </ContentBlock>

      <ContentBlock title={t("policy.privacy.userRightsTitle")}>
        <p className="max-w-3xl">{t("policy.privacy.userRightsText")}</p>
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          {[
            "Conocer qué datos conservamos sobre ti y cómo se usan.",
            "Actualizar información que esté incompleta o incorrecta.",
            "Solicitar la eliminación cuando aplique y sea compatible con la ley.",
            "Pedir copia o exportación de la información vinculada a tu solicitud.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-slate-700"
            >
              {item}
            </div>
          ))}
        </div>
      </ContentBlock>

      <ContentBlock title={t("policy.privacy.retentionTitle")}>
        <p className="max-w-3xl">{t("policy.privacy.retentionText")}</p>
      </ContentBlock>

      <ContentBlock title={t("policy.privacy.habeasData.title")}>
        <p className="mb-4 text-sm text-muted-foreground">
          {t("policy.privacy.habeasData.subtitle")}
        </p>
        <HabeasDataForm />
      </ContentBlock>

      <LegalRouteLinks
        title="Cruza esta política con el resto de rutas útiles"
        description="Las siguientes páginas completan el contexto legal y operativo sin obligarte a recorrer el sitio a ciegas."
        links={[
          {
            href: "/terminos",
            title: "Términos y condiciones",
            description: "Alcance del sitio, disponibilidad, precios y responsabilidad.",
            accent: "Compra",
          },
          {
            href: "/cookies",
            title: "Política de cookies",
            description: "Preferencias, medición y control del navegador.",
            accent: "Preferencias",
          },
          {
            href: "/soporte",
            title: "Soporte",
            description: "Canal recomendado para dudas, ajustes y seguimiento.",
            accent: "Ayuda",
          },
        ]}
      />
      </StaticPageLayout>
    </>
  );
}
