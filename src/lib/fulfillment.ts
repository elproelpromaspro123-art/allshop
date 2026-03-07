import { supabaseAdmin, isSupabaseAdminConfigured } from "./supabase-admin";
import {
  buildDropiGroupKey,
  createDropiOrder,
  parseDropiProviderConfig,
  type DropiOrderGroupItem,
} from "./dropi";
import {
  buildDropiProviderUrlFromCatalog,
  resolveDropiVariationId,
  getDropiCatalogProductId
} from "./dropi-catalog";
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

function extractSelectedCarrierCode(rawNotes: string | null): string | null {
  if (!rawNotes) return null;

  try {
    const parsed = JSON.parse(rawNotes) as Record<string, unknown>;
    const logistics = parsed.logistics;
    if (!logistics || typeof logistics !== "object" || Array.isArray(logistics)) {
      return null;
    }

    const value = (logistics as Record<string, unknown>).selected_carrier_code;
    if (typeof value !== "string") return null;
    const normalized = value.trim().toLowerCase();
    return normalized || null;
  } catch {
    return null;
  }
}

function getEnvProviderOverrides(): Record<string, string> {
  const raw = process.env.DROPI_PROVIDER_MAP_OVERRIDES;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const entries = Object.entries(parsed).filter(
      ([, value]) => typeof value === "string" && value.trim().length > 0
    ) as [string, string][];

    return Object.fromEntries(
      entries.map(([key, value]) => [key.toLowerCase(), value.trim()])
    );
  } catch {
    return {};
  }
}

function resolveProviderUrlForProduct(
  slug: string,
  providerApiUrl: string | null | undefined,
  overrides: Record<string, string>
): string | null {
  const fromProduct = String(providerApiUrl || "").trim();
  if (fromProduct) return fromProduct;

  const fromEnv = overrides[slug.toLowerCase()] || null;
  if (fromEnv) return fromEnv;

  return buildDropiProviderUrlFromCatalog(slug);
}

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
  const selectedCarrierCode = extractSelectedCarrierCode(order.notes);
  const providerOverrides = getEnvProviderOverrides();

  const dropiGroups = new Map<string, DropiOrderGroupItem[]>();
  let successfulDispatches = 0;
  const dropiTrackingCandidates = new Set<string>();
  const dropiOrderReferences = new Set<string>();

  for (const item of items) {
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("provider_api_url,slug")
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

    const productSlug = String(product?.slug || "").trim().toLowerCase();
    const providerApiUrl = resolveProviderUrlForProduct(
      productSlug,
      product?.provider_api_url,
      providerOverrides
    );
    if (!providerApiUrl) {
      await logFulfillment(orderId, "provider_not_configured", "pending", {
        product_id: item.product_id,
        slug: productSlug || null,
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
      const variationId = resolveDropiVariationId(productSlug, item.variant);
      const dropiConfig =
        typeof variationId === "number"
          ? { ...dropiConfigResult.config, variationId }
          : dropiConfigResult.config;

      const groupKey = buildDropiGroupKey(dropiConfig);
      const existingGroup = dropiGroups.get(groupKey) || [];
      existingGroup.push({
        orderItem: item,
        config: dropiConfig,
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

  // --- [NUEVA LÓGICA DE TIENDANUBE EN REEMPLAZO DE DROPI] ---
  const { isTiendanubeConfigured, findTiendanubeProductBySku, createTiendanubeOrder } = require("./tiendanube");

  if (!isTiendanubeConfigured) {
    await logFulfillment(orderId, "tiendanube_not_configured", "error", { reason: "Faltan credenciales en .env.local" });
    return;
  }

  const tiendanubeItems = [];

  for (const item of items) {
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("slug")
      .eq("id", item.product_id)
      .maybeSingle();

    const slug = product?.slug || item.product_name; // Fallback al nombre

    // Buscar en Tiendanube usando el Slug (por si lo pusiste de SKU/Nombre) o el ID si está
    const dropiProductId = getDropiCatalogProductId(slug);
    const searchTerms = [
      dropiProductId ? String(dropiProductId) : null,
      slug
    ].filter(Boolean);

    let tiendanubeProduct = null;
    for (const term of searchTerms) {
      tiendanubeProduct = await findTiendanubeProductBySku(term);
      if (tiendanubeProduct) break;
    }

    if (!tiendanubeProduct) {
      await logFulfillment(orderId, "tiendanube_product_not_found", "error", {
        product_id: item.product_id,
        searched: searchTerms
      });
      continue; // Salta este producto si no está en la tienda
    }

    // Tomamos el primer variante (o ninguno si no aplica)
    const tVariant = Array.isArray(tiendanubeProduct.variants) && tiendanubeProduct.variants.length > 0
      ? tiendanubeProduct.variants[0]
      : null;

    tiendanubeItems.push({
      tiendanube_product_id: tiendanubeProduct.id,
      tiendanube_variant_id: tVariant ? tVariant.id : null,
      quantity: item.quantity,
      price: item.price
    });
  }

  if (tiendanubeItems.length === 0) {
    await logFulfillment(orderId, "order_status_update_skipped", "pending", {
      next_status: "processing",
      reason: "Ningún producto coincidió en Tiendanube",
      items_count: items.length,
    });
    return;
  }

  try {
    const tnResponse = await createTiendanubeOrder({
      order: order as any,
      mappedItems: tiendanubeItems
    });

    await logFulfillment(orderId, "tiendanube_order_created", "success", {
      tiendanube_response: tnResponse
    });

    successfulDispatches += 1;
    // Guardar el ID de orden que dio tiendanube
    if (tnResponse?.id) dropiOrderReferences.add(String(tnResponse.id));

  } catch (err: any) {
    await logFulfillment(orderId, "tiendanube_order_created", "error", {
      error: toErrorMessage(err),
    });
  }
  // --- [/FIN LÓGICA DE TIENDANUBE] ---

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
