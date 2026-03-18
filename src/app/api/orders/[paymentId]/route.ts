import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import {
  isOrderLookupSecretConfigured,
  verifyOrderLookupToken,
} from "@/lib/order-token";

interface FulfillmentSummary {
  has_dispatch_error: boolean;
  has_dispatch_success: boolean;
  last_error: string | null;
  last_event_at: string | null;
  last_action: string | null;
  last_status: string | null;
  skipped_reason: string | null;
}

// isUuid is now imported from @/lib/utils (fix 8.1)
import { isUuid } from "@/lib/utils";

function buildManualFulfillmentSummary(status: string, updatedAt?: string | null): FulfillmentSummary {
  const isDispatchedLike = ["processing", "shipped", "delivered"].includes(
    String(status || "").toLowerCase()
  );

  return {
    has_dispatch_error: false,
    has_dispatch_success: isDispatchedLike,
    last_error: null,
    last_event_at: updatedAt || null,
    last_action: isDispatchedLike ? "manual_dispatch" : null,
    last_status: isDispatchedLike ? "success" : null,
    skipped_reason: null,
  };
}

export async function GET(
  request: NextRequest,
  // Note: route param is named paymentId for legacy URL compatibility, but it's actually an orderId (fix 3.8)
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitDb({
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

  // Only return safe fields — NO PII like email, phone, document, address (fix 1.5)
  const { data } = await supabaseAdmin
    .from("orders")
    .select("id,status,items,subtotal,shipping_cost,total,created_at,updated_at,notes")
    .eq("id", reference)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ order: null });
  }

  const orderStatus = String((data as { status?: unknown })?.status || "");
  const orderUpdatedAt = String((data as { updated_at?: unknown })?.updated_at || "").trim() || null;
  const fulfillmentSummary = buildManualFulfillmentSummary(orderStatus, orderUpdatedAt);

  return NextResponse.json({
    order: data,
    fulfillment: fulfillmentSummary,
  });
}
