import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { parseDropiProviderConfig, fetchDropiStockSnapshot } from "@/lib/dropi";
import { buildDropiProviderUrlFromCatalog } from "@/lib/dropi-catalog";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({
      live: false,
      message: "Stock en vivo no disponible en este entorno.",
      total_stock: null,
      variants: [],
      calculated_at: new Date().toISOString(),
    });
  }

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("provider_api_url")
    .eq("slug", slug)
    .single();

  let providerApiUrl = product?.provider_api_url;

  const overridesRaw = process.env.DROPI_PROVIDER_MAP_OVERRIDES;
  if (overridesRaw) {
    try {
      const overrides = JSON.parse(overridesRaw);
      if (overrides[slug] && typeof overrides[slug] === "string") {
        providerApiUrl = overrides[slug];
      }
    } catch {
      // Ignore malformed overrides and continue with catalog fallback.
    }
  }

  if (!providerApiUrl) {
    providerApiUrl = buildDropiProviderUrlFromCatalog(slug);
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
    console.error(`[Dropi Stock Fetch Error for ${slug}]`, error);
    return NextResponse.json({
      live: false,
      message: "No se pudo obtener el stock en vivo",
      total_stock: null,
      variants: [],
      calculated_at: new Date().toISOString(),
    });
  }
}
