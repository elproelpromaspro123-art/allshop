import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/db";
import {
  fetchDropiStockSnapshot,
  parseDropiProviderConfig,
  type DropiStockByVariation,
} from "@/lib/dropi";
import type { ProductVariant } from "@/types/database";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

function jsonNoStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function normalizeLabel(value: string | null | undefined): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getEnvProviderOverrides(): Record<string, string> {
  const raw = process.env.DROPI_PROVIDER_MAP_OVERRIDES;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const entries = Object.entries(parsed).filter(
      ([, value]) => typeof value === "string" && value.trim().length > 0
    ) as [string, string][];
    return Object.fromEntries(entries.map(([key, value]) => [key.toLowerCase(), value]));
  } catch {
    return {};
  }
}

function mapVariationStock(
  variants: ProductVariant[],
  stockRows: DropiStockByVariation[]
) {
  const colorVariant = variants.find(
    (variant) => normalizeLabel(variant.name) === "color"
  );
  if (!colorVariant) {
    return stockRows.map((row, index) => ({
      index,
      name: row.label || `Variante ${index + 1}`,
      stock: row.quantity,
      variation_id: row.variationId,
    }));
  }

  const rowsByLabel = new Map(
    stockRows
      .filter((row) => row.label)
      .map((row) => [normalizeLabel(row.label), row] as const)
  );

  return colorVariant.options.map((option, index) => {
    const byName = rowsByLabel.get(normalizeLabel(option));
    const fallback = stockRows[index];
    const matched = byName || fallback;

    return {
      index,
      name: option,
      stock: matched?.quantity ?? null,
      variation_id: matched?.variationId ?? null,
    };
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return jsonNoStore({ error: "Producto no encontrado" }, 404);
  }

  const envOverrides = getEnvProviderOverrides();
  const providerApiUrl =
    product.provider_api_url || envOverrides[slug.toLowerCase()] || null;

  if (!providerApiUrl) {
    return jsonNoStore({
      live: false,
      total_stock: null,
      variants: [],
      message:
        "Stock en vivo no disponible: falta configurar el mapeo del proveedor.",
      calculated_at: new Date().toISOString(),
    });
  }

  const parsedConfig = parseDropiProviderConfig(providerApiUrl);
  if (parsedConfig.kind !== "ok") {
    return jsonNoStore({
      live: false,
      total_stock: null,
      variants: [],
      message:
        "Stock en vivo no disponible: mapeo de Dropi invalido o proveedor no compatible.",
      calculated_at: new Date().toISOString(),
    });
  }

  try {
    const snapshot = await fetchDropiStockSnapshot(parsedConfig.config);
    const variantStock = mapVariationStock(product.variants, snapshot.byVariation);

    return jsonNoStore({
      live: true,
      total_stock: snapshot.totalStock,
      variants: variantStock,
      source_endpoint: snapshot.sourceEndpoint,
      calculated_at: snapshot.fetchedAt,
    });
  } catch (error) {
    return jsonNoStore({
      live: false,
      total_stock: null,
      variants: [],
      message:
        "No fue posible sincronizar el stock en vivo con Dropi en este momento.",
      error: error instanceof Error ? error.message : String(error),
      calculated_at: new Date().toISOString(),
    });
  }
}
