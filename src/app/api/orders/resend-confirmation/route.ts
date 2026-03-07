import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  buildPendingEmailConfirmation,
  extractEmailConfirmationSnapshot,
  patchEmailConfirmationNotes,
} from "@/lib/email-confirmation";
import {
  createOrderLookupToken,
  isOrderLookupSecretConfigured,
  verifyOrderLookupToken,
} from "@/lib/order-token";
import { isEmailConfigured, sendOrderVerificationEmail } from "@/lib/notifications";
import type { OrderStatus } from "@/types/database";

interface ResendBody {
  order_id?: string;
  order_token?: string;
}

interface OrderRecord {
  id: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  total: number;
  notes: string | null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isOrderAccessAuthorized(orderId: string, orderToken: string): boolean {
  const hasLookupSecret = isOrderLookupSecretConfigured();
  if (hasLookupSecret) {
    return verifyOrderLookupToken(orderId, orderToken);
  }

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return true;
}

function buildOrderConfirmationPath(orderId: string, orderToken: string | null): string {
  const base = `/orden/confirmacion?order_id=${encodeURIComponent(orderId)}`;
  if (!orderToken) return base;
  return `${base}&order_token=${encodeURIComponent(orderToken)}`;
}

function getRequestBaseUrl(request: NextRequest): string {
  const explicit = String(process.env.NEXT_PUBLIC_APP_URL || "").trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const forwardedProto = String(request.headers.get("x-forwarded-proto") || "").trim();
  const forwardedHost = String(request.headers.get("x-forwarded-host") || "").trim();
  const host = forwardedHost || String(request.headers.get("host") || "").trim();
  const protocol = forwardedProto || "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

async function findOrder(orderId: string): Promise<OrderRecord | null> {
  const { data } = await supabaseAdmin
    .from("orders")
    .select("id,status,customer_name,customer_email,total,notes")
    .eq("id", orderId)
    .maybeSingle();

  if (!data) return null;
  return data as OrderRecord;
}

function extractEtaRange(rawNotes: string | null): string {
  if (!rawNotes) return "2 a 7 dias habiles";

  try {
    const parsed = JSON.parse(rawNotes) as Record<string, unknown>;
    const logistics = parsed.logistics;
    if (!logistics || typeof logistics !== "object" || Array.isArray(logistics)) {
      return "2 a 7 dias habiles";
    }

    const estimatedRange = (logistics as Record<string, unknown>).estimated_range;
    if (typeof estimatedRange !== "string") return "2 a 7 dias habiles";

    const normalized = estimatedRange.trim();
    return normalized || "2 a 7 dias habiles";
  } catch {
    return "2 a 7 dias habiles";
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit({
    key: `resend-confirm-email:${clientIp}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta mas tarde." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: "La tienda requiere base de datos activa para confirmar pedidos." },
      { status: 500 }
    );
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "El correo de confirmacion no esta configurado." },
      { status: 500 }
    );
  }

  let body: ResendBody;
  try {
    body = (await request.json()) as ResendBody;
  } catch {
    return NextResponse.json(
      { error: "Solicitud invalida para reenviar confirmacion." },
      { status: 400 }
    );
  }

  const orderId = String(body.order_id || "").trim();
  const orderToken = String(body.order_token || "").trim();
  if (!isUuid(orderId)) {
    return NextResponse.json(
      { error: "Referencia de pedido invalida." },
      { status: 400 }
    );
  }

  if (!isOrderAccessAuthorized(orderId, orderToken)) {
    return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  }

  const order = await findOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  if (order.status !== "pending") {
    return NextResponse.json(
      { error: "Este pedido ya no esta pendiente de confirmacion." },
      { status: 409 }
    );
  }

  const snapshot = extractEmailConfirmationSnapshot(order.notes);
  if (snapshot.stage === "confirmed") {
    return NextResponse.json(
      { error: "Este pedido ya fue confirmado." },
      { status: 409 }
    );
  }

  if (snapshot.stage === "blocked") {
    return NextResponse.json(
      { error: "Este pedido fue bloqueado por intentos fallidos." },
      { status: 423 }
    );
  }

  const pending = buildPendingEmailConfirmation({
    orderId: order.id,
    email: order.customer_email,
  });
  const updatedNotes = patchEmailConfirmationNotes(order.notes, {
    ...pending.state,
    resent_at: new Date().toISOString(),
  });

  let query = supabaseAdmin
    .from("orders")
    .update({ notes: updatedNotes })
    .eq("id", order.id);

  if (order.notes === null) {
    query = query.is("notes", null);
  } else {
    query = query.eq("notes", order.notes);
  }

  const { error: updateError } = await query;
  if (updateError) {
    console.error("[ResendConfirmEmail] Error updating order notes:", updateError);
    return NextResponse.json(
      { error: "No se pudo reenviar el codigo en este momento." },
      { status: 409 }
    );
  }

  const freshToken = createOrderLookupToken(order.id) || orderToken || "";
  const redirectPath = buildOrderConfirmationPath(order.id, freshToken || null);
  const verificationUrl = `${getRequestBaseUrl(request)}${redirectPath}`;

  try {
    await sendOrderVerificationEmail({
      orderId: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      total: order.total,
      verificationCode: pending.code,
      verificationUrl,
      etaRange: extractEtaRange(order.notes),
      codeExpiresAt: pending.state.code_expires_at,
    });
  } catch (error) {
    console.error("[ResendConfirmEmail] Email send error:", error);
    return NextResponse.json(
      { error: "No se pudo reenviar el correo en este momento." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    order_id: order.id,
    order_token: freshToken || null,
  });
}
