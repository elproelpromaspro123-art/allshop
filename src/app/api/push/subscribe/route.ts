import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
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
