import { NextResponse } from "next/server";
import { getCatalogVersionToken } from "@/lib/catalog-runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getCatalogVersionToken();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("[CatalogVersion] Error:", error);
    return NextResponse.json(
      { version: "0", updated_at: null },
      { status: 500 }
    );
  }
}
