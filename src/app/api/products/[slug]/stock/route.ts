import { NextRequest, NextResponse } from "next/server";
import {
  getProductSlugLookupCandidates,
  normalizeProductSlug,
} from "@/lib/legacy-product-slugs";
import { getCatalogStockState } from "@/lib/catalog-runtime";
import { getProductBySlug } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const normalizedSlug = normalizeProductSlug(slug) || String(slug || "").trim().toLowerCase();
  const lookupSlugs = getProductSlugLookupCandidates(normalizedSlug);
  try {
    const product =
      (await getProductBySlug(normalizedSlug)) ||
      (await Promise.all(lookupSlugs.map((lookupSlug) => getProductBySlug(lookupSlug)))).find(
        (entry) => Boolean(entry)
      ) ||
      null;
    const state = await getCatalogStockState({
      slug: normalizedSlug,
      product,
    });

    return NextResponse.json({
      live: true,
      total_stock: state.total_stock,
      variants: state.variants.map((variant) => ({
        name: variant.name,
        stock: variant.stock,
        variation_id: variant.variation_id,
      })),
      source: state.source,
      calculated_at: state.updated_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[Catalog Stock Error for ${normalizedSlug}]`, error);
    return NextResponse.json({
      live: false,
      message: "No se pudo obtener el stock en tiempo real",
      total_stock: null,
      variants: [],
      calculated_at: new Date().toISOString(),
    });
  }
}
