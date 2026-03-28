import { NextResponse } from "next/server";
import { createSign } from "node:crypto";
import { logger } from "@/lib/logger";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";
import { readEnvValue } from "@/lib/env";
import { checkRateLimitDb } from "@/lib/rate-limit";

const PUSH_SEND_SECRET = readEnvValue("PUSH_SEND_SECRET");

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
  actions?: Array<{ action: string; title: string }>;
}

function buildVapidAuthHeader(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidEmail: string,
): string | null {
  try {
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const header = Buffer.from(
      JSON.stringify({ typ: "JWT", alg: "ES256" }),
    ).toString("base64url");

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 12 * 60 * 60;
    const claims = Buffer.from(
      JSON.stringify({ aud: audience, exp, sub: vapidEmail }),
    ).toString("base64url");

    const unsignedToken = `${header}.${claims}`;

    const keyDer = Buffer.from(
      vapidPrivateKey.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    );
    const signer = createSign("SHA256");
    signer.update(unsignedToken);
    const signature = signer.sign(
      { key: keyDer, format: "der", type: "pkcs8" },
      "base64url",
    );

    const jwt = `${unsignedToken}.${signature}`;
    return `vapid t=${jwt},k=${vapidPublicKey}`;
  } catch {
    return null;
  }
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh_key: string; auth_key: string },
  payload: PushPayload,
): Promise<boolean> {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || "mailto:vortixyoficial@gmail.com";

  if (!vapidPublicKey || !vapidPrivateKey) {
    logger.warn("[push-send] VAPID keys not configured");
    return false;
  }

  try {
    const authHeader = buildVapidAuthHeader(
      subscription.endpoint,
      vapidPublicKey,
      vapidPrivateKey,
      vapidEmail,
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      TTL: "86400",
    };

    if (authHeader) {
      headers.Urgency = "high";
      headers.Authorization = authHeader;
    }

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers,
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
    if (PUSH_SEND_SECRET) {
      const token = request.headers.get("x-push-secret");
      if (token !== PUSH_SEND_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const rate = await checkRateLimitDb({
      key: `push-send:${new URL(request.url).hostname}`,
      limit: 5,
      windowMs: 60_000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSeconds ?? 60),
          },
        },
      );
    }

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
