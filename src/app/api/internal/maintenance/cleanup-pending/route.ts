import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";
import { restoreCatalogStock, type CatalogStockReservation } from "@/lib/catalog-runtime";

export const dynamic = "force-dynamic";

interface OrderRow {
  id: string;
  notes: string | null;
  items: unknown;
}

interface OrderItemRow {
  product_id?: string;
  variant?: string | null;
  quantity?: number;
}

function readMaintenanceSecret(): string {
  return String(
    process.env.MAINTENANCE_SECRET ||
      process.env.CATALOG_ADMIN_ACCESS_CODE ||
      process.env.ORDER_LOOKUP_SECRET ||
      ""
  ).trim();
}

function safeCompare(secret: string, provided: string): boolean {
  if (!secret || !provided) return false;
  const a = Buffer.from(secret, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function parseSecret(request: NextRequest): string {
  return String(request.headers.get("x-maintenance-secret") || "").trim();
}

function parseOrderItems(value: unknown): OrderItemRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is OrderItemRow =>
      Boolean(entry) && typeof entry === "object" && !Array.isArray(entry)
  );
}

function toReservationsForOrder(
  orderItems: OrderItemRow[],
  slugByProductId: Map<string, string>
): CatalogStockReservation[] {
  const grouped = new Map<string, CatalogStockReservation>();

  for (const item of orderItems) {
    const productId = String(item.product_id || "").trim();
    const slug = slugByProductId.get(productId);
    if (!slug) continue;

    const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (!quantity) continue;

    const variant = String(item.variant || "").trim() || null;
    const key = `${slug}::${String(variant || "").toLowerCase()}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += quantity;
    } else {
      grouped.set(key, { slug, variant, quantity });
    }
  }

  return Array.from(grouped.values());
}

function patchCleanupNotes(rawNotes: string | null, payload: Record<string, unknown>): string {
  let parsed: Record<string, unknown> = {};
  if (rawNotes) {
    try {
      const maybeParsed = JSON.parse(rawNotes) as unknown;
      if (maybeParsed && typeof maybeParsed === "object" && !Array.isArray(maybeParsed)) {
        parsed = maybeParsed as Record<string, unknown>;
      } else {
        parsed = { previous_notes: rawNotes };
      }
    } catch {
      parsed = { previous_notes: rawNotes };
    }
  }

  parsed.maintenance = payload;
  return JSON.stringify(parsed);
}

async function runCleanup(request: NextRequest) {
  const secret = parseSecret(request);
  const expectedSecret = readMaintenanceSecret();

  if (!safeCompare(expectedSecret, secret)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Supabase admin no configurado." },
      { status: 500 }
    );
  }

  const rawTtl = Number(request.nextUrl.searchParams.get("ttl_minutes") || 120);
  const ttlMinutes = Number.isFinite(rawTtl)
    ? Math.min(Math.max(Math.floor(rawTtl), 30), 1440)
    : 120;
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || 50);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.floor(rawLimit), 1), 200)
    : 50;

  const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000).toISOString();

  const { data: staleOrders, error: staleError } = await supabaseAdmin
    .from("orders")
    .select("id,items,notes")
    .eq("status", "pending")
    .lte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (staleError) {
    return NextResponse.json(
      { error: `No se pudieron consultar pendientes: ${staleError.message}` },
      { status: 500 }
    );
  }

  const orders = (staleOrders || []) as OrderRow[];
  if (!orders.length) {
    return NextResponse.json({
      ok: true,
      ttl_minutes: ttlMinutes,
      cutoff,
      found: 0,
      cancelled: 0,
      restored_stock_for: 0,
    });
  }

  const productIds = Array.from(
    new Set(
      orders
        .flatMap((order) => parseOrderItems(order.items))
        .map((item) => String(item.product_id || "").trim())
        .filter(Boolean)
    )
  );

  const slugByProductId = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: productRows } = await supabaseAdmin
      .from("products")
      .select("id,slug")
      .in("id", productIds);

    for (const row of (productRows || []) as Array<{ id: string; slug: string }>) {
      if (row.id && row.slug) {
        slugByProductId.set(String(row.id), String(row.slug));
      }
    }
  }

  let cancelled = 0;
  let restoredStockFor = 0;
  let restoreErrors = 0;

  for (const order of orders) {
    const reservations = toReservationsForOrder(parseOrderItems(order.items), slugByProductId);

    if (reservations.length > 0) {
      try {
        await restoreCatalogStock(reservations);
        restoredStockFor += 1;
      } catch {
        restoreErrors += 1;
      }
    }

    const notes = patchCleanupNotes(order.notes, {
      action: "auto_cancel_pending",
      reason: `Pedido pendiente vencido (> ${ttlMinutes} min)`,
      cancelled_at: new Date().toISOString(),
      stock_restore_attempted: reservations.length > 0,
    });

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled",
        notes,
      })
      .eq("id", order.id)
      .eq("status", "pending");

    if (!updateError) {
      cancelled += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    ttl_minutes: ttlMinutes,
    cutoff,
    found: orders.length,
    cancelled,
    restored_stock_for: restoredStockFor,
    restore_errors: restoreErrors,
  });
}

export async function GET() {
  return NextResponse.json(
    { error: "Metodo no permitido. Usa POST con x-maintenance-secret." },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  return runCleanup(request);
}
