import type { Metadata } from "next";
import Link from "next/link";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { ContentBlock } from "@/components/ContentBlock";
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
  const title = t("policy.terms.title");
  const description = t("policy.terms.metaDescription");

  return buildStaticPageMetadata({
    title,
    description,
    path: "/terminos",
    openGraphType: "article",
  });
}

export default async function TermsPage() {
  const t = await getServerT();
  const title = t("policy.terms.title");
  const description = t("policy.terms.metaDescription");
  const structuredData = [
    generateWebPageJsonLd({
      title,
      description,
      path: "/terminos",
    }),
    generateBreadcrumbJsonLd(
      buildStaticPageBreadcrumbs({
        title,
        path: "/terminos",
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
        subtitle={t("policy.terms.subtitle")}
        updatedAt="2026-03-25"
        type="legal"
        path="/terminos"
      >
      <LegalOverview
        eyebrow="Resumen legal"
        title="Lo esencial antes de comprar"
        description="Estas condiciones explican cómo usamos el sitio, cómo protegemos la operación y qué esperar del catálogo, los precios y la entrega."
        facts={[
          {
            label: "Uso del sitio",
            value: "Acceso responsable",
            note: "La navegación está pensada para compras claras, con información completa y sin fricción innecesaria.",
          },
          {
            label: "Precios",
            value: "Valor visible",
            note: "Mostramos el precio final informado para la experiencia de compra y la confirmación posterior.",
          },
          {
            label: "Cobertura",
            value: "Despacho sujeto a validación",
            note: "La disponibilidad depende del inventario, la zona y la validación operativa del pedido.",
          },
        ]}
        footer={
          <span>
            Si necesitas una lectura rápida antes de avanzar, revisa también{" "}
            <Link className="font-semibold text-emerald-700" href="/privacidad">
              privacidad
            </Link>
            ,{" "}
            <Link className="font-semibold text-emerald-700" href="/cookies">
              cookies
            </Link>{" "}
            y{" "}
            <Link className="font-semibold text-emerald-700" href="/soporte">
              soporte
            </Link>
            .
          </span>
        }
      />

      <ContentBlock title={t("policy.terms.useSiteTitle")}>
        <p className="max-w-3xl">{t("policy.terms.useSiteText")}</p>
        <ul className="grid gap-3 pt-2 sm:grid-cols-3">
          {[
            "Usa datos reales y revisa tu información antes de confirmar un pedido.",
            "Respeta los canales oficiales si necesitas soporte, cambios o aclaraciones.",
            "Evita automatizaciones, accesos abusivos o usos que comprometan la operación.",
          ].map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600"
            >
              {item}
            </li>
          ))}
        </ul>
      </ContentBlock>

      <ContentBlock title={t("policy.terms.availabilityTitle")}>
        <p className="max-w-3xl">{t("policy.terms.availabilityText")}</p>
        <LegalTransparencyPanel
          title="Qué significa disponibilidad real"
          description="La web muestra el catálogo como referencia comercial, pero la confirmación final depende de stock, cobertura y validación interna."
          columns={[
            {
              title: "Antes de confirmar",
              description: "Verificamos condiciones operativas para evitar pedidos inviables.",
              bullets: [
                "Existencia del producto en el momento del proceso.",
                "Cobertura del departamento o ciudad del cliente.",
                "Capacidad de despacho en la ventana operativa actual.",
              ],
            },
            {
              title: "Si cambia la disponibilidad",
              description: "Priorizamos comunicar el estado real antes de avanzar con el pedido.",
              bullets: [
                "Se avisa si el producto requiere ajuste de entrega.",
                "Se mantiene el contacto por el canal registrado.",
                "Se evita confirmar inventario que ya no está disponible.",
              ],
            },
            {
              title: "Qué puedes esperar",
              description: "Un flujo claro y sin ambigüedades al comprar.",
              bullets: [
                "Estado del pedido visible después del registro.",
                "Seguimiento y soporte en canales oficiales.",
                "Actualización consistente entre catálogo y operación.",
              ],
            },
          ]}
          note="La disponibilidad no se interpreta como reserva automática hasta que el pedido queda confirmado internamente."
        />
      </ContentBlock>

      <ContentBlock title={t("policy.terms.pricingTitle")}>
        <p className="max-w-3xl">{t("policy.terms.pricingText")}</p>
        <div className="grid gap-3 pt-2 sm:grid-cols-3">
          {[
            "Los valores visibles forman parte de la experiencia de compra y pueden ajustarse si hay corrección operativa excepcional.",
            "El pedido se confirma solo cuando el valor final y las condiciones quedan claras para ambas partes.",
            "Los costos de envío se informan cuando aplican y se calculan según cobertura y validación logística.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-sm text-slate-700"
            >
              {item}
            </div>
          ))}
        </div>
      </ContentBlock>

      <ContentBlock title={t("policy.terms.liabilityTitle")}>
        <p className="max-w-3xl">{t("policy.terms.liabilityText")}</p>
        <p className="rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-relaxed text-slate-600">
          La responsabilidad se limita al marco razonable de la operación comercial, la
          información publicada y la confirmación del pedido. Los daños indirectos,
          usos ajenos al propósito del servicio y acciones fuera de control operativo no
          se cubren por estas condiciones.
        </p>
      </ContentBlock>

      <LegalRouteLinks
        title="Sigue leyendo las políticas que completan la compra"
        description="Estas rutas resuelven las dudas que normalmente aparecen antes de confirmar un pedido o dejar tus datos."
        links={[
          {
            href: "/privacidad",
            title: "Política de privacidad",
            description: "Cómo tratamos, protegemos y retenemos los datos que compartes.",
            accent: "Datos personales",
          },
          {
            href: "/cookies",
            title: "Política de cookies",
            description: "Qué usamos para analítica, funcionamiento y preferencias.",
            accent: "Preferencias",
          },
          {
            href: "/soporte",
            title: "Centro de soporte",
            description: "Canales oficiales para dudas sobre pedidos, entregas o cambios.",
            accent: "Canal oficial",
          },
        ]}
      />
      </StaticPageLayout>
    </>
  );
}
