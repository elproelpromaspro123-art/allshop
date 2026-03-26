import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { sendOrderCancellationResultToDiscord } from "@/lib/discord";
import { isEmailConfigured, sendEmail } from "@/lib/notifications";
import { buildRefundConfirmedEmail } from "@/lib/notifications/email-templates";
import {
  isAdminActionSecretConfigured,
  isAdminActionSecretValid,
  parseBearerToken,
} from "@/lib/catalog-admin-auth";
import {
  restoreCatalogStock,
  type CatalogStockReservation,
} from "@/lib/catalog-runtime";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { isUuid, getClientIp } from "@/lib/utils";
import type { OrderStatus, OrderItem } from "@/types/database";

interface OrderRow {
  id: string;
  status: OrderStatus;
  notes: string | null;
  items: OrderItem[];
  customer_name: string;
  customer_email: string | null;
  total: number;
}

interface CancelBody {
  order_id?: string;
  reason?: string;
}

function mergeOrderNotes(
  previousNotes: string | null,
  patch: Record<string, unknown>,
): string {
  const base: Record<string, unknown> = {};

  if (previousNotes) {
    try {
      const parsed = JSON.parse(previousNotes);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        Object.assign(base, parsed as Record<string, unknown>);
      } else {
        base.previous_notes = previousNotes;
      }
    } catch {
      base.previous_notes = previousNotes;
    }
  }

  Object.assign(base, patch);
  return JSON.stringify(base);
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitDb({
    key: `admin-cancel:${clientIp}`,
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return apiError("Demasiadas solicitudes. Intenta más tarde.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      headers: noStoreHeaders({
        "Retry-After": String(rateLimit.retryAfterSeconds),
      }),
    });
  }

  if (!isAdminActionSecretConfigured()) {
    return apiError(
      "Configura ADMIN_BLOCK_SECRET (o ORDER_LOOKUP_SECRET) para habilitar este endpoint.",
      { status: 500, code: "CONFIG_MISSING", headers: noStoreHeaders() },
    );
  }

  const token = parseBearerToken(request.headers.get("authorization"));
  if (!isAdminActionSecretValid(token)) {
    return apiError("No autorizado.", {
      status: 401,
      code: "UNAUTHORIZED",
      headers: noStoreHeaders(),
    });
  }

  if (!isSupabaseAdminConfigured) {
    return apiError(
      "Supabase no está configurado en este entorno.",
      { status: 500, code: "SUPABASE_MISSING", headers: noStoreHeaders() },
    );
  }

  let body: CancelBody;
  try {
    body = (await request.json()) as CancelBody;
  } catch {
    return apiError("Solicitud inválida.", {
      status: 400,
      code: "INVALID_JSON",
      headers: noStoreHeaders(),
    });
  }

  const orderId = String(body.order_id || "")
    .trim()
    .toLowerCase();
  const cancelReason =
    String(body.reason || "").trim() ||
    "Cancelado manualmente por administrador (endpoint protegido).";

  if (!isUuid(orderId)) {
    return apiError("order_id inválido. Debe ser UUID.", {
      status: 400,
      code: "INVALID_ORDER_ID",
      headers: noStoreHeaders(),
    });
  }

  const { data, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id,status,notes,items,customer_name,customer_email,total")
    .eq("id", orderId)
    .maybeSingle();
  const order = (data as OrderRow | null) || null;

  if (orderError || !order) {
    await sendOrderCancellationResultToDiscord({
      orderId,
      statusBefore: "unknown",
      outcome: "error",
      detail: `No se encontró el pedido o hubo un error: ${orderError?.message || "not_found"}`,
    });

    return apiError("Pedido no encontrado.", {
      status: 404,
      code: "ORDER_NOT_FOUND",
      headers: noStoreHeaders(),
    });
  }

  if (
    order.status === "pending" ||
    order.status === "paid" ||
    order.status === "processing"
  ) {
    const cancelledAt = new Date().toISOString();
    const notes = mergeOrderNotes(order.notes, {
      cancellation: {
        source: "admin_api",
        cancelled_at: cancelledAt,
        reason: cancelReason,
      },
    });

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled", notes } as never)
      .eq("id", order.id);

    if (updateError) {
      await sendOrderCancellationResultToDiscord({
        orderId: order.id,
        statusBefore: order.status,
        outcome: "error",
        detail: `Error cancelando pedido: ${updateError.message}`,
      });

      return apiError(
        `No se pudo cancelar el pedido: ${updateError.message}`,
        { status: 500, code: "CANCEL_FAILED", headers: noStoreHeaders() },
      );
    }

    try {
      const orderItems = Array.isArray(order.items) ? order.items : [];
      if (orderItems.length > 0) {
        const productIds = [
          ...new Set(orderItems.map((item) => item.product_id)),
        ];
        const { data: products } = await supabaseAdmin
          .from("products")
          .select("id,slug")
          .in("id", productIds);

        const slugById = new Map<string, string>();
        if (products) {
          for (const p of products as { id: string; slug: string }[]) {
            slugById.set(p.id, p.slug);
          }
        }

        const reservations: CatalogStockReservation[] = orderItems
          .filter((item) => slugById.has(item.product_id))
          .map((item) => ({
            slug: slugById.get(item.product_id)!,
            variant: item.variant,
            quantity: item.quantity,
          }));

        if (reservations.length > 0) {
          await restoreCatalogStock(reservations);
        }
      }
    } catch (stockError) {
      console.error("[Cancel] Failed to restore stock:", stockError);
    }

    await sendOrderCancellationResultToDiscord({
      orderId: order.id,
      statusBefore: order.status,
      outcome: "cancelled",
      detail:
        "Pedido cancelado exitosamente en la app (operación manual). Stock restaurado.",
    });

    // Send refund email to customer
    if (order.customer_email && isEmailConfigured()) {
      const refundEmail = buildRefundConfirmedEmail({
        customerName: order.customer_name || "cliente",
        orderId: order.id,
        refundAmount: order.total,
        refundReason: cancelReason,
      });
      sendEmail(order.customer_email, refundEmail.subject, refundEmail.html, refundEmail.text).catch(
        (err) => console.error("[Cancel] Refund email failed:", err),
      );
    }

    return apiOkFields(
      {
        order_id: order.id,
        status_before: order.status,
        status_after: "cancelled",
        message: "Pedido cancelado correctamente. Stock restaurado.",
      },
      { headers: noStoreHeaders() },
    );
  }

  await sendOrderCancellationResultToDiscord({
    orderId: order.id,
    statusBefore: order.status,
    outcome: "already_finalized",
    detail: `No se aplicaron cambios porque el estado actual es ${order.status}.`,
  });

  return apiOkFields(
    {
      order_id: order.id,
      status_before: order.status,
      status_after: order.status,
      message:
        "Sin cambios: el pedido ya está finalizado o no admite cancelación.",
    },
    { headers: noStoreHeaders() },
  );
}

export async function GET() {
  return apiError(
    "Método no permitido. Usa POST con Authorization: Bearer <ADMIN_BLOCK_SECRET> y body { order_id }.",
    { status: 405, code: "METHOD_NOT_ALLOWED", headers: noStoreHeaders() },
  );
}
