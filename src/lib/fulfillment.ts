import { supabaseAdmin, isSupabaseAdminConfigured } from "./supabase-admin";
import type { OrderItem, OrderStatus } from "@/types/database";

interface ProviderPayload {
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  shipping: {
    name: string;
    address: string;
    city: string;
    department: string;
    phone: string;
  };
}

const FINALIZED_STATUSES: OrderStatus[] = ["processing", "shipped", "delivered"];

export async function processFulfillment(orderId: string): Promise<void> {
  if (!isSupabaseAdminConfigured) {
    console.log("[Fulfillment] Supabase not configured. Skipping.");
    return;
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    console.error("[Fulfillment] Order not found:", orderError);
    return;
  }

  if (FINALIZED_STATUSES.includes(order.status)) {
    console.log("[Fulfillment] Order already processed:", orderId, order.status);
    return;
  }

  const items = (order.items || []) as OrderItem[];

  for (const item of items) {
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("provider_api_url")
      .eq("id", item.product_id)
      .maybeSingle();

    if (productError) {
      await logFulfillment(orderId, "provider_lookup", "error", {
        product_id: item.product_id,
      }, {
        error: productError.message,
      });
      continue;
    }

    if (!product?.provider_api_url) {
      await logFulfillment(orderId, "provider_not_configured", "pending", {
        product_id: item.product_id,
      });
      continue;
    }

    const payload: ProviderPayload = {
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      shipping: {
        name: order.customer_name,
        address: order.shipping_address,
        city: order.shipping_city,
        department: order.shipping_department,
        phone: order.customer_phone,
      },
    };

    try {
      const providerResponse = await sendToProvider(product.provider_api_url, payload);
      await logFulfillment(orderId, "provider_notified", "success", payload, providerResponse);
    } catch (providerError) {
      await logFulfillment(orderId, "provider_notified", "error", payload, {
        error: providerError instanceof Error ? providerError.message : String(providerError),
      });
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({ status: "processing" })
    .eq("id", orderId);

  if (updateError) {
    await logFulfillment(orderId, "order_status_update", "error", {
      next_status: "processing",
    }, {
      error: updateError.message,
    });
    throw updateError;
  }

  await logFulfillment(orderId, "order_status_update", "success", {
    next_status: "processing",
    items_count: items.length,
  });
}

async function logFulfillment(
  orderId: string,
  action: string,
  status: string,
  payload?: unknown,
  response?: unknown
): Promise<void> {
  await supabaseAdmin.from("fulfillment_logs").insert({
    order_id: orderId,
    action,
    status,
    payload: payload || null,
    response: response || null,
  });
}

async function sendToProvider(
  apiUrl: string,
  data: ProviderPayload
): Promise<Record<string, unknown>> {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Provider API error: ${response.status} ${response.statusText}`);
  }

  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return { ok: true };
  }
}
