import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  isOrderLookupSecretConfigured,
  verifyOrderLookupToken,
} from "@/lib/order-token";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
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

  return NextResponse.json({ order: data });
}
