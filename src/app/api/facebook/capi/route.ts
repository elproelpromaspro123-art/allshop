import { NextRequest, NextResponse } from "next/server";
import { validateSameOrigin } from "@/lib/csrf";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { logger } from "@/lib/logger";

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_API_URL = `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events`;

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production" && !validateSameOrigin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const clientIp = getClientIp(req.headers);
    const rateLimit = await checkRateLimitDb({
      key: `fb-capi:${clientIp}`,
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 60) } },
      );
    }

    const body = await req.json();
    const { eventName, eventData, clientIp: bodyClientIp, userAgent, fbc, fbp } = body;

    if (!META_ACCESS_TOKEN || !META_PIXEL_ID) {
      logger.debug("[fb-capi] STUB: Missing keys, event received", { eventName });
      return NextResponse.json({ success: true, stub: true });
    }

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: {
            client_ip_address: bodyClientIp,
            client_user_agent: userAgent,
            fbc: fbc || undefined,
            fbp: fbp || undefined,
            ...eventData.userData,
          },
          custom_data: eventData.customData,
        },
      ],
    };

    const fbRes = await fetch(
      `${META_API_URL}?access_token=${META_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const fbJson = await fbRes.json();
    return NextResponse.json({ success: true, fbResponse: fbJson });
  } catch (error) {
    logger.error("[fb-capi] Meta CAPI Error", { error });
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
