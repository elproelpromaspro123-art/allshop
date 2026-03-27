import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { isEmailConfigured, sendEmail } from "@/lib/notifications";
import { buildAbandonedCartEmail } from "@/lib/notifications/email-templates";
import { logger } from "@/lib/logger";
import type { OrderItem } from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * Finds pending orders older than the threshold and sends reminder emails.
 * Designed to be called by a cron job or Vercel cron.
 * 
 * GET /api/internal/abandoned-carts?hours=2
 * POST /api/internal/abandoned-carts { hours?: number, secret: string }
 */
export async function GET(request: NextRequest) {
  return handleAbandonedCarts(request);
}

export async function POST(request: NextRequest) {
  return handleAbandonedCarts(request);
}

async function handleAbandonedCarts(request: NextRequest) {
  if (!isSupabaseAdminConfigured) {
    return apiError("Supabase no configurado.", {
      status: 500,
      code: "SUPABASE_MISSING",
      headers: noStoreHeaders(),
    });
  }

  if (!isEmailConfigured()) {
    return apiError("SMTP no configurado.", {
      status: 500,
      code: "SMTP_MISSING",
      headers: noStoreHeaders(),
    });
  }

  // Simple auth: allow Vercel cron (x-vercel-cron header), or require secret
  const isVercelCron = !!request.headers.get("x-vercel-cron");
  const secret =
    request.headers.get("x-internal-secret") ||
    request.nextUrl.searchParams.get("secret") ||
    "";
  const expectedSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_BLOCK_SECRET || "";

  if (!isVercelCron && expectedSecret && secret !== expectedSecret) {
    return apiError("No autorizado.", {
      status: 401,
      code: "UNAUTHORIZED",
      headers: noStoreHeaders(),
    });
  }

  const hoursParam = request.nextUrl.searchParams.get("hours") || "2";
  const hoursThreshold = parseInt(hoursParam, 10) || 2;
  const cutoffTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString();

  // Find pending orders older than threshold
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id,customer_name,customer_email,total,items,created_at,notes")
    .eq("status", "pending")
    .lt("created_at", cutoffTime)
    .not("customer_email", "is", null)
    .limit(50);

  if (error) {
    logger.error("[AbandonedCarts] Query failed", { error: error.message });
    return apiError("Error consultando órdenes.", {
      status: 500,
      code: "QUERY_FAILED",
      headers: noStoreHeaders(),
    });
  }

  if (!orders || orders.length === 0) {
    return apiOkFields({
      message: "No hay carritos abandonados.",
      processed: 0,
      sent: 0,
    });
  }

  let emailsSent = 0;

  for (const order of orders) {
    try {
      // Check if we already sent an abandoned cart email for this order
      const notes = parseNotes(order.notes);
      if (notes.abandoned_cart_email_sent) continue;

      const items = Array.isArray(order.items) ? order.items as OrderItem[] : [];
      if (items.length === 0) continue;

      const emailItems = items.map((item) => ({
        name: item.product_name || "Producto",
        price: item.price || 0,
        quantity: item.quantity || 1,
        slug: item.product_id || "",
      }));

      const checkoutUrl = `https://vortixy.net/checkout`;

      const email = buildAbandonedCartEmail({
        customerName: order.customer_name || "cliente",
        customerEmail: order.customer_email!,
        items: emailItems,
        total: order.total,
        checkoutUrl,
      });

      await sendEmail(
        order.customer_email!,
        email.subject,
        email.html,
        email.text,
      );

      // Mark as sent in notes
      const updatedNotes = {
        ...notes,
        abandoned_cart_email_sent: true,
        abandoned_cart_email_sent_at: new Date().toISOString(),
      };

      await supabaseAdmin
        .from("orders")
        .update({ notes: JSON.stringify(updatedNotes) })
        .eq("id", order.id);

      emailsSent++;
      logger.info("[AbandonedCarts] Email sent", { orderId: order.id, email: order.customer_email });
    } catch (err) {
      logger.error("[AbandonedCarts] Failed to send email", {
        orderId: order.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return apiOkFields({
    message: `${emailsSent} emails enviados de ${orders.length} carritos abandonados.`,
    processed: orders.length,
    sent: emailsSent,
  });
}

function parseNotes(rawNotes: string | null): Record<string, unknown> {
  if (!rawNotes) return {};
  try {
    const parsed = JSON.parse(rawNotes);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
