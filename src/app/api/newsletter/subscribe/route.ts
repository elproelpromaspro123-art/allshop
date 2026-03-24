import { NextResponse } from "next/server";
import { sendNewsletterSubscriptionToDiscord } from "@/lib/discord-newsletter";
import { getClientIp } from "@/lib/utils";
import { validateCsrfToken, validateSameOrigin } from "@/lib/csrf";

/**
 * Newsletter subscription handler with Discord notifications.
 * Validates email and sends real-time alerts for new subscribers.
 */

const SUBSCRIBED_IPS = new Map<string, number>();
const SUBSCRIPTION_COOLDOWN_MS = 60_000; // 1 minute per IP

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    // CSRF + same-origin validation
    if (process.env.NODE_ENV === "production") {
      if (!validateSameOrigin(request)) {
        return NextResponse.json(
          { error: "Solicitud no autorizada." },
          { status: 403 },
        );
      }
    }

    const csrfToken = request.headers.get("x-csrf-token");
    if (!validateCsrfToken(csrfToken)) {
      return NextResponse.json(
        { error: "Token de seguridad inválido. Recarga la página." },
        { status: 403 },
      );
    }
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    
    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 }
      );
    }
    
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }
    
    // Check for duplicate submissions from same IP
    const clientIp = getClientIp(request.headers);
    const now = Date.now();
    const lastSubmission = SUBSCRIBED_IPS.get(clientIp) || 0;
    
    if (now - lastSubmission < SUBSCRIPTION_COOLDOWN_MS) {
      return NextResponse.json(
        { error: "Ya te has suscrito recientemente" },
        { status: 429 }
      );
    }
    
    // Record this subscription
    SUBSCRIBED_IPS.set(clientIp, now);
    
    // Send Discord notification (async, don't block response)
    sendNewsletterSubscriptionToDiscord({
      email,
      ip: clientIp,
      userAgent: request.headers.get("user-agent") || null,
      path: request.headers.get("referer") || null,
    }).catch((err) => {
      console.error("[Newsletter] Discord notification failed:", err);
    });
    
    // In a real implementation, you would:
    // 1. Save to database
    // 2. Send confirmation email
    // 3. Add to email marketing platform (Mailchimp, etc.)
    
    return NextResponse.json({ 
      success: true, 
      message: "¡Gracias por suscribirte!" 
    });
  } catch (error) {
    console.error("[Newsletter] Subscription error:", error);
    return NextResponse.json(
      { error: "Error al suscribirse" },
      { status: 500 }
    );
  }
}
