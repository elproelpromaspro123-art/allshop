import { supabaseAdmin, isSupabaseAdminConfigured } from "./supabase-admin";
import {
  buildDropiGroupKey,
  createDropiOrder,
  parseDropiProviderConfig,
  type DropiOrderGroupItem,
} from "./dropi";
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
const TRACKING_KEY_PATTERN = /(tracking|guia|guide|waybill|awb)/i;
const ORDER_REFERENCE_KEY_PATTERN = /(order|pedido|reference|numero|number|id)/i;

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
  if (!items.length) {
    await logFulfillment(orderId, "no_items_to_fulfill", "pending", {
      order_id: orderId,
    });
    return;
  }

  const dropiGroups = new Map<string, DropiOrderGroupItem[]>();
  let successfulDispatches = 0;
  const dropiTrackingCandidates = new Set<string>();
  const dropiOrderReferences = new Set<string>();

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

    const providerApiUrl = String(product?.provider_api_url || "").trim();
    if (!providerApiUrl) {
      await logFulfillment(orderId, "provider_not_configured", "pending", {
        product_id: item.product_id,
      });
      continue;
    }

    const dropiConfigResult = parseDropiProviderConfig(providerApiUrl);
    if (dropiConfigResult.kind === "invalid") {
      await logFulfillment(orderId, "dropi_config_invalid", "error", {
        product_id: item.product_id,
        provider_api_url: providerApiUrl,
      }, {
        error: dropiConfigResult.reason,
      });
      continue;
    }

    if (dropiConfigResult.kind === "ok") {
      const groupKey = buildDropiGroupKey(dropiConfigResult.config);
      const existingGroup = dropiGroups.get(groupKey) || [];
      existingGroup.push({
        orderItem: item,
        config: dropiConfigResult.config,
      });
      dropiGroups.set(groupKey, existingGroup);
      continue;
    }

    if (!isHttpUrl(providerApiUrl)) {
      await logFulfillment(orderId, "provider_config_invalid", "error", {
        product_id: item.product_id,
        provider_api_url: providerApiUrl,
      }, {
        error: "Provider must be a valid http(s) URL or dropi:// mapping",
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
      const providerResponse = await sendToProvider(providerApiUrl, payload);
      await logFulfillment(orderId, "provider_notified", "success", payload, providerResponse);
      successfulDispatches += 1;
    } catch (providerError) {
      await logFulfillment(orderId, "provider_notified", "error", payload, {
        error: toErrorMessage(providerError),
      });
    }
  }

  for (const groupedItems of dropiGroups.values()) {
    const dropiLogPayload = groupedItems.map(({ orderItem, config }) => ({
      local_product_id: orderItem.product_id,
      local_product_name: orderItem.product_name,
      local_variant: orderItem.variant,
      quantity: orderItem.quantity,
      dropi_product_id: config.productId,
      dropi_variation_id: config.variationId ?? null,
      supplier_id: config.supplierId,
      warehouse_id: config.warehouseId,
      distribution_company: config.distributionCompany ?? null,
      type_service: config.typeService ?? null,
      rate_type: config.rateType ?? null,
    }));

    try {
      const dropiResponse = await createDropiOrder({
        order: {
          id: order.id,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          customer_document: order.customer_document,
          shipping_address: order.shipping_address,
          shipping_city: order.shipping_city,
          shipping_department: order.shipping_department,
          shipping_zip: order.shipping_zip,
          shipping_cost: order.shipping_cost,
          total: order.total,
        },
        items: groupedItems,
      });

      await logFulfillment(orderId, "dropi_order_created", "success", dropiResponse.payload, {
        dropi_response: dropiResponse.response,
        mapped_items: dropiLogPayload,
      });

      extractTrackingCandidates(dropiResponse.response).forEach((value) =>
        dropiTrackingCandidates.add(value)
      );
      const dropiOrderReference = extractDropiOrderReference(dropiResponse.response);
      if (dropiOrderReference) {
        dropiOrderReferences.add(dropiOrderReference);
      }

      successfulDispatches += 1;
    } catch (dropiError) {
      await logFulfillment(orderId, "dropi_order_created", "error", {
        mapped_items: dropiLogPayload,
      }, {
        error: toErrorMessage(dropiError),
      });
    }
  }

  if (successfulDispatches === 0) {
    await logFulfillment(orderId, "order_status_update_skipped", "pending", {
      next_status: "processing",
      reason: "No successful provider dispatches",
      items_count: items.length,
    });
    return;
  }

  const updatedNotes = mergeOrderNotes(order.notes, {
    fulfillment: {
      dispatched_at: new Date().toISOString(),
      successful_dispatches: successfulDispatches,
      dropi_order_references: Array.from(dropiOrderReferences),
      tracking_candidates: Array.from(dropiTrackingCandidates),
    },
  });

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({ status: "processing", notes: updatedNotes })
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;

  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const bodyPreview = await response.text();
    throw new Error(
      `Provider API error: ${response.status} ${response.statusText}${bodyPreview ? ` - ${bodyPreview.slice(0, 400)}` : ""}`
    );
  }

  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return { ok: true };
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function walkJson(
  value: unknown,
  visitor: (entry: { key: string; value: unknown }) => void
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      walkJson(item, visitor);
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  for (const [key, child] of Object.entries(record)) {
    visitor({ key, value: child });
    walkJson(child, visitor);
  }
}

function sanitizeCandidate(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized) return null;
  if (normalized.length < 4) return null;
  return normalized.slice(0, 120);
}

function extractTrackingCandidates(payload: unknown): string[] {
  const found = new Set<string>();

  walkJson(payload, ({ key, value }) => {
    if (!TRACKING_KEY_PATTERN.test(key)) return;
    const candidate = sanitizeCandidate(value);
    if (candidate) {
      found.add(candidate);
    }
  });

  return Array.from(found);
}

function extractDropiOrderReference(payload: unknown): string | null {
  let bestMatch: string | null = null;

  walkJson(payload, ({ key, value }) => {
    if (bestMatch) return;
    if (!ORDER_REFERENCE_KEY_PATTERN.test(key)) return;
    if (TRACKING_KEY_PATTERN.test(key)) return;

    const candidate = sanitizeCandidate(value);
    if (candidate) {
      bestMatch = candidate;
    }
  });

  return bestMatch;
}

function mergeOrderNotes(
  previousNotes: string | null,
  patch: Record<string, unknown>
): string {
  const base: Record<string, unknown> = {};

  if (previousNotes) {
    try {
      const parsed = JSON.parse(previousNotes);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        Object.assign(base, parsed);
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
