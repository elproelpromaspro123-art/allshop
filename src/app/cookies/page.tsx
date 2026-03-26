import type { Metadata } from "next";
import Link from "next/link";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { ContentBlock, ContentList } from "@/components/ContentBlock";
import { CookieConsentMatrix } from "@/components/consent/CookieConsentMatrix";
import { LegalOverview } from "@/components/legal/LegalOverview";
import { LegalRouteLinks } from "@/components/legal/LegalRouteLinks";
import { LegalTransparencyPanel } from "@/components/legal/LegalTransparencyPanel";
import { DEFAULT_COOKIE_CONSENT, getCookieConsentStatus } from "@/lib/cookie-consent";
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
  const title = t("policy.cookies.title");
  const description = t("policy.cookies.metaDescription");

  return buildStaticPageMetadata({
    title,
    description,
    path: "/cookies",
    openGraphType: "article",
  });
}

export default async function CookiesPage() {
  const t = await getServerT();
  const title = t("policy.cookies.title");
  const description = t("policy.cookies.metaDescription");
  const structuredData = [
    generateWebPageJsonLd({
      title,
      description,
      path: "/cookies",
    }),
    generateBreadcrumbJsonLd(
      buildStaticPageBreadcrumbs({
        title,
        path: "/cookies",
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
        subtitle={t("policy.cookies.subtitle")}
        updatedAt="2026-03-25"
        type="legal"
        path="/cookies"
      >
      <LegalOverview
        eyebrow="Control de preferencias"
        title="Qué hacen las cookies en Vortixy"
        description="Usamos cookies para que la navegación funcione bien, para medir el comportamiento del sitio y para recordar preferencias que mejoran la experiencia."
        facts={[
          {
            label: "Necesarias",
            value: "Funcionamiento",
            note: "Permiten navegar, mantener estado y proteger operaciones críticas.",
          },
          {
            label: "Analíticas",
            value: "Medición",
            note: "Ayudan a entender qué se usa y dónde conviene mejorar la experiencia.",
          },
          {
            label: "Control",
            value: "Preferencias",
            note: "Puedes revisar, limitar o borrar cookies desde el navegador cuando lo necesites.",
          },
        ]}
        footer={
          <span>
            Si quieres más contexto legal, revisa{" "}
            <Link className="font-semibold text-emerald-700" href="/privacidad">
              privacidad
            </Link>{" "}
            o vuelve a{" "}
            <Link className="font-semibold text-emerald-700" href="/terminos">
              términos
            </Link>
            .
          </span>
        }
      />

      <ContentBlock title={t("policy.cookies.whatTitle")}>
        <p className="max-w-3xl">{t("policy.cookies.whatText")}</p>
      </ContentBlock>

      <ContentBlock title="Modelo de consentimiento">
        <p className="max-w-3xl text-slate-600">
          El sitio separa lo esencial de lo opcional para que puedas decidir con claridad
          sin romper la compra ni el seguimiento del pedido.
        </p>
        <div className="pt-4">
          <CookieConsentMatrix consent={DEFAULT_COOKIE_CONSENT} />
        </div>
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
        <LegalTransparencyPanel
          title="Lectura rápida de categorías"
          description="La distinción entre tipos de cookies hace más claro qué se puede apagar y qué conviene mantener activo."
          columns={[
            {
              title: "Cookies necesarias",
              description: "Sostienen la navegación, la sesión y las funciones básicas.",
              bullets: [
                "Sin ellas el sitio pierde estabilidad o contexto.",
                "No deberían bloquear el flujo de compra.",
                "Se usan solo para funciones esenciales.",
              ],
            },
            {
              title: "Cookies de analítica",
              description: "Ayudan a medir uso y detectar oportunidades de mejora.",
              bullets: [
                "No cambian el precio ni la disponibilidad.",
                "Sirven para entender el comportamiento general.",
                "Pueden controlarse desde el navegador o la preferencia local.",
              ],
            },
            {
              title: "Cookies de preferencia",
              description: "Recuerdan selecciones que hacen más fluida la navegación.",
              bullets: [
                "Idioma, estado visual o preferencias operativas.",
                "Se restauran para evitar repetir pasos.",
                "Pueden borrarse manualmente cuando quieras.",
              ],
            },
          ]}
        />
        <div className="mt-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Estado base del sitio
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {getCookieConsentStatus(DEFAULT_COOKIE_CONSENT).map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm leading-7 text-slate-600">
                  {item.enabled ? "Activa en el sitio." : "Opcional y desactivada por defecto."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ContentBlock>

      <ContentBlock title={t("policy.cookies.managementTitle")}>
        <p className="max-w-3xl">{t("policy.cookies.managementText")}</p>
        <div className="grid gap-3 pt-2 sm:grid-cols-3">
          {[
            "Revisar cookies desde la configuración de tu navegador.",
            "Borrar almacenamiento local si quieres reiniciar preferencias.",
            "Mantener activas las necesarias para no romper funciones críticas.",
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

      <LegalRouteLinks
        title="Complementa el control de cookies con el resto de políticas"
        description="La información útil está distribuida en solo unas cuantas páginas. Aquí quedan agrupadas para consulta rápida."
        links={[
          {
            href: "/privacidad",
            title: "Política de privacidad",
            description: "Uso, retención y control de datos personales.",
            accent: "Datos",
          },
          {
            href: "/terminos",
            title: "Términos y condiciones",
            description: "Alcance legal del sitio y reglas operativas de compra.",
            accent: "Compra",
          },
          {
            href: "/faq",
            title: "Preguntas frecuentes",
            description: "Respuestas cortas sobre operación, envíos y soporte.",
            accent: "Ayuda",
          },
        ]}
      />
      </StaticPageLayout>
    </>
  );
}
