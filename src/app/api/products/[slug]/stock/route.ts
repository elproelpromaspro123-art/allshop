import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { parseDropiProviderConfig, fetchDropiStockSnapshot } from "@/lib/dropi";
import { buildDropiProviderUrlFromCatalog } from "@/lib/dropi-catalog";
import {
  getProductSlugLookupCandidates,
  normalizeProductSlug,
} from "@/lib/legacy-product-slugs";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const normalizedSlug = normalizeProductSlug(slug) || String(slug || "").trim().toLowerCase();
  const lookupSlugs = getProductSlugLookupCandidates(normalizedSlug);

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({
      live: false,
      message: "Stock en vivo no disponible en este entorno.",
      total_stock: null,
      variants: [],
      calculated_at: new Date().toISOString(),
    });
  }

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("provider_api_url,slug")
    .in("slug", lookupSlugs);

  const product = Array.isArray(products)
    ? lookupSlugs
        .map((lookupSlug) =>
          products.find(
            (row) => String(row.slug || "").trim().toLowerCase() === lookupSlug
          )
        )
        .find((row) => Boolean(row)) || products[0]
    : null;

  let providerApiUrl = product?.provider_api_url;

  const overridesRaw = process.env.DROPI_PROVIDER_MAP_OVERRIDES;
  if (overridesRaw) {
    try {
      const overrides = JSON.parse(overridesRaw);
      const overrideValue = lookupSlugs
        .map((lookupSlug) => overrides[lookupSlug])
        .find((value) => typeof value === "string" && value.trim().length > 0);
      if (typeof overrideValue === "string") {
        providerApiUrl = overrideValue;
      }
    } catch {
      // Ignore malformed overrides and continue with catalog fallback.
    }
  }

  if (!providerApiUrl) {
    providerApiUrl = buildDropiProviderUrlFromCatalog(normalizedSlug);
  }

  const dropiConfigResult = parseDropiProviderConfig(providerApiUrl);

  if (dropiConfigResult.kind !== "ok") {
    return NextResponse.json({
      live: false,
      message: "Producto no mapeado en Dropi",
      total_stock: null,
      variants: [],
      calculated_at: new Date().toISOString(),
    });
  }

  try {
    const snapshot = await fetchDropiStockSnapshot(dropiConfigResult.config);

    return NextResponse.json({
      live: true,
      total_stock: snapshot.totalStock,
      variants: snapshot.byVariation.map((v) => ({
        name: v.label || "Unica",
        stock: v.quantity,
        variation_id: v.variationId,
      })),
      calculated_at: snapshot.fetchedAt,
    });
  } catch (error) {
    console.error(`[Dropi Stock Fetch Error for ${normalizedSlug}]`, error);
    return NextResponse.json({
      live: false,
      message: "No se pudo obtener el stock en vivo",
      total_stock: null,
      variants: [],
      calculated_at: new Date().toISOString(),
    });
  }
}
