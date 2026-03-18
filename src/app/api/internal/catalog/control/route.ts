import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import {
  isCatalogAdminCodeConfigured,
  isCatalogAdminCodeValid,
} from "@/lib/catalog-admin-auth";
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

function parseAdminCode(request: NextRequest): string {
  return String(request.headers.get("x-catalog-admin-code") || "").trim();
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

function assertAdminAccess(request: NextRequest): NextResponse | null {
  if (!isCatalogAdminCodeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Configura CATALOG_ADMIN_ACCESS_CODE en variables de entorno para habilitar el panel privado.",
      },
      { status: 500 }
    );
  }

  const code = parseAdminCode(request);
  if (!isCatalogAdminCodeValid(code)) {
    return NextResponse.json(
      { error: "Código de acceso inválido." },
      { status: 401 }
    );
  }

  return null;
}

async function enforceRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitDb({
    key: `admin-catalog:${clientIp}`,
    limit: 120,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  return null;
}

export async function GET(request: NextRequest) {
  const rateLimitError = await enforceRateLimit(request);
  if (rateLimitError) return rateLimitError;

  const authError = assertAdminAccess(request);
  if (authError) return authError;

  try {
    const snapshot = await listCatalogControlProducts();
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("[CatalogControl][GET] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el panel del catálogo.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimitError = await enforceRateLimit(request);
  if (rateLimitError) return rateLimitError;

  const authError = assertAdminAccess(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as UpdateBody;
    const slug = String(body.slug || "").trim().toLowerCase();
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
      body.total_stock === null ? null : parseNonNegativeNumber(body.total_stock);
    const variants = sanitizeVariants(body.variants);

    if (!slug) {
      return NextResponse.json(
        { error: "El slug del producto es obligatorio." },
        { status: 400 }
      );
    }

    if (price === null) {
      return NextResponse.json(
        { error: "El precio debe ser un número entero mayor o igual a 0." },
        { status: 400 }
      );
    }

    if (
      body.compare_at_price !== undefined &&
      body.compare_at_price !== null &&
      compareAt === null
    ) {
      return NextResponse.json(
        {
          error:
            "El precio promocional debe ser un número entero mayor o igual a 0, o null para quitar promoción.",
        },
        { status: 400 }
      );
    }

    if (body.total_stock !== undefined && body.total_stock !== null && totalStock === null) {
      return NextResponse.json(
        {
          error:
            "El stock total debe ser un número entero mayor o igual a 0, o null si se calcula por variantes.",
        },
        { status: 400 }
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

    return NextResponse.json({ updated });
  } catch (error) {
    console.error("[CatalogControl][PATCH] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el producto en el panel privado.",
      },
      { status: 500 }
    );
  }
}
