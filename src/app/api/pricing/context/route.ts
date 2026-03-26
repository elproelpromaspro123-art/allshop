import { apiError, apiOkFields } from "@/lib/api-response";
import { createPricingContextFromHeaders } from "@/lib/pricing";

export async function GET(request: Request) {
  try {
    const payload = createPricingContextFromHeaders(request.headers);

    return apiOkFields(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
        Vary: "Accept-Language, X-Vercel-IP-Country, X-Country-Code",
      },
    });
  } catch (error) {
    console.error("[PricingContext] Error:", error);
    return apiError("Error al obtener contexto de precios.", {
      status: 500,
      code: "PRICING_CONTEXT_FAILED",
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  }
}
