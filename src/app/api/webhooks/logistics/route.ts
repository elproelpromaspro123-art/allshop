import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { notifyOrderStatus } from "@/lib/notifications";
import type { OrderStatus } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

interface WebhookIdentifiers {
  localOrderId: string | null;
  statusCandidates: string[];
  trackingCandidates: string[];
  orderReferences: string[];
}

interface OrderRow {
  id: string;
  status: OrderStatus;
  notes: string | null;
}

const STATUS_KEY_PATTERN = /(status|estado|state)/i;
const TRACKING_KEY_PATTERN = /(tracking|guia|guide|waybill|awb)/i;
const REFERENCE_KEY_PATTERN = /(order|pedido|reference|numero|number|id)/i;
const ORDER_ID_KEY_PATTERN =
  /^(local_order_id|merchant_order_id|external_order_id|vortixy_order_id|order_id)$/i;
const STATUS_CANDIDATE_LIMIT = 10;
const IDENTIFIER_LIMIT = 12;
const ORDER_SCAN_LIMIT = 300;

function getWebhookSecret(): string {
  return String(
    process.env.LOGISTICS_WEBHOOK_SECRET ||
      process.env.DROPI_WEBHOOK_SECRET ||
      process.env.ORDER_LOOKUP_SECRET ||
      ""
  ).trim();
}

function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

function getProvidedSecret(headers: Headers): string {
  const explicit =
    headers.get("x-webhook-secret") ||
    headers.get("x-dropi-webhook-secret") ||
    headers.get("x-api-key");
  if (explicit?.trim()) return explicit.trim();

  const authorization = headers.get("authorization") || "";
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch?.[1]?.trim()) return bearerMatch[1].trim();

  return "";
}

function isWebhookAuthorized(request: NextRequest): boolean {
  const expectedSecret = getWebhookSecret();
  if (!expectedSecret) {
    // Permitir pruebas en desarrollo sin secreto.
    return process.env.NODE_ENV !== "production";
  }

  const providedSecret = getProvidedSecret(request.headers);
  if (!providedSecret) return false;
  return safeCompare(expectedSecret, providedSecret);
}

function parseIncomingBody(rawBody: string, contentType: string): unknown {
  const trimmed = rawBody.trim();
  if (!trimmed) return null;

  const looksJson =
    contentType.includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[");
  if (looksJson) {
    return JSON.parse(trimmed) as unknown;
  }

  const looksForm =
    contentType.includes("application/x-www-form-urlencoded") ||
    trimmed.includes("=");
  if (looksForm) {
    const params = new URLSearchParams(trimmed);
    const entries = Array.from(params.entries());
    return Object.fromEntries(entries);
  }

  return { raw: trimmed };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function normalizeText(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sanitizeCandidate(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim();
  if (!normalized || normalized.length < 4) return null;
  return normalized.slice(0, 120);
}

function dedupeNormalized(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = normalizeText(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (result.length >= limit) break;
  }

  return result;
}

function walkJson(
  value: unknown,
  visitor: (entry: { key: string; value: unknown }) => void
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      walkJson(item, visitor);
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  for (const [key, child] of Object.entries(record)) {
    visitor({ key, value: child });
    walkJson(child, visitor);
  }
}

function extractIdentifiers(payload: unknown): WebhookIdentifiers {
  const statusCandidates: string[] = [];
  const trackingCandidates: string[] = [];
  const orderReferences: string[] = [];
  let localOrderId: string | null = null;

  walkJson(payload, ({ key, value }) => {
    const candidate = sanitizeCandidate(value);

    if (STATUS_KEY_PATTERN.test(key) && candidate) {
      statusCandidates.push(candidate);
    }

    if (TRACKING_KEY_PATTERN.test(key) && candidate) {
      trackingCandidates.push(candidate);
    }

    if (REFERENCE_KEY_PATTERN.test(key) && !TRACKING_KEY_PATTERN.test(key) && candidate) {
      orderReferences.push(candidate);
    }

    if (ORDER_ID_KEY_PATTERN.test(key) && candidate && isUuid(candidate)) {
      localOrderId = localOrderId || candidate;
    }
  });

  if (!localOrderId) {
    const directCandidates = [...orderReferences, ...trackingCandidates];
    localOrderId =
      directCandidates.find((value) => isUuid(value)) || null;
  }

  return {
    localOrderId,
    statusCandidates: dedupeNormalized(statusCandidates, STATUS_CANDIDATE_LIMIT),
    trackingCandidates: dedupeNormalized(trackingCandidates, IDENTIFIER_LIMIT),
    orderReferences: dedupeNormalized(orderReferences, IDENTIFIER_LIMIT),
  };
}

function mapExternalStatus(rawStatus: string): OrderStatus | null {
  const normalized = normalizeText(rawStatus);
  if (!normalized) return null;

  if (
    /(cancel|rechaz|return|devol|fallid|failed|anulad|denied)/.test(normalized)
  ) {
    return "cancelled";
  }

  if (
    /(deliver|entregad|completad|finalizad|recibid|fulfilled)/.test(normalized)
  ) {
    return "delivered";
  }

  if (
    /(ship|enviad|despachad|transit|ruta|reparto|out for delivery|en camino)/.test(
      normalized
    )
  ) {
    return "shipped";
  }

  if (
    /(process|proces|confirm|alistad|prepar|ready to ship|paid|pagad)/.test(
      normalized
    )
  ) {
    return "processing";
  }

  return null;
}

function resolveMappedStatus(statusCandidates: string[]): {
  rawStatus: string | null;
  mappedStatus: OrderStatus | null;
} {
  for (const candidate of statusCandidates) {
    const mapped = mapExternalStatus(candidate);
    if (mapped) {
      return { rawStatus: candidate, mappedStatus: mapped };
    }
  }

  return { rawStatus: statusCandidates[0] || null, mappedStatus: null };
}

function parseNotes(rawNotes: string | null): JsonRecord {
  if (!rawNotes) return {};

  try {
    const parsed = JSON.parse(rawNotes) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as JsonRecord;
    }
    return { previous_notes: rawNotes };
  } catch {
    return { previous_notes: rawNotes };
  }
}

function getRecord(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return {};
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractOrderNoteIdentifiers(rawNotes: string | null): {
  trackingCandidates: string[];
  dropiOrderReferences: string[];
} {
  const parsed = parseNotes(rawNotes);
  const fulfillment = getRecord(parsed.fulfillment);

  return {
    trackingCandidates: getStringArray(fulfillment.tracking_candidates),
    dropiOrderReferences: getStringArray(fulfillment.dropi_order_references),
  };
}

function hasOverlap(source: string[], target: string[]): boolean {
  if (!source.length || !target.length) return false;
  const normalizedTarget = new Set(target.map((value) => normalizeText(value)));
  return source.some((value) => normalizedTarget.has(normalizeText(value)));
}

async function findOrderById(orderId: string): Promise<OrderRow | null> {
  if (!orderId) return null;

  const { data } = await supabaseAdmin
    .from("orders")
    .select("id,status,notes")
    .eq("id", orderId)
    .maybeSingle();

  if (!data) return null;
  return data as OrderRow;
}

async function findOrderByNoteIdentifiers(input: {
  trackingCandidates: string[];
  orderReferences: string[];
}): Promise<OrderRow | null> {
  if (!input.trackingCandidates.length && !input.orderReferences.length) {
    return null;
  }

  const { data } = await supabaseAdmin
    .from("orders")
    .select("id,status,notes,created_at")
    .in("status", ["pending", "processing", "shipped"])
    .order("created_at", { ascending: false })
    .limit(ORDER_SCAN_LIMIT);

  if (!data?.length) return null;

  for (const row of data as Array<OrderRow & { created_at: string }>) {
    const noteIdentifiers = extractOrderNoteIdentifiers(row.notes);
    const trackingMatches = hasOverlap(
      input.trackingCandidates,
      noteIdentifiers.trackingCandidates
    );
    const referenceMatches = hasOverlap(
      input.orderReferences,
      noteIdentifiers.dropiOrderReferences
    );

    if (trackingMatches || referenceMatches) {
      return {
        id: row.id,
        status: row.status,
        notes: row.notes,
      };
    }
  }

  return null;
}

function shouldApplyStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): boolean {
  if (currentStatus === nextStatus) return false;
  if (["delivered", "cancelled", "refunded"].includes(currentStatus)) return false;

  if (nextStatus === "processing") {
    return currentStatus === "pending" || currentStatus === "paid";
  }

  if (nextStatus === "shipped") {
    return ["pending", "paid", "processing"].includes(currentStatus);
  }

  if (nextStatus === "delivered") {
    return ["pending", "paid", "processing", "shipped"].includes(currentStatus);
  }

  if (nextStatus === "cancelled") {
    return currentStatus !== "delivered" && currentStatus !== "refunded";
  }

  return false;
}

function patchOrderNotes(input: {
  previousNotes: string | null;
  rawStatus: string | null;
  mappedStatus: OrderStatus | null;
  trackingCandidates: string[];
  orderReferences: string[];
}): string {
  const base = parseNotes(input.previousNotes);
  const webhookState = getRecord(base.logistics_webhook);

  base.logistics_webhook = {
    ...webhookState,
    source: "logistics",
    last_event_at: new Date().toISOString(),
    last_raw_status: input.rawStatus,
    last_mapped_status: input.mappedStatus,
    last_tracking_candidates: input.trackingCandidates.slice(0, IDENTIFIER_LIMIT),
    last_order_references: input.orderReferences.slice(0, IDENTIFIER_LIMIT),
  };

  return JSON.stringify(base);
}

async function logWebhookResult(input: {
  orderId: string;
  status: "success" | "pending" | "error";
  payload: JsonRecord;
  response?: JsonRecord;
}): Promise<void> {
  try {
    await supabaseAdmin.from("fulfillment_logs").insert({
      order_id: input.orderId,
      action: "logistics_webhook",
      status: input.status,
      payload: input.payload,
      response: input.response || null,
    });
  } catch (error) {
    console.error("[LogisticsWebhook] Error writing fulfillment log:", error);
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Webhook logistico activo",
    endpoint: "/api/webhooks/logistics",
  });
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit({
    key: `logistics-webhook:${clientIp}`,
    limit: 120,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Base de datos no configurada para webhooks." },
      { status: 500 }
    );
  }

  if (!isWebhookAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const rawBody = await request.text();
  let payload: unknown;

  try {
    payload = parseIncomingBody(rawBody, request.headers.get("content-type") || "");
  } catch {
    return NextResponse.json(
      { error: "Payload invalido en webhook." },
      { status: 400 }
    );
  }

  const normalizedPayload: unknown =
    payload && typeof payload === "object" ? payload : { payload };
  const identifiers = extractIdentifiers(normalizedPayload);
  const { rawStatus, mappedStatus } = resolveMappedStatus(identifiers.statusCandidates);

  if (!mappedStatus) {
    return NextResponse.json({
      ok: true,
      ignored: true,
      reason: "No se pudo mapear estado logistico.",
      received_status_candidates: identifiers.statusCandidates,
    });
  }

  let order: OrderRow | null = null;
  if (identifiers.localOrderId) {
    order = await findOrderById(identifiers.localOrderId);
  }

  if (!order) {
    order = await findOrderByNoteIdentifiers({
      trackingCandidates: identifiers.trackingCandidates,
      orderReferences: identifiers.orderReferences,
    });
  }

  if (!order) {
    return NextResponse.json({
      ok: true,
      ignored: true,
      reason: "No se encontro pedido para actualizar.",
      mapped_status: mappedStatus,
      raw_status: rawStatus,
      local_order_id: identifiers.localOrderId,
    });
  }

  const nextStatus: OrderStatus = shouldApplyStatusTransition(
    order.status,
    mappedStatus
  )
    ? mappedStatus
    : order.status;

  const nextNotes = patchOrderNotes({
    previousNotes: order.notes,
    rawStatus,
    mappedStatus,
    trackingCandidates: identifiers.trackingCandidates,
    orderReferences: identifiers.orderReferences,
  });

  const updatePayload =
    nextStatus !== order.status
      ? { status: nextStatus, notes: nextNotes }
      : { notes: nextNotes };

  const { data: updatedOrder, error: updateError } = await supabaseAdmin
    .from("orders")
    .update(updatePayload)
    .eq("id", order.id)
    .select("id,status")
    .maybeSingle();

  if (updateError || !updatedOrder) {
    await logWebhookResult({
      orderId: order.id,
      status: "error",
      payload: {
        mapped_status: mappedStatus,
        raw_status: rawStatus,
        identifiers,
      },
      response: {
        error: updateError?.message || "Order update failed",
      },
    });

    return NextResponse.json(
      { error: "No se pudo actualizar el pedido." },
      { status: 409 }
    );
  }

  const statusChanged = updatedOrder.status !== order.status;

  await logWebhookResult({
    orderId: order.id,
    status: statusChanged ? "success" : "pending",
    payload: {
      mapped_status: mappedStatus,
      raw_status: rawStatus,
      identifiers,
    },
    response: {
      previous_status: order.status,
      next_status: updatedOrder.status,
    },
  });

  if (statusChanged) {
    try {
      await notifyOrderStatus(order.id, updatedOrder.status as OrderStatus);
    } catch (error) {
      console.error("[LogisticsWebhook] Error notifying order status:", error);
    }
  }

  return NextResponse.json({
    ok: true,
    order_id: order.id,
    previous_status: order.status,
    next_status: updatedOrder.status,
    status_changed: statusChanged,
  });
}
