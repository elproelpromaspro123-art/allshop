import { ImageResponse } from "next/og";
import { getServerT } from "@/lib/i18n";

export const runtime = "edge";
export const alt = "Vortixy - Comercio nacional en Colombia";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const t = await getServerT();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background:
          "radial-gradient(circle at top right, rgba(34,197,94,0.24), transparent 45%), linear-gradient(135deg, #0a0b0f, #152033)",
        color: "#ffffff",
        padding: "56px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #84fb7f, #49cc68)",
            color: "#07210d",
            fontWeight: 700,
            fontSize: "36px",
          }}
        >
          V
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <p style={{ margin: 0, fontSize: "48px", fontWeight: 700 }}>
            Vortixy
          </p>
          <p style={{ margin: 0, fontSize: "22px", color: "#c0d8c8" }}>
            {t("social.ogBrandLine")}
          </p>
        </div>
      </div>

      <p
        style={{
          margin: 0,
          maxWidth: "900px",
          fontSize: "40px",
          lineHeight: 1.2,
          fontWeight: 600,
        }}
      >
        {t("social.ogHeadline")}
      </p>

      <div
        style={{
          display: "flex",
          gap: "14px",
          alignItems: "center",
          color: "#d9ece0",
          fontSize: "24px",
        }}
      >
        <span>{t("social.badgePayment")}</span>
        <span>|</span>
        <span>{t("social.badgeCheckout")}</span>
        <span>|</span>
        <span>{t("social.badgeShipping")}</span>
      </div>
    </div>,
    size,
  );
}
