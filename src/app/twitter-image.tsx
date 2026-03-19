import { ImageResponse } from "next/og";
import { getServerT } from "@/lib/i18n";

export const runtime = "edge";
export const alt = "Vortixy - Colombia envio nacional";
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = "image/png";

export default async function TwitterImage() {
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
        padding: "48px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #84fb7f, #49cc68)",
            color: "#07210d",
            fontWeight: 700,
            fontSize: "30px",
          }}
        >
          V
        </div>
        <p style={{ margin: 0, fontSize: "42px", fontWeight: 700 }}>Vortixy</p>
      </div>

      <p
        style={{
          margin: 0,
          maxWidth: "980px",
          fontSize: "36px",
          lineHeight: 1.2,
          fontWeight: 600,
        }}
      >
        {t("social.twitterHeadline")}
      </p>

      <div
        style={{
          display: "flex",
          gap: "14px",
          alignItems: "center",
          color: "#d9ece0",
          fontSize: "22px",
        }}
      >
        <span>{t("social.badgePayment")}</span>
        <span>|</span>
        <span>{t("social.badgeSupport")}</span>
        <span>|</span>
        <span>{t("social.badgeDomain")}</span>
      </div>
    </div>,
    size,
  );
}
