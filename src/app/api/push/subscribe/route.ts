import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";
import { validateSameOrigin } from "@/lib/csrf";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const clientIp = getClientIp(request.headers);
    const rateLimit = await checkRateLimitDb({
      key: `push-subscribe:${clientIp}`,
      limit: 10,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 60) } },
      );
    }

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Missing required fields: endpoint, keys.p256dh, keys.auth" },
        { status: 400 },
      );
    }

    if (isSupabaseAdminConfigured) {
      await supabaseAdmin
        .from("push_subscriptions")
        .upsert(
          {
            endpoint,
            p256dh_key: keys.p256dh,
            auth_key: keys.auth,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "endpoint" },
        );
    }

    logger.info("[push-subscribe] Push subscription saved", { endpoint: endpoint.slice(0, 50) });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[push-subscribe] Failed to save push subscription", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing required field: endpoint" },
        { status: 400 },
      );
    }

    if (isSupabaseAdminConfigured) {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint);
    }

    logger.info("[push-subscribe] Push subscription removed");
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[push-subscribe] Failed to remove push subscription", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
