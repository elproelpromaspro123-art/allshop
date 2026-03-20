import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { sanitizeText, sanitizeEmail } from "@/lib/sanitize";
import { isFeedbackWebhookConfigured, sendFeedbackToDiscord } from "@/lib/feedback-discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxBodySize = 5 * 1024;

const ALLOWED_REQUEST_TYPES = new Set([
  "access",
  "update",
  "delete",
  "export",
]);

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  if (
    request.headers.get("content-length") &&
    Number(request.headers.get("content-length")) > maxBodySize
  ) {
    return NextResponse.json(
      { error: "Solicitud demasiado grande." },
      { status: 413 },
    );
  }

  const rateLimit = await checkRateLimitDb({
    key: `habeas:${clientIp}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    console.warn(`[HabeasData] Rate limit hit for IP: ${clientIp}`);
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      { status: 429 },
    );
  }

  if (!isFeedbackWebhookConfigured()) {
    return NextResponse.json(
      { error: "Servicio no disponible por ahora." },
      { status: 503 },
    );
  }

  let body: {
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
    requestType?: string;
    details?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const name = sanitizeText(body.name || "", 80);
  const email = sanitizeEmail(body.email || "");
  const phone = sanitizeText(body.phone || "", 20);
  const document = sanitizeText(body.document || "", 20);
  const requestType = sanitizeText(body.requestType || "", 20);
  const details = sanitizeText(body.details || "", 1000);

  if (name.length < 2) {
    return NextResponse.json(
      { error: "El nombre es obligatorio (mínimo 2 caracteres)." },
      { status: 400 },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 120) {
    return NextResponse.json(
      { error: "Ingresa un correo electrónico válido." },
      { status: 400 },
    );
  }

  if (document.length < 4) {
    return NextResponse.json(
      { error: "El número de documento es obligatorio." },
      { status: 400 },
    );
  }

  if (!ALLOWED_REQUEST_TYPES.has(requestType)) {
    return NextResponse.json(
      { error: "Selecciona el tipo de solicitud." },
      { status: 400 },
    );
  }

  try {
    await sendFeedbackToDiscord({
      type: "habeas_data",
      name,
      email,
      message: `Tipo: ${requestType}\nTeléfono: ${phone}\nDocumento: ${document}\nDetalles: ${details}`,
      orderId: null,
      page: null,
      clientIp,
      userAgent: request.headers.get("user-agent"),
    });
  } catch (error) {
    console.error("[HabeasData] Discord send error:", error);
    return NextResponse.json(
      { error: "No se pudo enviar la solicitud. Intenta nuevamente." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}