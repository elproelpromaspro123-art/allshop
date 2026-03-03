import { NextRequest, NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { mercadoPagoClient } from "@/lib/mercadopago";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { processFulfillment } from "@/lib/fulfillment";
import { notifyOrderStatus } from "@/lib/notifications";
import type { OrderInsert, OrderItem, OrderStatus } from "@/types/database";

interface WebhookPayload {
  type?: string;
  data?: {
    id?: string | number;
  };
}

interface MercadoPagoPaymentItem {
  id: string;
  title: string;
  quantity: number | string;
  unit_price: number | string;
  picture_url?: string;
}

interface LegacyReference {
  payer?: {
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
  };
  shipping?: {
    address?: string;
    city?: string;
    department?: string;
    zip?: string;
    type?: "nacional" | "internacional";
    cost?: number;
  };
}

function mapMercadoPagoStatus(status?: string): OrderStatus {
  switch (status) {
    case "approved":
      return "paid";
    case "pending":
    case "in_process":
    case "authorized":
      return "pending";
    case "refunded":
    case "charged_back":
      return "refunded";
    case "rejected":
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

function parseLegacyReference(rawReference: string | null | undefined): LegacyReference {
  if (!rawReference || !rawReference.trim().startsWith("{")) {
    return {};
  }

  try {
    return JSON.parse(rawReference) as LegacyReference;
  } catch {
    return {};
  }
}

function buildOrderItems(items?: MercadoPagoPaymentItem[]): OrderItem[] {
  if (!items?.length) return [];

  return items.map((item) => ({
    product_id: item.id,
    product_name: item.title,
    variant: null,
    quantity: Math.max(1, Number(item.quantity) || 1),
    price: Math.max(0, Number(item.unit_price) || 0),
    image: item.picture_url || "",
  }));
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WebhookPayload;
    const paymentNotificationId = body?.data?.id;
    if (body.type !== "payment" || !paymentNotificationId) {
      return NextResponse.json({ received: true });
    }

    const paymentClient = new Payment(mercadoPagoClient);
    const payment = await paymentClient.get({ id: paymentNotificationId });
    const paymentId = String(payment.id);
    const mappedStatus = mapMercadoPagoStatus(payment.status);

    if (!isSupabaseAdminConfigured) {
      console.log("[Webhook MP] Supabase not configured. Payment:", {
        paymentId,
        status: payment.status,
      });
      return NextResponse.json({ received: true });
    }

    const rawExternalReference = payment.external_reference || null;
    const legacyReference = parseLegacyReference(rawExternalReference);
    let existingOrder: { id: string; status: OrderStatus } | null = null;

    if (rawExternalReference && !rawExternalReference.startsWith("{")) {
      const { data } = await supabaseAdmin
        .from("orders")
        .select("id,status")
        .eq("id", rawExternalReference)
        .maybeSingle();

      if (data) existingOrder = data;
    }

    if (!existingOrder) {
      const { data } = await supabaseAdmin
        .from("orders")
        .select("id,status")
        .eq("payment_id", paymentId)
        .maybeSingle();

      if (data) existingOrder = data;
    }

    let orderId: string;
    const previousStatus = existingOrder?.status;

    if (existingOrder) {
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          payment_id: paymentId,
          payment_method: payment.payment_method_id || "mercadopago",
          status: mappedStatus,
        })
        .eq("id", existingOrder.id);

      if (updateError) {
        console.error("[Webhook MP] Error updating order:", updateError);
        return NextResponse.json({ received: true });
      }

      orderId = existingOrder.id;
    } else {
      const fallbackName = [
        payment.payer?.first_name || "",
        payment.payer?.last_name || "",
      ]
        .join(" ")
        .trim();

      const shippingCost = Math.max(0, Number(legacyReference.shipping?.cost) || 0);
      const total = Math.max(0, Number(payment.transaction_amount) || 0);
      const subtotal = Math.max(0, total - shippingCost);
      const paymentItems = buildOrderItems(
        payment.additional_info?.items as MercadoPagoPaymentItem[] | undefined
      );

      const fallbackOrderPayload: OrderInsert = {
        customer_name:
          legacyReference.payer?.name || fallbackName || "Cliente AllShop",
        customer_email:
          legacyReference.payer?.email || payment.payer?.email || "",
        customer_phone:
          legacyReference.payer?.phone || payment.payer?.phone?.number || "",
        customer_document:
          legacyReference.payer?.document ||
          payment.payer?.identification?.number ||
          "",
        shipping_address: legacyReference.shipping?.address || "Sin direccion",
        shipping_city: legacyReference.shipping?.city || "Sin ciudad",
        shipping_department: legacyReference.shipping?.department || "Sin departamento",
        shipping_zip: legacyReference.shipping?.zip || null,
        status: mappedStatus,
        payment_id: paymentId,
        payment_method: payment.payment_method_id || "mercadopago",
        shipping_type: legacyReference.shipping?.type || "nacional",
        subtotal,
        shipping_cost: shippingCost,
        total,
        items: paymentItems,
        notes: "Orden creada por webhook (fallback)",
      };

      const { data: createdOrder, error: insertError } = await supabaseAdmin
        .from("orders")
        .insert(fallbackOrderPayload)
        .select("id")
        .single();

      if (insertError || !createdOrder) {
        console.error("[Webhook MP] Error creating fallback order:", insertError);
        return NextResponse.json({ received: true });
      }

      orderId = createdOrder.id;
    }

    const shouldTriggerFulfillment =
      mappedStatus === "paid" &&
      !["paid", "processing", "shipped", "delivered"].includes(previousStatus || "");

    if (shouldTriggerFulfillment) {
      try {
        await processFulfillment(orderId);
      } catch (fulfillmentError) {
        console.error("[Webhook MP] Fulfillment error:", fulfillmentError);
      }
    }

    try {
      await notifyOrderStatus(orderId, mappedStatus);
    } catch (notificationError) {
      console.error("[Webhook MP] Notification error:", notificationError);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook MP] Error:", error);
    return NextResponse.json({ received: true });
  }
}
