import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { noStoreHeaders } from "@/lib/api-response";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";
import {
  restoreCatalogStock,
  type CatalogStockReservation,
} from "@/lib/catalog-runtime";

export const runtime = "nodejs";
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

interface CleanupPreviewRow {
  order_id: string;
  item_count: number;
  reservable_items: number;
  unresolved_items: number;
  stock_restore_needed: boolean;
}

function jsonNoStore(
  payload: unknown,
  init?: Parameters<typeof NextResponse.json>[1],
) {
  return NextResponse.json(payload, {
    ...init,
    headers: noStoreHeaders(init?.headers),
  });
}

function readMaintenanceSecret(): string {
  return String(
    process.env.MAINTENANCE_SECRET ||
      process.env.CATALOG_ADMIN_ACCESS_CODE ||
      process.env.ORDER_LOOKUP_SECRET ||
      "",
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

function parseBooleanSearchParam(value: string | null): boolean {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

function parseBoundedIntegerParam(
  value: string | null,
  defaults: {
    fallback: number;
    min: number;
    max: number;
  },
): number {
  const parsed = Number(value || defaults.fallback);
  if (!Number.isFinite(parsed)) return defaults.fallback;
  return Math.min(
    Math.max(Math.floor(parsed), defaults.min),
    defaults.max,
  );
}

function parseOrderItems(value: unknown): OrderItemRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is OrderItemRow =>
      Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
  );
}

function toReservationsForOrder(
  orderItems: OrderItemRow[],
  slugByProductId: Map<string, string>,
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

function countUnresolvedOrderItems(
  orderItems: OrderItemRow[],
  slugByProductId: Map<string, string>,
): number {
  return orderItems.reduce((count, item) => {
    const productId = String(item.product_id || "").trim();
    if (!productId) return count;
    return slugByProductId.has(productId) ? count : count + 1;
  }, 0);
}

function patchCleanupNotes(
  rawNotes: string | null,
  payload: Record<string, unknown>,
): string {
  let parsed: Record<string, unknown> = {};
  if (rawNotes) {
    try {
      const maybeParsed = JSON.parse(rawNotes) as unknown;
      if (
        maybeParsed &&
        typeof maybeParsed === "object" &&
        !Array.isArray(maybeParsed)
      ) {
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

function buildCleanupPreview(
  order: OrderRow,
  slugByProductId: Map<string, string>,
): CleanupPreviewRow {
  const orderItems = parseOrderItems(order.items);
  const reservations = toReservationsForOrder(orderItems, slugByProductId);
  const unresolvedItems = countUnresolvedOrderItems(
    orderItems,
    slugByProductId,
  );

  return {
    order_id: order.id,
    item_count: orderItems.length,
    reservable_items: reservations.length,
    unresolved_items: unresolvedItems,
    stock_restore_needed: reservations.length > 0,
  };
}

async function cancelPendingOrder(orderId: string, notes: string) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({
      status: "cancelled",
      notes,
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id");

  if (error) {
    return {
      ok: false,
      skipped: false,
      error: error.message,
    } as const;
  }

  const updatedRows = Array.isArray(data) ? data : [];
  if (updatedRows.length === 0) {
    return {
      ok: false,
      skipped: true,
      error: null,
    } as const;
  }

  return {
    ok: true,
    skipped: false,
    error: null,
  } as const;
}

async function runCleanup(request: NextRequest) {
  const secret = parseSecret(request);
  const expectedSecret = readMaintenanceSecret();

  if (!safeCompare(expectedSecret, secret)) {
    return jsonNoStore({ error: "No autorizado." }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured) {
    return jsonNoStore(
      { error: "Supabase admin no configurado." },
      { status: 500 },
    );
  }

  const ttlMinutes = parseBoundedIntegerParam(
    request.nextUrl.searchParams.get("ttl_minutes"),
    { fallback: 120, min: 30, max: 1440 },
  );
  const limit = parseBoundedIntegerParam(
    request.nextUrl.searchParams.get("limit"),
    { fallback: 50, min: 1, max: 200 },
  );
  const dryRun = parseBooleanSearchParam(
    request.nextUrl.searchParams.get("dry_run"),
  );

  const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000).toISOString();

  const { data: staleOrders, error: staleError } = await supabaseAdmin
    .from("orders")
    .select("id,items,notes")
    .eq("status", "pending")
    .lte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (staleError) {
    return jsonNoStore(
      { error: `No se pudieron consultar pendientes: ${staleError.message}` },
      { status: 500 },
    );
  }

  const orders = (staleOrders || []) as OrderRow[];
  if (!orders.length) {
    return jsonNoStore({
      ok: true,
      dry_run: dryRun,
      ttl_minutes: ttlMinutes,
      cutoff,
      found: 0,
      cancelled: 0,
      skipped_not_pending: 0,
      cancel_errors: 0,
      unresolved_items: 0,
      restored_stock_for: 0,
      restore_errors: 0,
      preview: [],
    });
  }

  const productIds = Array.from(
    new Set(
      orders
        .flatMap((order) => parseOrderItems(order.items))
        .map((item) => String(item.product_id || "").trim())
        .filter(Boolean),
    ),
  );

  const slugByProductId = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: productRows } = await supabaseAdmin
      .from("products")
      .select("id,slug")
      .in("id", productIds);

    for (const row of (productRows || []) as Array<{
      id: string;
      slug: string;
    }>) {
      if (row.id && row.slug) {
        slugByProductId.set(String(row.id), String(row.slug));
      }
    }
  }

  const preview = orders.map((order) => buildCleanupPreview(order, slugByProductId));
  const unresolvedItems = preview.reduce(
    (sum, row) => sum + row.unresolved_items,
    0,
  );

  if (dryRun) {
    return jsonNoStore({
      ok: true,
      dry_run: true,
      ttl_minutes: ttlMinutes,
      cutoff,
      found: orders.length,
      cancelled: 0,
      skipped_not_pending: 0,
      cancel_errors: 0,
      unresolved_items: unresolvedItems,
      restored_stock_for: 0,
      restore_errors: 0,
      preview,
    });
  }

  let cancelled = 0;
  let skippedNotPending = 0;
  let cancelErrors = 0;
  let restoredStockFor = 0;
  let restoreErrors = 0;

  for (const order of orders) {
    const orderItems = parseOrderItems(order.items);
    const reservations = toReservationsForOrder(orderItems, slugByProductId);
    const unresolvedItemCount = countUnresolvedOrderItems(
      orderItems,
      slugByProductId,
    );
    const notes = patchCleanupNotes(order.notes, {
      action: "auto_cancel_pending",
      reason: `Pedido pendiente vencido (> ${ttlMinutes} min)`,
      cancelled_at: new Date().toISOString(),
      stock_restore_required: reservations.length > 0,
      unresolved_items: unresolvedItemCount,
    });

    const updateResult = await cancelPendingOrder(order.id, notes);
    if (updateResult.error) {
      cancelErrors += 1;
      continue;
    }

    if (updateResult.skipped) {
      skippedNotPending += 1;
      continue;
    }

    cancelled += 1;

    if (reservations.length > 0) {
      try {
        await restoreCatalogStock(reservations);
        restoredStockFor += 1;
      } catch {
        restoreErrors += 1;
      }
    }
  }

  return jsonNoStore({
    ok: true,
    dry_run: false,
    ttl_minutes: ttlMinutes,
    cutoff,
    found: orders.length,
    cancelled,
    skipped_not_pending: skippedNotPending,
    cancel_errors: cancelErrors,
    unresolved_items: unresolvedItems,
    restored_stock_for: restoredStockFor,
    restore_errors: restoreErrors,
    preview,
  });
}

export async function GET() {
  return jsonNoStore(
    { error: "Metodo no permitido. Usa POST con x-maintenance-secret." },
    { status: 405 },
  );
}

export async function POST(request: NextRequest) {
  return runCleanup(request);
}
