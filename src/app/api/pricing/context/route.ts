import { NextResponse } from "next/server";
import { createDefaultPricingContext } from "@/lib/pricing";

export async function GET() {
  const payload = createDefaultPricingContext();

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
    },
  });
}
