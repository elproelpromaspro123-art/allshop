import { NextRequest, NextResponse } from "next/server";
import {
  isCatalogAdminCodeConfigured,
  isCatalogAdminCodeValid,
} from "@/lib/catalog-admin-auth";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";
import { isDiscordConfigured } from "@/lib/discord";
import { isEmailConfigured, notifyOrderStatus } from "@/lib/notifications";
import type { OrderStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const ORDER_BASE_SELECT =
  "id,status,customer_name,customer_email,customer_phone,customer_document,shipping_city,shipping_department,total,items,notes,created_at,updated_at";

interface OrderControlRow {
  id: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_document: string;
  shipping_city: string;
  shipping_department: string;
  total: number;
  items: unknown;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface UpdateBody {
  order_id?: string;
  status?: string;
  advance_stage?: boolean;
  tracking_code?: string | null;
  dispatch_reference?: string | null;
  internal_note?: string | null;
  customer_note?: string | null;
  notify_customer?: boolean;
  send_email_only?: boolean;
}

function parseAdminCode(request: NextRequest): string {
  return (
    String(request.headers.get("x-catalog-admin-code") || "").trim() ||
    String(request.nextUrl.searchParams.get("code") || "").trim()
  );
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
      { error: "Codigo de acceso invalido." },
      { status: 401 }
    );
  }

  return null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function parseStatus(value: unknown): OrderStatus | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  return ORDER_STATUSES.includes(normalized as OrderStatus)
    ? (normalized as OrderStatus)
    : null;
}

function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  if (current === "pending" || current === "paid") return "processing";
  if (current === "processing") return "shipped";
  if (current === "shipped") return "delivered";
  return null;
}

function sanitizeShortText(value: string, maxLength: number): string {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.slice(0, maxLength);
}

function normalizeDigits(value: string): string {
  return String(value || "").replace(/\D+/g, "");
}

function parseNotesObject(rawNotes: string | null): Record<string, unknown> {
  if (!rawNotes) return {};

  try {
    const parsed = JSON.parse(rawNotes) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { previous_notes: rawNotes };
  } catch {
    return { previous_notes: rawNotes };
  }
}

function getRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => sanitizeShortText(String(entry || ""), 120))
    .filter((entry) => entry.length > 0);
}

function uniqueFirst(value: string, current: string[]): string[] {
  const normalizedCandidate = value.toLowerCase();
  return [
    value,
    ...current.filter((entry) => entry.toLowerCase() !== normalizedCandidate),
  ];
}

function parseOptionalStringField(
  value: unknown,
  maxLength: number
): { defined: boolean; value: string | null } {
  if (value === undefined) {
    return { defined: false, value: null };
  }

  if (value === null) {
    return { defined: true, value: null };
  }

  const normalized = sanitizeShortText(String(value || ""), maxLength);
  return {
    defined: true,
    value: normalized.length > 0 ? normalized : null,
  };
}

function extractTrackingCode(notes: string | null): string | null {
  const parsed = parseNotesObject(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  const candidates = parseStringArray(fulfillment.tracking_candidates);
  return candidates[0] || null;
}

function extractDispatchReference(notes: string | null): string | null {
  const parsed = parseNotesObject(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  const references = parseStringArray(fulfillment.provider_order_references);
  return references[0] || null;
}

function extractLatestInternalNote(notes: string | null): string | null {
  const parsed = parseNotesObject(notes);
  const adminControl = getRecord(parsed.admin_control);
  const latest = sanitizeShortText(String(adminControl.last_internal_note || ""), 1200);
  return latest || null;
}

function extractLatestCustomerNote(notes: string | null): string | null {
  const parsed = parseNotesObject(notes);
  const customerUpdates = getRecord(parsed.customer_updates);
  const latest = sanitizeShortText(String(customerUpdates.latest_note || ""), 1200);
  return latest || null;
}

function buildItemsPreview(itemsRaw: unknown): { item_count: number; preview: string[] } {
  if (!Array.isArray(itemsRaw)) {
    return { item_count: 0, preview: [] };
  }

  const mapped = itemsRaw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const name = sanitizeShortText(String(row.product_name || row.name || ""), 120);
      if (!name) return null;
      const quantity = Math.max(1, Math.floor(Number(row.quantity) || 1));
      const variant = sanitizeShortText(String(row.variant || ""), 80);
      return variant ? `${name} x${quantity} (${variant})` : `${name} x${quantity}`;
    })
    .filter((entry): entry is string => Boolean(entry));

  return {
    item_count: mapped.length,
    preview: mapped.slice(0, 4),
  };
}

function summarizeOrder(row: OrderControlRow) {
  const items = buildItemsPreview(row.items);
  return {
    id: row.id,
    status: row.status,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    customer_document: row.customer_document,
    shipping_city: row.shipping_city,
    shipping_department: row.shipping_department,
    total: Math.max(0, Number(row.total) || 0),
    item_count: items.item_count,
    items_preview: items.preview,
    tracking_code: extractTrackingCode(row.notes),
    dispatch_reference: extractDispatchReference(row.notes),
    last_internal_note: extractLatestInternalNote(row.notes),
    last_customer_note: extractLatestCustomerNote(row.notes),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function orderMatchesQuery(row: OrderControlRow, rawQuery: string): boolean {
  const query = sanitizeShortText(rawQuery, 120).toLowerCase();
  if (!query) return true;

  const digits = normalizeDigits(query);
  const idMatch = row.id.toLowerCase().includes(query);
  const nameMatch = String(row.customer_name || "").toLowerCase().includes(query);
  const emailMatch = String(row.customer_email || "").toLowerCase().includes(query);
  const cityMatch = String(row.shipping_city || "").toLowerCase().includes(query);
  const departmentMatch = String(row.shipping_department || "")
    .toLowerCase()
    .includes(query);

  const phoneMatch = digits
    ? normalizeDigits(row.customer_phone).includes(digits)
    : false;
  const documentMatch = digits
    ? normalizeDigits(row.customer_document).includes(digits)
    : false;

  return (
    idMatch ||
    nameMatch ||
    emailMatch ||
    cityMatch ||
    departmentMatch ||
    phoneMatch ||
    documentMatch
  );
}

export async function GET(request: NextRequest) {
  const authError = assertAdminAccess(request);
  if (authError) return authError;

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Supabase no esta configurado para administrar pedidos." },
      { status: 500 }
    );
  }

  try {
    const statusFilter = parseStatus(request.nextUrl.searchParams.get("status"));
    const query = String(request.nextUrl.searchParams.get("q") || "").trim();
    const rawLimit = Number(request.nextUrl.searchParams.get("limit") || 40);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.floor(rawLimit), 10), 100)
      : 40;

    let dbQuery = supabaseAdmin
      .from("orders")
      .select(ORDER_BASE_SELECT)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (statusFilter) {
      dbQuery = dbQuery.eq("status", statusFilter);
    }

    const { data, error } = await dbQuery;
    if (error) {
      throw new Error(error.message);
    }

    const rows = ((data || []) as OrderControlRow[]).filter((row) =>
      orderMatchesQuery(row, query)
    );

    return NextResponse.json(
      {
        orders: rows.map((row) => summarizeOrder(row)),
        integrations: {
          discord_webhook_configured: isDiscordConfigured(),
          smtp_configured: isEmailConfigured(),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[OrderControl][GET] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar la gestion de pedidos.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authError = assertAdminAccess(request);
  if (authError) return authError;

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Supabase no esta configurado para administrar pedidos." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as UpdateBody;
    const orderId = String(body.order_id || "").trim().toLowerCase();
    if (!isUuid(orderId)) {
      return NextResponse.json(
        { error: "order_id invalido." },
        { status: 400 }
      );
    }

    const requestedStatus = parseStatus(body.status);
    if (body.status !== undefined && !requestedStatus) {
      return NextResponse.json(
        { error: "Estado invalido para el pedido." },
        { status: 400 }
      );
    }

    const trackingInput = parseOptionalStringField(body.tracking_code, 80);
    const dispatchInput = parseOptionalStringField(body.dispatch_reference, 80);
    const internalNoteInput = parseOptionalStringField(body.internal_note, 1800);
    const customerNoteInput = parseOptionalStringField(body.customer_note, 1800);
    const advanceStage = body.advance_stage === true;
    const notifyCustomer = body.notify_customer === true;
    const sendEmailOnly = body.send_email_only === true;

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(ORDER_BASE_SELECT)
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !orderData) {
      return NextResponse.json(
        { error: "Pedido no encontrado." },
        { status: 404 }
      );
    }

    const order = orderData as OrderControlRow;
    let targetStatus: OrderStatus = order.status;

    if (requestedStatus) {
      targetStatus = requestedStatus;
    } else if (advanceStage) {
      const next = nextOrderStatus(order.status);
      if (!next) {
        return NextResponse.json(
          {
            error:
              "Este pedido ya esta en estado final y no tiene siguiente etapa automatica.",
          },
          { status: 409 }
        );
      }
      targetStatus = next;
    }

    const now = new Date().toISOString();
    let notesMutated = false;
    const nextNotesObject = parseNotesObject(order.notes);

    const fulfillment = getRecord(nextNotesObject.fulfillment);
    const currentReferences = parseStringArray(fulfillment.provider_order_references);
    const currentTracking = parseStringArray(fulfillment.tracking_candidates);

    if (dispatchInput.defined) {
      if (dispatchInput.value) {
        fulfillment.provider_order_references = uniqueFirst(
          dispatchInput.value,
          currentReferences
        );
        if (!fulfillment.dispatched_at) {
          fulfillment.dispatched_at = now;
        }
      } else {
        fulfillment.provider_order_references = [];
      }
      notesMutated = true;
    }

    if (trackingInput.defined) {
      if (trackingInput.value) {
        fulfillment.tracking_candidates = uniqueFirst(
          trackingInput.value,
          currentTracking
        );
      } else {
        fulfillment.tracking_candidates = [];
      }
      notesMutated = true;
    }

    if (
      ["processing", "shipped", "delivered"].includes(targetStatus) &&
      !fulfillment.dispatched_at
    ) {
      fulfillment.dispatched_at = now;
      notesMutated = true;
    }

    if (notesMutated || Object.keys(fulfillment).length > 0) {
      fulfillment.updated_at = now;
      fulfillment.source = "manual_admin_panel";
      nextNotesObject.fulfillment = fulfillment;
    }

    const adminControl = getRecord(nextNotesObject.admin_control);
    const history = Array.isArray(adminControl.history)
      ? adminControl.history.filter((entry) => entry && typeof entry === "object")
      : [];

    if (internalNoteInput.defined) {
      adminControl.last_internal_note = internalNoteInput.value;
      adminControl.last_internal_note_at = now;
      if (internalNoteInput.value) {
        history.push({
          at: now,
          type: "internal_note",
          value: internalNoteInput.value,
          by: "admin_panel",
        });
      }
      notesMutated = true;
    }

    if (customerNoteInput.defined) {
      const customerUpdates = getRecord(nextNotesObject.customer_updates);
      customerUpdates.latest_note = customerNoteInput.value;
      customerUpdates.latest_note_at = now;
      customerUpdates.source = "manual_admin_panel";
      nextNotesObject.customer_updates = customerUpdates;

      adminControl.last_customer_note = customerNoteInput.value;
      adminControl.last_customer_note_at = now;
      if (customerNoteInput.value) {
        history.push({
          at: now,
          type: "customer_note",
          value: customerNoteInput.value,
          by: "admin_panel",
        });
      }
      notesMutated = true;
    }

    if (advanceStage || requestedStatus) {
      history.push({
        at: now,
        type: "status_update",
        from: order.status,
        to: targetStatus,
        by: "admin_panel",
      });
      notesMutated = true;
    }

    if (history.length > 0) {
      adminControl.history = history.slice(-25);
      adminControl.updated_at = now;
      adminControl.updated_by = "admin_panel";
      nextNotesObject.admin_control = adminControl;
    }

    const statusChanged = targetStatus !== order.status;
    const requiresUpdate = statusChanged || notesMutated;

    if (!requiresUpdate && !sendEmailOnly && !notifyCustomer) {
      return NextResponse.json(
        {
          error:
            "No hay cambios para guardar. Ajusta estado, guia, referencia o notas.",
        },
        { status: 400 }
      );
    }

    let updatedOrder = order;
    if (requiresUpdate) {
      const nextNotes = JSON.stringify(nextNotesObject);
      const updatePayload: Record<string, unknown> = {
        notes: nextNotes,
      };
      if (statusChanged) {
        updatePayload.status = targetStatus;
      }

      const { data: updatedData, error: updateError } = await supabaseAdmin
        .from("orders")
        .update(updatePayload)
        .eq("id", order.id)
        .select(ORDER_BASE_SELECT)
        .single();

      if (updateError || !updatedData) {
        throw new Error(
          updateError?.message || "No se pudo actualizar el pedido."
        );
      }

      updatedOrder = updatedData as OrderControlRow;
    }

    let emailSent = false;
    let emailError: string | null = null;

    if (notifyCustomer || sendEmailOnly) {
      try {
        await notifyOrderStatus(updatedOrder.id, updatedOrder.status);
        emailSent = true;
      } catch (error) {
        emailError =
          error instanceof Error
            ? error.message
            : "No se pudo enviar el correo al cliente.";
      }
    }

    return NextResponse.json({
      ok: true,
      updated: summarizeOrder(updatedOrder),
      status_changed: statusChanged,
      email_sent: emailSent,
      email_error: emailError,
    });
  } catch (error) {
    console.error("[OrderControl][PATCH] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el pedido.",
      },
      { status: 500 }
    );
  }
}
