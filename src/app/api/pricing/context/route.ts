import { NextResponse } from "next/server";
import { createDefaultPricingContext } from "@/lib/pricing";

export async function GET() {
  try {
    const payload = createDefaultPricingContext();

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("[PricingContext] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener contexto de precios." },
      { status: 500 },
    );
  }
}
