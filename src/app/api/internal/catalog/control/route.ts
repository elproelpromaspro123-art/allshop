import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  apiOkFields,
  noStoreHeaders,
} from "@/lib/api-response";
import {
  assertCatalogAdminAccess,
  enforceAdminRateLimit,
} from "@/lib/admin-route";
import {
  listCatalogControlProducts,
  updateCatalogControlProduct,
  type CatalogVariantStock,
} from "@/lib/catalog-runtime";

export const dynamic = "force-dynamic";

interface UpdateBody {
  slug?: string;
  price?: number;
  compare_at_price?: number | null;
  free_shipping?: boolean;
  shipping_cost?: number | null;
  total_stock?: number | null;
  variants?: CatalogVariantStock[];
}

function parseNonNegativeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.floor(parsed);
  return rounded >= 0 ? rounded : null;
}

function sanitizeVariants(input: unknown): CatalogVariantStock[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((variant) => {
      if (!variant || typeof variant !== "object") return null;
      const row = variant as Record<string, unknown>;
      const name = String(row.name || "").trim();
      if (!name) return null;
      const stock = parseNonNegativeNumber(row.stock);
      const variationIdRaw = row.variation_id;
      const variationId =
        typeof variationIdRaw === "number" && Number.isFinite(variationIdRaw)
          ? Math.floor(variationIdRaw)
          : null;
      return {
        name,
        stock,
        variation_id: variationId,
      };
    })
    .filter((variant): variant is CatalogVariantStock => Boolean(variant));
}

async function enforceRateLimit(
  request: NextRequest,
): Promise<NextResponse | null> {
  return enforceAdminRateLimit(request, {
    keyPrefix: "admin-catalog",
  });
}

export async function GET(request: NextRequest) {
  const rateLimitError = await enforceRateLimit(request);
  if (rateLimitError) return rateLimitError;

  const authError = assertCatalogAdminAccess(request, {
    headerName: "x-catalog-admin-code",
    unauthorizedMessage: "Código de acceso inválido.",
  });
  if (authError) return authError;

  try {
    const snapshot = await listCatalogControlProducts();
    return apiOkFields(snapshot, {
      headers: noStoreHeaders(),
    });
  } catch (error) {
    console.error("[CatalogControl][GET] Error:", error);
    return apiError(
      error instanceof Error
        ? error.message
        : "No se pudo cargar el panel del catálogo.",
      {
        status: 500,
        code: "CATALOG_CONTROL_GET_FAILED",
        headers: noStoreHeaders(),
      },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimitError = await enforceRateLimit(request);
  if (rateLimitError) return rateLimitError;

  const authError = assertCatalogAdminAccess(request, {
    headerName: "x-catalog-admin-code",
    unauthorizedMessage: "Código de acceso inválido.",
  });
  if (authError) return authError;

  try {
    const body = (await request.json()) as UpdateBody;
    const slug = String(body.slug || "")
      .trim()
      .toLowerCase();
    const price = parseNonNegativeNumber(body.price);
    const compareAt =
      body.compare_at_price === null
        ? null
        : parseNonNegativeNumber(body.compare_at_price);
    const freeShipping = body.free_shipping;
    const shippingCost =
      body.shipping_cost === null || body.shipping_cost === undefined
        ? null
        : parseNonNegativeNumber(body.shipping_cost);

    const totalStock =
      body.total_stock === null
        ? null
        : parseNonNegativeNumber(body.total_stock);
    const variants = sanitizeVariants(body.variants);

    if (!slug) {
      return apiError("El slug del producto es obligatorio.", {
        status: 400,
        code: "PRODUCT_SLUG_REQUIRED",
        headers: noStoreHeaders(),
      });
    }

    if (price === null) {
      return apiError(
        "El precio debe ser un número entero mayor o igual a 0.",
        {
          status: 400,
          code: "INVALID_PRICE",
          headers: noStoreHeaders(),
        },
      );
    }

    if (
      body.compare_at_price !== undefined &&
      body.compare_at_price !== null &&
      compareAt === null
    ) {
      return apiError(
        "El precio promocional debe ser un número entero mayor o igual a 0, o null para quitar promoción.",
        {
          status: 400,
          code: "INVALID_COMPARE_AT_PRICE",
          headers: noStoreHeaders(),
        },
      );
    }

    if (
      body.total_stock !== undefined &&
      body.total_stock !== null &&
      totalStock === null
    ) {
      return apiError(
        "El stock total debe ser un número entero mayor o igual a 0, o null si se calcula por variantes.",
        {
          status: 400,
          code: "INVALID_TOTAL_STOCK",
          headers: noStoreHeaders(),
        },
      );
    }

    const updated = await updateCatalogControlProduct({
      slug,
      price,
      compare_at_price: compareAt,
      free_shipping: freeShipping,
      shipping_cost: shippingCost,
      total_stock: totalStock,
      variants,
      updated_by: "admin_panel",
    });

    return apiOkFields({ updated }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("[CatalogControl][PATCH] Error:", error);
    return apiError(
      error instanceof Error
        ? error.message
        : "No se pudo guardar el producto en el panel privado.",
      {
        status: 500,
        code: "CATALOG_CONTROL_PATCH_FAILED",
        headers: noStoreHeaders(),
      },
    );
  }
}
