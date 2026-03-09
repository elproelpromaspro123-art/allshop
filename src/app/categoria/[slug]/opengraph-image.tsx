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
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at top right, rgba(201,162,39,0.22), transparent 42%), linear-gradient(135deg, #101010, #1f1f1f)",
          color: "#ffffff",
          padding: "56px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            alignItems: "center",
            gap: "10px",
            fontSize: "22px",
            color: "#c9a227",
            fontWeight: 700,
          }}
        >
          {t("social.categoryTag")}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: "72px",
            lineHeight: 1.1,
            fontWeight: 700,
            maxWidth: "1050px",
          }}
        >
          {title}
        </p>

        <p style={{ margin: 0, fontSize: "30px", color: "#e5e5e5" }}>
          {t("social.categoryLine")}
        </p>
      </div>
    ),
    size
  );
}
