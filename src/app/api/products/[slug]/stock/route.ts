import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import {
  getProductSlugLookupCandidates,
  normalizeProductSlug,
} from "@/lib/legacy-product-slugs";
import { getCatalogStockState } from "@/lib/catalog-runtime";
import { getProductBySlug } from "@/lib/db";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitDb({
    key: `stock:${clientIp}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return apiError("Demasiadas solicitudes.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      headers: noStoreHeaders({
        "Retry-After": String(rateLimit.retryAfterSeconds),
      }),
    });
  }

  const { slug } = await params;
  const normalizedSlug =
    normalizeProductSlug(slug) ||
    String(slug || "")
      .trim()
      .toLowerCase();
  const lookupSlugs = getProductSlugLookupCandidates(normalizedSlug);
  try {
    const product =
      (await getProductBySlug(normalizedSlug)) ||
      (
        await Promise.all(
          lookupSlugs.map((lookupSlug) => getProductBySlug(lookupSlug)),
        )
      ).find((entry) => Boolean(entry)) ||
      null;
    const state = await getCatalogStockState({
      slug: normalizedSlug,
      product,
    });

    return apiOkFields(
      {
        live: true,
        total_stock: state.total_stock,
        variants: state.variants.map((variant) => ({
          name: variant.name,
          stock: variant.stock,
          variation_id: variant.variation_id,
        })),
        source: state.source,
        calculated_at: state.updated_at || new Date().toISOString(),
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    console.error(`[Catalog Stock Error for ${normalizedSlug}]`, error);
    return apiOkFields(
      {
        live: false,
        message: "No se pudo obtener el stock en tiempo real",
        total_stock: null,
        variants: [],
        calculated_at: new Date().toISOString(),
      },
      { headers: noStoreHeaders() },
    );
  }
}
