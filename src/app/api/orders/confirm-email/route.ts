import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  extractEmailConfirmationSnapshot,
  isEmailConfirmationCodeMatch,
  isEmailConfirmationExpired,
  patchEmailConfirmationNotes,
} from "@/lib/email-confirmation";
import {
  isOrderLookupSecretConfigured,
  verifyOrderLookupToken,
} from "@/lib/order-token";
import { notifyOrderStatus } from "@/lib/notifications";
import type { OrderStatus } from "@/types/database";

interface ConfirmEmailBody {
  order_id?: string;
  order_token?: string;
  code?: string;
}

interface OrderRecord {
  id: string;
  status: OrderStatus;
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

async function findOrder(orderId: string): Promise<OrderRecord | null> {
  const { data } = await supabaseAdmin
    .from("orders")
    .select("id,status,notes")
    .eq("id", orderId)
    .maybeSingle();

  if (!data) return null;
  return data as OrderRecord;
}

async function updateOrder(input: {
  order: OrderRecord;
  status?: OrderStatus;
  notes: string;
}): Promise<OrderRecord | null> {
  let query = supabaseAdmin
    .from("orders")
    .update({
      notes: input.notes,
      ...(input.status ? { status: input.status } : {}),
    })
    .eq("id", input.order.id);

  if (input.order.notes === null) {
    query = query.is("notes", null);
  } else {
    query = query.eq("notes", input.order.notes);
  }

  const { data, error } = await query.select("id,status,notes").maybeSingle();
  if (error || !data) {
    if (error) {
      console.error("[ConfirmEmail] Error updating order:", error);
    }
    return null;
  }

  return data as OrderRecord;
}

async function advanceToManualProcessingAndNotify(orderId: string): Promise<OrderStatus> {
  try {
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: "processing" as OrderStatus })
      .eq("id", orderId)
      .eq("status", "pending");

    if (error) {
      console.error("[ConfirmEmail] Error moving order to processing:", error);
    }
  } catch (error) {
    console.error("[ConfirmEmail] Unexpected processing update error:", error);
  }

  const refreshed = await findOrder(orderId);
  const finalStatus = refreshed?.status || "pending";

  try {
    await notifyOrderStatus(orderId, finalStatus);
  } catch (error) {
    console.error("[ConfirmEmail] Notification error:", error);
  }

  return finalStatus;
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit({
    key: `confirm-email:${clientIp}`,
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." },
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

  let body: ConfirmEmailBody;
  try {
    body = (await request.json()) as ConfirmEmailBody;
  } catch {
    return NextResponse.json(
      { error: "Solicitud invalida para confirmar el pedido." },
      { status: 400 }
    );
  }

  const orderId = String(body.order_id || "").trim();
  const orderToken = String(body.order_token || "").trim();
  const code = String(body.code || "").trim();

  if (!isUuid(orderId) || !code) {
    return NextResponse.json(
      { error: "Datos incompletos para confirmar el pedido." },
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

  const snapshot = extractEmailConfirmationSnapshot(order.notes);
  if (!snapshot.required) {
    return NextResponse.json(
      { error: "Este pedido no requiere confirmacion adicional." },
      { status: 409 }
    );
  }

  if (snapshot.stage === "failed_to_send") {
    return NextResponse.json(
      { error: "No fue posible enviar el correo de confirmacion para este pedido." },
      { status: 409 }
    );
  }

  if (snapshot.stage === "blocked") {
    return NextResponse.json(
      { error: "Este pedido fue bloqueado por intentos fallidos." },
      { status: 423 }
    );
  }

  if (snapshot.stage === "confirmed" || order.status !== "pending") {
    const finalStatus =
      order.status === "pending"
        ? await advanceToManualProcessingAndNotify(order.id)
        : order.status;

    return NextResponse.json({
      ok: true,
      already_confirmed: true,
      status: finalStatus,
      fulfillment_triggered: false,
      manual_dispatch_required: true,
    });
  }

  if (isEmailConfirmationExpired(snapshot)) {
    return NextResponse.json(
      { error: "El codigo vencio. Solicita un nuevo codigo para continuar." },
      { status: 400 }
    );
  }

  if (!snapshot.codeHash) {
    return NextResponse.json(
      { error: "No hay un codigo activo para este pedido." },
      { status: 409 }
    );
  }

  const codeMatches = isEmailConfirmationCodeMatch({
    orderId: order.id,
    code,
    expectedHash: snapshot.codeHash,
  });
  const now = new Date().toISOString();

  if (!codeMatches) {
    const attempts = snapshot.confirmationAttempts + 1;
    const blocked = attempts >= snapshot.maxAttempts;
    const nextNotes = patchEmailConfirmationNotes(order.notes, {
      stage: blocked ? "blocked" : "pending",
      confirmation_attempts: attempts,
      last_attempt_at: now,
      ...(blocked ? { blocked_at: now } : {}),
    });

    const updatedOrder = await updateOrder({
      order,
      notes: nextNotes,
      ...(blocked ? { status: "cancelled" as OrderStatus } : {}),
    });

    if (blocked && updatedOrder) {
      try {
        await notifyOrderStatus(updatedOrder.id, "cancelled");
      } catch (error) {
        console.error("[ConfirmEmail] Notification error (blocked/cancelled):", error);
      }
    }

    const attemptsLeft = Math.max(0, snapshot.maxAttempts - attempts);
    const statusCode = blocked ? 423 : 400;
    const errorMessage = blocked
      ? "Se alcanzaron demasiados intentos fallidos. El pedido fue cancelado."
      : "Codigo incorrecto. Intenta nuevamente.";

    return NextResponse.json(
      {
        error: errorMessage,
        attempts_left: attemptsLeft,
      },
      { status: statusCode }
    );
  }

  const confirmedNotes = patchEmailConfirmationNotes(order.notes, {
    stage: "confirmed",
    confirmation_attempts: snapshot.confirmationAttempts + 1,
    confirmed_at: now,
    last_attempt_at: now,
  });

  const updated = await updateOrder({
    order,
    notes: confirmedNotes,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "No se pudo confirmar el pedido. Intenta nuevamente." },
      { status: 409 }
    );
  }

  const finalStatus = await advanceToManualProcessingAndNotify(updated.id);

  return NextResponse.json({
    ok: true,
    status: finalStatus,
    fulfillment_triggered: false,
    manual_dispatch_required: true,
  });
}
