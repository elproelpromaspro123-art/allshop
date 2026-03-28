import { NextRequest, NextResponse } from "next/server";
import { validateSameOrigin } from "@/lib/csrf";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production" && !validateSameOrigin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const clientIp = getClientIp(req.headers);
    const rateLimit = await checkRateLimitDb({
      key: `abandoned-cart:${clientIp}`,
      limit: 5,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 60) } },
      );
    }

    const body = await req.json();
    const { phone, items, total } = body;

    if (!phone || !items) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    logger.info("[abandoned-cart] Cart recorded", {
      phone: String(phone).slice(0, 6) + "...",
      itemCount: Array.isArray(items) ? items.length : 0,
      total,
    });

    return NextResponse.json({
      success: true,
      message: "Abandoned cart recorded.",
    });
  } catch (error) {
    logger.error("[abandoned-cart] Error", { error });
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
