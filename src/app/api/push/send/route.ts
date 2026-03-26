import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
  actions?: Array<{ action: string; title: string }>;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh_key: string; auth_key: string },
  payload: PushPayload,
): Promise<boolean> {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const _vapidEmail = process.env.VAPID_EMAIL || "mailto:vortixyoficial@gmail.com";

  if (!vapidPublicKey || !vapidPrivateKey) {
    logger.warn("[push-send] VAPID keys not configured");
    return false;
  }

  try {
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        TTL: "86400",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 410 || response.status === 404) {
      if (isSupabaseAdminConfigured) {
        await supabaseAdmin
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", subscription.endpoint);
      }
      return false;
    }

    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, body: messageBody, icon, url, tag, actions, targetEndpoint } = body as PushPayload & {
      targetEndpoint?: string;
    };

    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const payload: PushPayload = {
      title,
      body: messageBody || "Nueva notificación de Vortixy",
      icon: icon || "/icon-192.png",
      url: url || "/",
      tag: tag || "vortixy",
      actions,
    };

    if (!isSupabaseAdminConfigured) {
      return NextResponse.json(
        { error: "Push notifications require Supabase admin" },
        { status: 500 },
      );
    }

    let query = supabaseAdmin.from("push_subscriptions").select("*");

    if (targetEndpoint) {
      query = query.eq("endpoint", targetEndpoint);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      logger.error("[push-send] Failed to fetch subscriptions", { error });
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscriptions found" });
    }

    const results = await Promise.allSettled(
      subscriptions.map((sub) => sendWebPush(sub, payload)),
    );

    const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;

    logger.info("[push-send] Push notifications sent", { sent, total: subscriptions.length });

    return NextResponse.json({
      sent,
      total: subscriptions.length,
    });
  } catch (error) {
    logger.error("[push-send] Failed to send push", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
