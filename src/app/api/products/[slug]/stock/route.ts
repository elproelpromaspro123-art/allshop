import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/db";
import {
  fetchDropiStockSnapshot,
  parseDropiProviderConfig,
  type DropiStockByVariation,
} from "@/lib/dropi";
import {
  buildDropiProviderUrlFromCatalog,
  resolveDropiVariationId,
} from "@/lib/dropi-catalog";
import type { ProductVariant } from "@/types/database";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

const MANUAL_STOCK_FALLBACK_BY_SLUG: Record<
  string,
  {
    total_stock: number;
    variants: Array<{
      index: number;
      name: string;
      stock: number;
      variation_id: number | null;
    }>;
  }
> = {
  "silla-gamer-premium-reposapies": {
    total_stock: 638,
    variants: [
      { index: 0, name: "Negro Rojo", stock: 120, variation_id: 1539198 },
      { index: 1, name: "Negro Azul", stock: 0, variation_id: 1539199 },
      { index: 2, name: "Negro", stock: 119, variation_id: 1539202 },
      { index: 3, name: "Negro Blanco", stock: 120, variation_id: 1539200 },
      { index: 4, name: "Negro Gris", stock: 129, variation_id: 1539201 },
      { index: 5, name: "Rosa", stock: 150, variation_id: 1539203 },
    ],
  },
};

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

function getManualStockFallback(slug: string) {
  return MANUAL_STOCK_FALLBACK_BY_SLUG[slug.toLowerCase()] ?? null;
}

function buildUnavailablePayload(slug: string, message: string) {
  const fallback = getManualStockFallback(slug);
  return {
    live: false,
    total_stock: fallback?.total_stock ?? null,
    variants: fallback?.variants ?? [],
    message,
    calculated_at: new Date().toISOString(),
  };
}

function stockUnavailableResponse(slug: string, message: string): NextResponse {
  return jsonNoStore(buildUnavailablePayload(slug, message));
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
  slug: string,
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
    const knownVariationId = resolveDropiVariationId(slug, option);
    const byKnownVariation =
      typeof knownVariationId === "number"
        ? stockRows.find((row) => row.variationId === knownVariationId)
        : null;
    const byName = rowsByLabel.get(normalizeLabel(option));
    const fallback = stockRows[index];
    const matched = byKnownVariation || byName || fallback;

    return {
      index,
      name: option,
      stock: matched?.quantity ?? null,
      variation_id: knownVariationId ?? matched?.variationId ?? null,
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
    product.provider_api_url ||
    envOverrides[slug.toLowerCase()] ||
    buildDropiProviderUrlFromCatalog(slug) ||
    null;

  if (!providerApiUrl) {
    return stockUnavailableResponse(
      slug,
      "Stock en vivo no disponible: falta configurar el mapeo del proveedor."
    );
  }

  const parsedConfig = parseDropiProviderConfig(providerApiUrl);
  if (parsedConfig.kind !== "ok") {
    return stockUnavailableResponse(
      slug,
      "Stock en vivo no disponible: mapeo de Dropi invalido o proveedor no compatible."
    );
  }

  try {
    const snapshot = await fetchDropiStockSnapshot(parsedConfig.config);
    const variantStock = mapVariationStock(slug, product.variants, snapshot.byVariation);

    return jsonNoStore({
      live: true,
      total_stock: snapshot.totalStock,
      variants: variantStock,
      source_endpoint: snapshot.sourceEndpoint,
      calculated_at: snapshot.fetchedAt,
    });
  } catch (error) {
    const payload = buildUnavailablePayload(
      slug,
      "No fue posible sincronizar el stock en vivo con Dropi en este momento."
    );
    return jsonNoStore(
      {
        ...payload,
        error: error instanceof Error ? error.message : String(error),
      },
      200
    );
  }
}
