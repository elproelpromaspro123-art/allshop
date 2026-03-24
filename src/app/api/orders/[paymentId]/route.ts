import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { buildManualFulfillmentSummary } from "@/lib/order-tracking";
import {
  isOrderLookupSecretConfigured,
  verifyOrderLookupToken,
} from "@/lib/order-token";
import { isUuid } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitDb({
    key: `order-lookup:${clientIp}`,
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return apiError("Demasiadas solicitudes.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      headers: noStoreHeaders({
        "Retry-After": String(rateLimit.retryAfterSeconds),
      }),
    });
  }

  const { paymentId } = await params;
  const reference = String(paymentId || "").trim();
  const token = request.nextUrl.searchParams.get("token") || "";

  if (!isSupabaseAdminConfigured || !isUuid(reference)) {
    return apiOkFields({ order: null }, { headers: noStoreHeaders() });
  }

  const hasLookupSecret = isOrderLookupSecretConfigured();
  if (hasLookupSecret) {
    if (!verifyOrderLookupToken(reference, token)) {
      return apiError("No autorizado.", {
        status: 401,
        code: "UNAUTHORIZED",
        headers: noStoreHeaders(),
      });
    }
  } else if (process.env.NODE_ENV === "production") {
    return apiError("No autorizado.", {
      status: 401,
      code: "UNAUTHORIZED",
      headers: noStoreHeaders(),
    });
  }

  const { data } = await supabaseAdmin
    .from("orders")
    .select(
      "id,status,items,subtotal,shipping_cost,total,created_at,updated_at,notes",
    )
    .eq("id", reference)
    .maybeSingle();

  if (!data) {
    return apiOkFields({ order: null }, { headers: noStoreHeaders() });
  }

  const orderStatus = String((data as { status?: unknown })?.status || "");
  const orderUpdatedAt =
    String((data as { updated_at?: unknown })?.updated_at || "").trim() || null;
  const orderNotes = (data as { notes?: unknown })?.notes;
  const fulfillmentSummary = buildManualFulfillmentSummary(
    orderStatus,
    orderNotes,
    orderUpdatedAt,
  );

  return apiOkFields(
    {
      order: data,
      fulfillment: fulfillmentSummary,
    },
    { headers: noStoreHeaders() },
  );
}
