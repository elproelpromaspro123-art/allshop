import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { sendOrderCancellationResultToDiscord } from "@/lib/discord";
import type { OrderStatus } from "@/types/database";

interface OrderRow {
  id: string;
  status: OrderStatus;
  notes: string | null;
}

interface HtmlOptions {
  status: number;
  title: string;
  heading: string;
  message: string;
  tone: "ok" | "warn" | "error";
  detail?: string;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderHtmlPage(options: HtmlOptions): string {
  const toneColors: Record<HtmlOptions["tone"], { accent: string; bg: string }> = {
    ok: { accent: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    warn: { accent: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    error: { accent: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  };

  const palette = toneColors[options.tone];
  const safeTitle = escapeHtml(options.title);
  const safeHeading = escapeHtml(options.heading);
  const safeMessage = escapeHtml(options.message);
  const safeDetail = options.detail ? escapeHtml(options.detail) : null;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0b1020;
      color: #e5e7eb;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      padding: 20px;
    }
    .card {
      width: min(680px, 100%);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px;
      background: #11172a;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    }
    h1 {
      margin: 0 0 12px;
      font-size: 1.35rem;
      color: ${palette.accent};
    }
    p {
      margin: 0 0 10px;
      line-height: 1.5;
    }
    .detail {
      margin-top: 16px;
      border-radius: 10px;
      border: 1px solid ${palette.accent};
      background: ${palette.bg};
      padding: 12px;
      color: #f3f4f6;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .foot {
      margin-top: 18px;
      font-size: 0.86rem;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <article class="card">
    <h1>${safeHeading}</h1>
    <p>${safeMessage}</p>
    ${safeDetail ? `<pre class="detail">${safeDetail}</pre>` : ""}
    <p class="foot">Puedes cerrar esta pestana.</p>
  </article>
</body>
</html>`;
}

function htmlResponse(options: HtmlOptions): NextResponse {
  const html = renderHtmlPage(options);
  return new NextResponse(html, {
    status: options.status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function getAdminSecret(): string {
  return String(process.env.ADMIN_BLOCK_SECRET || process.env.ORDER_LOOKUP_SECRET || "").trim();
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

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const orderId = String(params.get("order_id") || "").trim();
  const secret = String(params.get("secret") || "").trim();

  const adminSecret = getAdminSecret();
  if (!adminSecret || secret !== adminSecret) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured) {
    return htmlResponse({
      status: 500,
      title: "Cancelacion de pedido",
      heading: "No se pudo procesar",
      message: "Supabase no esta configurado en este entorno.",
      tone: "error",
    });
  }

  if (!isUuid(orderId)) {
    return htmlResponse({
      status: 400,
      title: "Cancelacion de pedido",
      heading: "Pedido invalido",
      message: "El parametro order_id no tiene un formato UUID valido.",
      tone: "error",
    });
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
      detail: `No se encontro el pedido o hubo un error: ${orderError?.message || "not_found"}`,
    });

    return htmlResponse({
      status: 404,
      title: "Cancelacion de pedido",
      heading: "Pedido no encontrado",
      message: "No se encontro el pedido solicitado.",
      tone: "error",
      detail: `order_id: ${orderId}`,
    });
  }

  if (order.status === "pending" || order.status === "paid" || order.status === "processing") {
    const cancelledAt = new Date().toISOString();
    const notes = mergeOrderNotes(order.notes, {
      cancellation: {
        source: "discord_admin_link",
        cancelled_at: cancelledAt,
        reason: "Cancelado manualmente desde Discord (admin action link).",
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

      return htmlResponse({
        status: 500,
        title: "Cancelacion de pedido",
        heading: "No se pudo cancelar",
        message: "Ocurrio un error al intentar cancelar el pedido en la app.",
        tone: "error",
        detail: updateError.message,
      });
    }

    await sendOrderCancellationResultToDiscord({
      orderId: order.id,
      statusBefore: order.status,
      outcome: "cancelled",
      detail: "Pedido cancelado exitosamente en la app (operacion manual).",
    });

    return htmlResponse({
      status: 200,
      title: "Cancelacion de pedido",
      heading: "Pedido cancelado",
      message: "El pedido se cancelo en la app y no continuara al despacho manual.",
      tone: "ok",
      detail: `order_id: ${order.id}\nstatus: cancelled`,
    });
  }

  await sendOrderCancellationResultToDiscord({
    orderId: order.id,
    statusBefore: order.status,
    outcome: "already_finalized",
    detail: `No se aplicaron cambios porque el estado actual es ${order.status}.`,
  });

  return htmlResponse({
    status: 200,
    title: "Cancelacion de pedido",
    heading: "Sin cambios",
    message:
      "Este pedido ya esta finalizado o no admite cancelacion desde este endpoint.",
    tone: "warn",
    detail: `Estado actual: ${order.status}`,
  });
}
