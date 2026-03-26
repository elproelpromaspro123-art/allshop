import { ImageResponse } from "next/og";
import { getServerT } from "@/lib/i18n";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

interface Props {
  params: Promise<{ slug: string }> | { slug: string };
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function CategoryOpenGraphImage({ params }: Props) {
  const resolvedParams = await params;
  const t = await getServerT();
  const title = slugToTitle(resolvedParams.slug);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background:
          "radial-gradient(circle at 12% 18%, rgba(73,204,104,0.24), transparent 24%), radial-gradient(circle at 84% 20%, rgba(201,162,39,0.18), transparent 28%), linear-gradient(135deg, #07111a 0%, #101b27 42%, #132233 100%)",
        color: "#ffffff",
        padding: "54px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            padding: "12px 18px",
            color: "#d7ffe0",
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          {t("social.categoryTag")}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.08)",
            padding: "12px 18px",
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          Vortixy
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "36px" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "18px" }}>
          <p
            style={{
              margin: 0,
              color: "#9db7cb",
              fontSize: "24px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            {t("social.categoryLine")}
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "76px",
              lineHeight: 1.03,
              letterSpacing: "-0.05em",
              fontWeight: 800,
              maxWidth: "700px",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: "640px",
              color: "#dbe7f0",
              fontSize: "30px",
              lineHeight: 1.28,
            }}
          >
            {t("category.metaDescription", {
              description: "Coleccion curada con lectura rapida, filtros precisos y una portada editorial premium.",
            })}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            width: "290px",
          }}
        >
          <div
            style={{
              height: "170px",
              borderRadius: "28px",
              background:
                "linear-gradient(160deg, rgba(73,204,104,0.28), rgba(255,255,255,0.08))",
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.24)",
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#c9ffda", fontSize: "18px", fontWeight: 800 }}>
              Coleccion premium
            </span>
            <span style={{ color: "#ffffff", fontSize: "36px", fontWeight: 800 }}>
              Curada
            </span>
            <span style={{ color: "rgba(255,255,255,0.78)", fontSize: "18px", lineHeight: 1.3 }}>
              Navegacion mas clara, visual mas limpia y una portada que se siente exclusiva.
            </span>
          </div>

          <div
            style={{
              height: "126px",
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#9db7cb", fontSize: "16px", fontWeight: 700 }}>
              {title}
            </span>
            <span style={{ color: "#ffffff", fontSize: "24px", fontWeight: 800 }}>
              {t("category.viewCatalog")}
            </span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px" }}>
              Seleccion editorial con identidad propia.
            </span>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
