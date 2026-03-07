import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  isOrderLookupSecretConfigured,
  verifyOrderLookupToken,
} from "@/lib/order-token";

interface FulfillmentLogRow {
  action: string;
  status: string;
  payload: Record<string, unknown> | null;
  response: Record<string, unknown> | null;
  created_at: string;
}

interface FulfillmentSummary {
  has_dropi_error: boolean;
  has_dropi_success: boolean;
  last_error: string | null;
  last_event_at: string | null;
  last_action: string | null;
  last_status: string | null;
  skipped_reason: string | null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function getRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function getString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function extractErrorFromLog(log: FulfillmentLogRow | null): string | null {
  if (!log) return null;
  const payload = getRecord(log.payload);
  const response = getRecord(log.response);

  return (
    getString(response.error) ||
    getString(payload.error) ||
    getString(response.message) ||
    getString(payload.message) ||
    null
  );
}

function buildFulfillmentSummary(logRows: FulfillmentLogRow[]): FulfillmentSummary {
  if (!logRows.length) {
    return {
      has_dropi_error: false,
      has_dropi_success: false,
      last_error: null,
      last_event_at: null,
      last_action: null,
      last_status: null,
      skipped_reason: null,
    };
  }

  const latest = logRows[0];
  const latestDropiError =
    logRows.find((row) => row.action === "dropi_order_created" && row.status === "error") ||
    null;
  const latestDropiSuccess =
    logRows.find((row) => row.action === "dropi_order_created" && row.status === "success") ||
    null;
  const latestStatusSkipped =
    logRows.find((row) => row.action === "order_status_update_skipped") || null;
  const latestStatusUpdateError =
    logRows.find((row) => row.action === "order_status_update" && row.status === "error") ||
    null;

  const skippedReason = latestStatusSkipped
    ? getString(getRecord(latestStatusSkipped.payload).reason)
    : null;

  return {
    has_dropi_error: Boolean(latestDropiError),
    has_dropi_success: Boolean(latestDropiSuccess),
    last_error:
      extractErrorFromLog(latestDropiError) ||
      extractErrorFromLog(latestStatusUpdateError) ||
      extractErrorFromLog(latestStatusSkipped),
    last_event_at: latest.created_at || null,
    last_action: latest.action || null,
    last_status: latest.status || null,
    skipped_reason: skippedReason,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit({
    key: `order-lookup:${clientIp}`,
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { order: null },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  const { paymentId } = await params;
  const reference = String(paymentId || "").trim();
  const token = request.nextUrl.searchParams.get("token") || "";

  if (!isSupabaseAdminConfigured || !isUuid(reference)) {
    return NextResponse.json({ order: null });
  }

  const hasLookupSecret = isOrderLookupSecretConfigured();
  if (hasLookupSecret) {
    if (!verifyOrderLookupToken(reference, token)) {
      return NextResponse.json({ order: null }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // In production, never expose order lookups without signed token support.
    return NextResponse.json({ order: null }, { status: 401 });
  }

  const { data } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", reference)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ order: null });
  }

  const { data: fulfillmentData } = await supabaseAdmin
    .from("fulfillment_logs")
    .select("action,status,payload,response,created_at")
    .eq("order_id", reference)
    .order("created_at", { ascending: false })
    .limit(30);

  const fulfillmentSummary = buildFulfillmentSummary(
    (fulfillmentData || []) as FulfillmentLogRow[]
  );

  return NextResponse.json({
    order: data,
    fulfillment: fulfillmentSummary,
  });
}
