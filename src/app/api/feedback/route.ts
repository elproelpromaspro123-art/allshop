import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  isFeedbackWebhookConfigured,
  sendFeedbackToDiscord,
  type FeedbackType,
} from "@/lib/feedback-discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FeedbackBody {
  type?: string;
  name?: string;
  email?: string;
  message?: string;
  orderId?: string;
  page?: string;
}

const ALLOWED_TYPES = new Set<FeedbackType>([
  "error",
  "sugerencia",
  "comentario",
]);

function clean(value: unknown): string {
  return String(value || "").trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidGmail(email: string): boolean {
  return isValidEmail(email) && email.toLowerCase().endsWith("@gmail.com");
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit({
    key: `feedback:${clientIp}`,
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  if (!isFeedbackWebhookConfigured()) {
    return NextResponse.json(
      { error: "Canal de feedback no disponible por ahora." },
      { status: 503 }
    );
  }

  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 }
    );
  }

  const type = clean(body.type).toLowerCase();
  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const message = clean(body.message);
  const orderId = clean(body.orderId);
  const page = clean(body.page);

  if (!ALLOWED_TYPES.has(type as FeedbackType)) {
    return NextResponse.json(
      { error: "Tipo de feedback inválido." },
      { status: 400 }
    );
  }

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "Nombre inválido." },
      { status: 400 }
    );
  }

  if (!isValidGmail(email) || email.length > 120) {
    return NextResponse.json(
      { error: "El correo debe ser una cuenta Gmail válida (@gmail.com)." },
      { status: 400 }
    );
  }

  if (message.length < 10 || message.length > 2000) {
    return NextResponse.json(
      { error: "El mensaje debe tener entre 10 y 2000 caracteres." },
      { status: 400 }
    );
  }

  if (orderId.length > 80 || page.length > 240) {
    return NextResponse.json(
      { error: "Datos opcionales inválidos." },
      { status: 400 }
    );
  }

  try {
    await sendFeedbackToDiscord({
      type: type as FeedbackType,
      name,
      email,
      message,
      orderId: orderId || null,
      page: page || null,
      clientIp,
      userAgent: request.headers.get("user-agent"),
    });
  } catch (error) {
    console.error("[Feedback] Discord send error:", error);
    return NextResponse.json(
      { error: "No se pudo enviar el feedback ahora. Intenta nuevamente." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
