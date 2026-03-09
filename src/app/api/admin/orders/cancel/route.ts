import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { sendOrderCancellationResultToDiscord } from "@/lib/discord";
import {
  isAdminActionSecretConfigured,
  isAdminActionSecretValid,
  parseBearerToken,
} from "@/lib/catalog-admin-auth";
import type { OrderStatus } from "@/types/database";

interface OrderRow {
  id: string;
  status: OrderStatus;
  notes: string | null;
}

interface CancelBody {
  order_id?: string;
  reason?: string;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function mergeOrderNotes(previousNotes: string | null, patch: Record<string, unknown>): string {
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

function assertAdminAccess(request: NextRequest): NextResponse | null {
  if (!isAdminActionSecretConfigured()) {
    return NextResponse.json(
      {
        error:
          "Configura ADMIN_BLOCK_SECRET (o ORDER_LOOKUP_SECRET) para habilitar este endpoint.",
      },
      { status: 500 }
    );
  }

  const token = parseBearerToken(request.headers.get("authorization"));
  if (!isAdminActionSecretValid(token)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  return null;
}

export async function POST(request: NextRequest) {
  const authError = assertAdminAccess(request);
  if (authError) return authError;

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Supabase no está configurado en este entorno." },
      { status: 500 }
    );
  }

  let body: CancelBody;
  try {
    body = (await request.json()) as CancelBody;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const orderId = String(body.order_id || "").trim().toLowerCase();
  const cancelReason =
    String(body.reason || "").trim() ||
    "Cancelado manualmente por administrador (endpoint protegido).";

  if (!isUuid(orderId)) {
    return NextResponse.json(
      { error: "order_id inválido. Debe ser UUID." },
      { status: 400 }
    );
  }

  const { data, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id,status,notes")
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

    return NextResponse.json(
      { error: "Pedido no encontrado." },
      { status: 404 }
    );
  }

  if (order.status === "pending" || order.status === "paid" || order.status === "processing") {
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
      .update({
        status: "cancelled",
        notes,
      })
      .eq("id", order.id);

    if (updateError) {
      await sendOrderCancellationResultToDiscord({
        orderId: order.id,
        statusBefore: order.status,
        outcome: "error",
        detail: `Error cancelando pedido: ${updateError.message}`,
      });

      return NextResponse.json(
        { error: `No se pudo cancelar el pedido: ${updateError.message}` },
        { status: 500 }
      );
    }

    await sendOrderCancellationResultToDiscord({
      orderId: order.id,
      statusBefore: order.status,
      outcome: "cancelled",
      detail: "Pedido cancelado exitosamente en la app (operación manual).",
    });

    return NextResponse.json({
      ok: true,
      order_id: order.id,
      status_before: order.status,
      status_after: "cancelled",
      message: "Pedido cancelado correctamente.",
    });
  }

  await sendOrderCancellationResultToDiscord({
    orderId: order.id,
    statusBefore: order.status,
    outcome: "already_finalized",
    detail: `No se aplicaron cambios porque el estado actual es ${order.status}.`,
  });

  return NextResponse.json({
    ok: true,
    order_id: order.id,
    status_before: order.status,
    status_after: order.status,
    message: "Sin cambios: el pedido ya está finalizado o no admite cancelación.",
  });
}

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Método no permitido. Usa POST con Authorization: Bearer <ADMIN_BLOCK_SECRET> y body { order_id }.",
    },
    { status: 405 }
  );
}
