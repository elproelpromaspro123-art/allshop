import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { logger } from "@/lib/logger";
import {
  calculateNationalShippingCost,
  hasOnlyFreeShippingProducts,
  isProductShippingFree,
} from "@/lib/shipping";
import {
  estimateColombiaDelivery,
} from "@/lib/delivery";
import {
  createOrderLookupToken,
  isOrderLookupSecretConfigured,
} from "@/lib/order-token";
import { isEmailConfigured, notifyOrderStatus } from "@/lib/notifications";
import { getPhoneLookupCandidates, normalizePhone } from "@/lib/phone";
import { sendOrderToDiscord } from "@/lib/discord";
import { isVpnOrProxy } from "@/lib/vpn-detect";
import { isIpBlockedAsync } from "@/lib/ip-block";
import { normalizeLegacyImagePaths } from "@/lib/image-paths";
import { sanitizeText, sanitizeEmail } from "@/lib/sanitize";
import {
  isDuplicateOrderPaymentIdError,
  hashCheckoutPayload,
  normalizeCheckoutIdempotencyKey,
  toCheckoutPaymentId,
} from "@/lib/checkout-idempotency";
import {
  reserveCatalogStock,
  restoreCatalogStock,
  type CatalogStockReservation,
} from "@/lib/catalog-runtime";
import {
  getProductSlugLookupCandidates,
  normalizeProductSlug,
} from "@/lib/legacy-product-slugs";
import type { OrderInsert, OrderItem } from "@/types/database";
import {
  isCsrfSecretConfigured,
  validateCsrfToken,
  validateSameOrigin,
} from "@/lib/csrf";
import { isUuid } from "@/lib/utils";
import {
  type CheckoutBody,
  type CheckoutItemInput,
  validateCheckoutBody,
} from "@/lib/checkout-contract";
import { evaluateCoupon } from "@/lib/coupons";

export const maxBodySize = 50 * 1024;

interface ProductSnapshot {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: string[];
  free_shipping?: boolean | null;
  shipping_cost?: number | null;
}

interface NormalizedCheckoutItem {
  id: string;
  slug: string | null;
  lookupSlugs: string[];
  quantity: number;
  variant: string | null;
}

interface PricedCheckoutItem extends NormalizedCheckoutItem {
  title: string;
  unit_price: number;
  picture_url: string;
  free_shipping: boolean;
  shipping_cost: number | null;
}

function sanitizeQuantity(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.floor(parsed);
  if (rounded <= 0) return null;
  return Math.min(10, rounded);
}

// isUuid is now imported from @/lib/utils (fix 8.1)

function normalizeDigits(value: string): string {
  return String(value || "").replace(/\D+/g, "");
}

function toOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

function toProductSnapshot(product: Record<string, unknown>): ProductSnapshot {
  return {
    id: String(product.id),
    slug: String(product.slug),
    name: String(product.name),
    price: Math.max(0, Number(product.price) || 0),
    images: normalizeLegacyImagePaths(
      Array.isArray(product.images)
        ? product.images.map((image) => String(image))
        : [],
    ),
    free_shipping: toOptionalBoolean(product.free_shipping),
    shipping_cost:
      typeof product.shipping_cost === "number" ? product.shipping_cost : null,
  };
}


function normalizeCheckoutItems(
  items: CheckoutItemInput[],
): NormalizedCheckoutItem[] | null {
  const merged = new Map<string, NormalizedCheckoutItem>();

  for (const item of items) {
    const id = String(item.id || "").trim();
    const slugFromPayload = String(item.slug || "")
      .trim()
      .toLowerCase();
    const slugCandidates = getProductSlugLookupCandidates(slugFromPayload);
    const slug = slugCandidates[0] || null;
    const quantity = sanitizeQuantity(item.quantity);
    const variant = item.variant ? String(item.variant).trim() : null;
    if (!id || quantity === null) return null;

    const mergeKey = `${id}::${slug ?? ""}::${variant ?? ""}`;
    const existing = merged.get(mergeKey);
    if (existing) {
      existing.quantity = Math.min(10, existing.quantity + quantity);
      existing.lookupSlugs = Array.from(
        new Set([...existing.lookupSlugs, ...slugCandidates]),
      );
      merged.set(mergeKey, existing);
      continue;
    }

    merged.set(mergeKey, {
      id,
      slug,
      lookupSlugs: slugCandidates,
      quantity,
      variant,
    });
  }

  return Array.from(merged.values());
}

function registerSnapshotKeys(
  snapshotMap: Map<string, ProductSnapshot>,
  snapshot: ProductSnapshot,
  extraKeys: string[] = [],
): void {
  const normalizedSlug = normalizeProductSlug(snapshot.slug) || snapshot.slug;
  const aliases = getProductSlugLookupCandidates(normalizedSlug);
  const keys = new Set(
    [snapshot.id, normalizedSlug, ...aliases, ...extraKeys]
      .map((key) =>
        String(key || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean),
  );

  snapshot.slug = normalizedSlug;

  for (const key of keys) {
    snapshotMap.set(key, snapshot);
  }
}

async function loadProductSnapshots(
  items: NormalizedCheckoutItem[],
): Promise<Map<string, ProductSnapshot>> {
  if (!items.length) return new Map();

  const snapshotMap = new Map<string, ProductSnapshot>();
  const requestedIds = Array.from(
    new Set(items.map((item) => String(item.id || "").trim()).filter(Boolean)),
  );
  const requestedSlugs = Array.from(
    new Set(
      items
        .flatMap((item) => item.lookupSlugs)
        .map((slug) =>
          String(slug || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
  );

  if (isSupabaseAdminConfigured) {
    const baseSelect = "id,slug,name,price,images,is_active";
    const withFreeShippingSelect = `${baseSelect},free_shipping,shipping_cost`;

    const queryProducts = async (
      field: "id" | "slug",
      values: string[],
    ): Promise<Record<string, unknown>[]> => {
      if (!values.length) return [];

      const withFreeShipping = await supabaseAdmin
        .from("products")
        .select(withFreeShippingSelect)
        .in(field, values)
        .eq("is_active", true);

      if (withFreeShipping.error) {
        if (!/free_shipping/i.test(withFreeShipping.error.message)) {
          throw new Error(withFreeShipping.error.message);
        }

        const fallback = await supabaseAdmin
          .from("products")
          .select(baseSelect)
          .in(field, values)
          .eq("is_active", true);

        if (fallback.error) {
          throw new Error(fallback.error.message);
        }

        return (fallback.data || []) as Record<string, unknown>[];
      }

      return (withFreeShipping.data || []) as Record<string, unknown>[];
    };

    let rows: Record<string, unknown>[] = [];
    try {
      const uuidIds = requestedIds.filter((id) => isUuid(id));
      const [byIdRows, bySlugRows] = await Promise.all([
        queryProducts("id", uuidIds),
        queryProducts("slug", requestedSlugs),
      ]);
      rows = [...byIdRows, ...bySlugRows];
    } catch (error) {
      throw new Error(
        `Error fetching products from Supabase: ${String(error)}`,
      );
    }

    const rowsById = new Map<string, Record<string, unknown>>();
    const rowsBySlug = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      const rowId = String(row.id || "")
        .trim()
        .toLowerCase();
      const rowSlug = String(row.slug || "")
        .trim()
        .toLowerCase();
      if (rowId) rowsById.set(rowId, row);
      if (rowSlug) rowsBySlug.set(rowSlug, row);
    }

    for (const item of items) {
      const itemId = String(item.id || "")
        .trim()
        .toLowerCase();
      const rowBySlug = item.lookupSlugs.find((lookupSlug) =>
        rowsBySlug.has(lookupSlug.toLowerCase()),
      );
      const row =
        rowsById.get(itemId) ||
        (rowBySlug ? rowsBySlug.get(rowBySlug.toLowerCase()) : undefined);
      if (!row) continue;

      const snapshot = toProductSnapshot(row);
      registerSnapshotKeys(snapshotMap, snapshot, [item.id]);
    }

    return snapshotMap;
  }

  // No database configured — cannot resolve products
  return snapshotMap;
}

function buildPricedItems(
  normalizedItems: NormalizedCheckoutItem[],
  productSnapshots: Map<string, ProductSnapshot>,
): PricedCheckoutItem[] | null {
  const pricedItems: PricedCheckoutItem[] = [];

  for (const item of normalizedItems) {
    const product =
      productSnapshots.get(
        String(item.id || "")
          .trim()
          .toLowerCase(),
      ) ||
      item.lookupSlugs
        .map((slug) => productSnapshots.get(slug.toLowerCase()))
        .find((entry): entry is ProductSnapshot => Boolean(entry));

    if (!product) return null;

    pricedItems.push({
      id: product.id,
      slug: product.slug,
      lookupSlugs: item.lookupSlugs,
      quantity: item.quantity,
      variant: item.variant,
      title: product.name,
      unit_price: Math.max(0, Number(product.price) || 0),
      picture_url: product.images[0] || "",
      free_shipping: isProductShippingFree({
        id: product.id,
        slug: product.slug,
        free_shipping: product.free_shipping ?? null,
      }),
      shipping_cost: product.shipping_cost ?? null,
    });
  }

  return pricedItems;
}

function calculateSubtotal(items: PricedCheckoutItem[]): number {
  return items.reduce(
    (sum, item) =>
      sum +
      Math.max(0, Number(item.unit_price)) * Math.max(1, Number(item.quantity)),
    0,
  );
}

function buildOrderItems(items: PricedCheckoutItem[]): OrderItem[] {
  return items.map((item) => ({
    product_id: item.id,
    product_name: item.title,
    variant: item.variant ?? null,
    quantity: Number(item.quantity),
    price: Number(item.unit_price),
    image: item.picture_url || "",
  }));
}

function buildOrderNotes(input: {
  pricing: CheckoutBody["pricing"] | undefined;
  logistics: {
    department: string;
    selectedCarrierCode: string;
    selectedCarrierName: string;
    selectedCarrierInsured: boolean;
    hasOnlyFreeShippingProducts: boolean;
    estimatedMinDays: number;
    estimatedMaxDays: number;
    estimatedRange: string;
  };
  checkoutPayloadHash: string;
  verification: CheckoutBody["verification"];
  shippingReference?: string;
  promotion?: {
    code: string;
    label: string;
    type: string;
    subtotalDiscount: number;
    shippingDiscount: number;
    totalDiscount: number;
    discountedTotal: number;
  } | null;
  email: {
    stage: "confirmed";
    initiatedAt: string;
    sentTo: string;
  };
}): string {
  return JSON.stringify({
    checkout_model: "manual_cod_v1",
    fulfillment_mode: "manual_dispatch",
    pricing: input.pricing,
    logistics: {
      department: input.logistics.department,
      selected_carrier_code: input.logistics.selectedCarrierCode,
      selected_carrier_name: input.logistics.selectedCarrierName,
      selected_carrier_insured: input.logistics.selectedCarrierInsured,
      has_only_free_shipping_products:
        input.logistics.hasOnlyFreeShippingProducts,
      estimated_min_days: input.logistics.estimatedMinDays,
      estimated_max_days: input.logistics.estimatedMaxDays,
      estimated_range: input.logistics.estimatedRange,
    },
    verification: input.verification,
    promotion: input.promotion
      ? {
          code: input.promotion.code,
          label: input.promotion.label,
          type: input.promotion.type,
          subtotal_discount: input.promotion.subtotalDiscount,
          shipping_discount: input.promotion.shippingDiscount,
          total_discount: input.promotion.totalDiscount,
          discounted_total: input.promotion.discountedTotal,
        }
      : null,
    checkout_payload_hash: input.checkoutPayloadHash,
    checkout_payload_hash_version: 1,
    shipping_reference: input.shippingReference || null,
    email_confirmation: {
      required: false,
      stage: input.email.stage,
      initiated_at: input.email.initiatedAt,
      sent_to: input.email.sentTo,
    },
  });
}

async function hasRecentDuplicateOrder(input: {
  phone: string;
  address: string;
}): Promise<boolean> {
  const phoneCandidates = getPhoneLookupCandidates(input.phone);
  const normalizedAddress = input.address.trim().toLowerCase();
  if (!phoneCandidates.length) return false;

  let query = supabaseAdmin
    .from("orders")
    .select("id")
    .in("status", ["pending", "processing"])
    .eq("address", normalizedAddress);

  query =
    phoneCandidates.length === 1
      ? query.eq("customer_phone", phoneCandidates[0])
      : query.in("customer_phone", phoneCandidates);

  const { data } = await query;

  return (data?.length || 0) >= 5;
}

async function hasUsedCoupon(input: {
  phone: string;
  email: string;
  couponCode: string;
}): Promise<boolean> {
  const phoneCandidates = getPhoneLookupCandidates(input.phone);
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!phoneCandidates.length && !normalizedEmail) return false;

  const conditions: string[] = [];
  if (normalizedEmail) {
    conditions.push(`customer_email.eq.${normalizedEmail}`);
  }
  if (phoneCandidates.length === 1) {
    conditions.push(`customer_phone.eq.${phoneCandidates[0]}`);
  } else if (phoneCandidates.length > 1) {
    conditions.push(`customer_phone.in.(${phoneCandidates.join(",")})`);
  }

  if (conditions.length === 0) return false;

  const { data } = await supabaseAdmin
    .from("orders")
    .select("notes, status")
    .neq("status", "cancelled")
    .or(conditions.join(","));

  if (!data?.length) return false;

  for (const order of data) {
    if (!order.notes) continue;
    try {
      let parsedNotes;
      if (typeof order.notes === "string") {
        parsedNotes = JSON.parse(order.notes);
      } else {
        parsedNotes = order.notes;
      }
      if (
        parsedNotes &&
        typeof parsedNotes === "object" &&
        !Array.isArray(parsedNotes)
      ) {
        const promotion = (parsedNotes as Record<string, unknown>).promotion;
        if (
          promotion &&
          typeof promotion === "object" &&
          (promotion as Record<string, unknown>).code === input.couponCode
        ) {
          return true;
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  return false;
}

interface ExistingOrderByPaymentId {
  id: string;
  status: string | null;
  notes: string | null;
}

async function findExistingOrderByPaymentId(
  paymentId: string,
): Promise<ExistingOrderByPaymentId | null> {
  if (!paymentId) return null;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id,status,notes")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ExistingOrderByPaymentId;
}

function checkoutError(
  error: string,
  options: {
    status: number;
    code: string;
    retryAfterSeconds?: number | null;
    fields?: Record<string, unknown>;
    headers?: HeadersInit;
  },
) {
  return apiError(error, {
    status: options.status,
    code: options.code,
    retryAfterSeconds: options.retryAfterSeconds,
    fields: options.fields,
    headers: noStoreHeaders(options.headers),
  });
}

function checkoutSuccess(fields: Record<string, unknown>, headers?: HeadersInit) {
  return apiOkFields(fields, {
    headers: noStoreHeaders(headers),
  });
}

function buildIdempotentCheckoutReplay(
  orderId: string,
  status: string | null,
  orderToken: string | null,
) {
  return checkoutSuccess({
    order_id: orderId,
    order_token: orderToken,
    status: status || "processing",
    fulfillment_triggered: false,
    redirect_url: buildOrderConfirmationPath(orderId, orderToken),
    idempotent_replay: true,
  });
}

function extractCheckoutPayloadHash(notes: string | null): string | null {
  if (!notes) return null;

  try {
    const parsed = JSON.parse(notes) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const hash = (parsed as Record<string, unknown>).checkout_payload_hash;
    return typeof hash === "string" && hash.trim() ? hash.trim() : null;
  } catch {
    return null;
  }
}

function sortCheckoutItems(
  items: Array<{
    id: string;
    slug: string | null;
    quantity: number;
    variant: string | null;
  }>,
): Array<{
  id: string;
  slug: string | null;
  quantity: number;
  variant: string | null;
}> {
  return items
    .map((item) => ({
      id: String(item.id || "").trim(),
      slug: item.slug ? String(item.slug).trim().toLowerCase() : null,
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 0)),
      variant: item.variant ? String(item.variant).trim() : null,
    }))
    .sort((left, right) => {
      const leftKey = `${left.id}::${left.slug || ""}::${left.variant || ""}`;
      const rightKey = `${right.id}::${right.slug || ""}::${right.variant || ""}`;
      return leftKey.localeCompare(rightKey);
    });
}

function normalizeOptionalNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.floor(parsed));
}

function buildCheckoutPayloadHash(input: {
  items: NormalizedCheckoutItem[];
  body: CheckoutBody;
}): string {
  return hashCheckoutPayload({
    items: sortCheckoutItems(input.items),
    payer: {
      name: sanitizeText(String(input.body.payer?.name || ""), 120),
      email: sanitizeEmail(String(input.body.payer?.email || "")),
      phone: normalizePhone(String(input.body.payer?.phone || "")),
      document: normalizeDigits(String(input.body.payer?.document || "")),
    },
    shipping: {
      address: sanitizeText(String(input.body.shipping?.address || ""), 500),
      reference: sanitizeText(String(input.body.shipping?.reference || ""), 160),
      city: sanitizeText(String(input.body.shipping?.city || ""), 100),
      department: sanitizeText(String(input.body.shipping?.department || ""), 100),
      zip: sanitizeText(String(input.body.shipping?.zip || ""), 20),
      type: String(input.body.shipping?.type || ""),
      cost:
        input.body.shipping?.cost === undefined ||
        input.body.shipping?.cost === null
          ? null
          : Math.max(0, Number(input.body.shipping.cost) || 0),
      carrier_code:
        String(input.body.shipping?.carrier_code || "").trim().toLowerCase() ||
        null,
      carrier_name:
        sanitizeText(String(input.body.shipping?.carrier_name || ""), 120) ||
        null,
      insured: input.body.shipping?.insured === true,
      eta_min_days: normalizeOptionalNumber(input.body.shipping?.eta_min_days),
      eta_max_days: normalizeOptionalNumber(input.body.shipping?.eta_max_days),
      eta_range:
        sanitizeText(String(input.body.shipping?.eta_range || ""), 120) || null,
    },
    verification: {
      address_confirmed: input.body.verification?.address_confirmed === true,
      availability_confirmed:
        input.body.verification?.availability_confirmed === true,
      product_acknowledged:
        input.body.verification?.product_acknowledged === true,
    },
    pricing: {
      display_currency:
        String(
          sanitizeText(String(input.body.pricing?.display_currency || ""), 16) ||
            "",
        )
          .trim()
          .toUpperCase() || null,
      display_locale:
        String(
          sanitizeText(String(input.body.pricing?.display_locale || ""), 32) ||
            "",
        )
          .trim()
          .toLowerCase() || null,
      country_code:
        String(
          sanitizeText(String(input.body.pricing?.country_code || ""), 8) || "",
        )
          .trim()
          .toUpperCase() || null,
      display_rate:
        typeof input.body.pricing?.display_rate === "number"
          ? input.body.pricing.display_rate
          : null,
    },
    promotion: {
      code:
        String(
          sanitizeText(String(input.body.promotion?.code || ""), 32) || "",
        )
          .trim()
          .toUpperCase() || null,
    },
  });
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  if (
    request.headers.get("content-length") &&
    Number(request.headers.get("content-length")) > maxBodySize
  ) {
    logger.securityEvent("suspicious_activity", {
      type: "oversized_checkout_request",
      clientIp,
      contentLength: request.headers.get("content-length"),
    });
    return checkoutError("Solicitud demasiado grande.", {
      status: 413,
      code: "REQUEST_TOO_LARGE",
    });
  }

  const idempotencyKey = normalizeCheckoutIdempotencyKey(
    request.headers.get("x-idempotency-key"),
  );
  const paymentId = toCheckoutPaymentId(idempotencyKey);
  let stockReservations: CatalogStockReservation[] = [];

  if (process.env.NODE_ENV === "production" && !isCsrfSecretConfigured()) {
    return checkoutError(
      "Configura CSRF_SECRET (o ORDER_LOOKUP_SECRET) para proteger el checkout en produccion.",
      {
        status: 500,
        code: "CHECKOUT_CSRF_SECRET_MISSING",
      },
    );
  }

  // Same-origin validation (fix 1.1)
  if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
    return checkoutError("Solicitud no autorizada.", {
      status: 403,
      code: "CHECKOUT_SAME_ORIGIN_REQUIRED",
    });
  }

  // CSRF protection
  const csrfToken = request.headers.get("x-csrf-token");
  if (!validateCsrfToken(csrfToken)) {
    return checkoutError(
      "Token de seguridad invalido. Recarga la pagina e intenta de nuevo.",
      {
        status: 403,
        code: "CHECKOUT_CSRF_INVALID",
      },
    );
  }

  // Rate limiting on checkout (fix 1.2)
  const checkoutRateLimit = await checkRateLimitDb({
    key: `checkout:${clientIp}`,
    limit: 5,
    windowMs: 10 * 60 * 1000, // 5 checkouts per 10 minutes per IP
  });
  if (!checkoutRateLimit.allowed) {
    logger.securityEvent("rate_limit", {
      type: "checkout_rate_limit_exceeded",
      clientIp,
      retryAfterSeconds: checkoutRateLimit.retryAfterSeconds,
    });
    return checkoutError("Demasiados intentos de pedido. Intenta más tarde.", {
      status: 429,
      code: "CHECKOUT_RATE_LIMIT_DB",
      retryAfterSeconds: checkoutRateLimit.retryAfterSeconds,
      headers: {
        "Retry-After": String(checkoutRateLimit.retryAfterSeconds),
      },
    });
  }

  // Check if IP is blocked
  if (await isIpBlockedAsync(clientIp)) {
    return checkoutError(
      "Tu acceso ha sido restringido por violar las normas éticas.",
      {
        status: 403,
        code: "CHECKOUT_IP_BLOCKED",
      },
    );
  }

  // Anti-VPN check
  const vpnCheck = await isVpnOrProxy(clientIp, request.headers);
  if (vpnCheck.isVpn) {
    return checkoutError(
      "No se permiten pedidos desde VPN o proxy. Desactiva tu VPN e intentalo de nuevo.",
      {
        status: 403,
        code: "CHECKOUT_VPN_BLOCKED",
      },
    );
  }

  try {
    if (!isSupabaseAdminConfigured) {
      return checkoutError(
        "La tienda requiere base de datos activa para registrar pedidos contra entrega.",
        {
          status: 500,
          code: "SUPABASE_ADMIN_MISSING",
        },
      );
    }

    // Parse JSON with specific error handling
    let body: CheckoutBody;
    try {
      body = (await request.json()) as CheckoutBody;
    } catch {
      return checkoutError("Solicitud invalida.", {
        status: 400,
        code: "INVALID_JSON",
      });
    }

    const validation = validateCheckoutBody(body);

    if (Object.keys(validation.fieldErrors).length > 0) {
      return checkoutError(
        "Datos incompletos o invalidos para confirmar el pedido.",
        {
          status: 400,
          code: "INVALID_CHECKOUT_FIELDS",
          fields: {
            field_errors: validation.fieldErrors,
          },
        },
      );
    }

    if (validation.verificationError) {
      return checkoutError(validation.verificationError, {
        status: 400,
        code: "INVALID_CHECKOUT_VERIFICATION",
      });
    }

    if (validation.shippingTypeError) {
      return checkoutError(validation.shippingTypeError, {
        status: 400,
        code: "INVALID_SHIPPING_TYPE",
      });
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return checkoutError("Items de checkout invalidos.", {
        status: 400,
        code: "INVALID_CHECKOUT_ITEMS",
      });
    }

    if (body.items.length > 50) {
      return checkoutError("Demasiados productos en el pedido. Maximo 50 items.", {
        status: 400,
        code: "TOO_MANY_ITEMS",
      });
    }

    const normalizedItems = normalizeCheckoutItems(body.items);
    if (!normalizedItems?.length) {
      return checkoutError("Items de checkout invalidos.", {
        status: 400,
        code: "INVALID_CHECKOUT_ITEMS",
      });
    }

    const checkoutPayloadHash = buildCheckoutPayloadHash({
      items: normalizedItems,
      body,
    });

    if (paymentId) {
      const existingOrder = await findExistingOrderByPaymentId(paymentId);
      if (existingOrder) {
        const storedHash = extractCheckoutPayloadHash(existingOrder.notes);
        if (storedHash && storedHash !== checkoutPayloadHash) {
          return checkoutError(
            "El intento de reuso del identificador de idempotencia no coincide con el contenido original del pedido.",
            {
              status: 409,
              code: "IDEMPOTENCY_PAYLOAD_MISMATCH",
              fields: {
                existing_order_id: existingOrder.id,
              },
            },
          );
        }

        const existingToken = createOrderLookupToken(existingOrder.id);
        return buildIdempotentCheckoutReplay(
          existingOrder.id,
          existingOrder.status,
          existingToken,
        );
      }
    }

    if (
      process.env.NODE_ENV === "production" &&
      !isOrderLookupSecretConfigured()
    ) {
      return checkoutError(
        "Configura ORDER_LOOKUP_SECRET para proteger la consulta de ordenes.",
        {
          status: 500,
          code: "ORDER_LOOKUP_SECRET_MISSING",
        },
      );
    }

    if (!isEmailConfigured()) {
      return checkoutError(
        "Configura SMTP_USER y SMTP_PASSWORD para enviar notificaciones al cliente.",
        {
          status: 500,
          code: "CHECKOUT_EMAIL_NOT_CONFIGURED",
        },
      );
    }

    const productSnapshots = await loadProductSnapshots(normalizedItems);
    const pricedItems = buildPricedItems(normalizedItems, productSnapshots);

    if (!pricedItems?.length || pricedItems.length !== normalizedItems.length) {
      return checkoutError(
        "Algunos productos no estan disponibles en este momento.",
        {
          status: 400,
          code: "CHECKOUT_PRODUCTS_UNAVAILABLE",
        },
      );
    }

    // SECURITY: Prevent $0 order totals
    const hasValidPrice = pricedItems.some((item) => item.unit_price > 0);
    if (!hasValidPrice) {
      return checkoutError(
        "El carrito debe contener al menos un producto con precio valido.",
        {
          status: 400,
          code: "INVALID_CART_PRICING",
        },
      );
    }

    const cleanPhone = normalizePhone(validation.formData.phone);
    if (!cleanPhone) {
      return checkoutError(
        "Numero de telefono invalido para confirmar el pedido.",
        {
          status: 400,
          code: "INVALID_PHONE",
        },
      );
    }

    const cleanAddress = validation.formData.address.trim();

    if (
      await hasRecentDuplicateOrder({
        phone: cleanPhone,
        address: cleanAddress,
      })
    ) {
      return checkoutError(
        "Has alcanzado el limite maximo de 5 pedidos activos. Espera a que se procesen o contacta a soporte.",
        {
          status: 409,
          code: "DUPLICATE_ACTIVE_ORDERS",
        },
      );
    }

    const subtotal = calculateSubtotal(pricedItems);
    const hasOnlyFreeShipping = hasOnlyFreeShippingProducts(
      pricedItems.map((item) => ({
        id: item.id,
        free_shipping: item.free_shipping,
      })),
    );

    // Pick highest custom shipping cost from NON-free-shipping items only.
    // Must match client logic in checkout/page.tsx to avoid CHECKOUT_SHIPPING_MISMATCH.
    const customShippingCosts = pricedItems
      .filter((item) => !item.free_shipping)
      .map((item) => item.shipping_cost)
      .filter((cost): cost is number => cost !== null && cost >= 0);
    const baseShippingCost =
      customShippingCosts.length > 0
        ? Math.max(...customShippingCosts)
        : undefined;

    const shippingCost = calculateNationalShippingCost({
      hasOnlyFreeShippingProducts: hasOnlyFreeShipping,
      baseShippingCost,
    });
    const rawTotal = subtotal + shippingCost;
    const couponApplication = body.promotion?.code
      ? evaluateCoupon({
          code: body.promotion.code,
          subtotal,
          shippingCost,
          items: pricedItems.map((item) => ({
            id: item.id,
            slug: item.slug,
            quantity: item.quantity,
          })),
        })
      : null;

    if (body.promotion?.code && (!couponApplication || !couponApplication.ok)) {
      const couponErrorCode =
        couponApplication && !couponApplication.ok
          ? couponApplication.errorCode
          : "COUPON_NOT_APPLICABLE";

      return checkoutError(
        couponApplication?.message ||
          "El codigo promocional ya no aplica al pedido actual.",
        {
          status: 409,
          code: couponErrorCode,
          fields: {
            coupon_application: couponApplication,
            server_subtotal: subtotal,
            server_shipping: shippingCost,
            server_total: rawTotal,
          },
        },
      );
    }

    if (body.promotion?.code && couponApplication?.ok) {
      const userHasUsedCoupon = await hasUsedCoupon({
        phone: cleanPhone,
        email: validation.formData.email,
        couponCode: couponApplication.normalizedCode,
      });

      if (userHasUsedCoupon) {
        return checkoutError(
          "Ya has utilizado este cupón en un pedido anterior. Los cupones son de un solo uso por cliente.",
          {
            status: 409,
            code: "COUPON_ALREADY_USED",
            fields: {
              coupon_application: couponApplication,
              server_subtotal: subtotal,
              server_shipping: shippingCost,
              server_total: rawTotal,
            },
          },
        );
      }
    }

    const stockReservationItems = pricedItems
      .map((item) => ({
        slug: item.slug || item.lookupSlugs[0] || "",
        variant: item.variant,
        quantity: item.quantity,
        product_name: item.title,
      }))
      .filter((item) => item.slug.length > 0);

    const stockReservationResult = await reserveCatalogStock(
      stockReservationItems,
    );

    if (!stockReservationResult.ok) {
      return checkoutError(
        stockReservationResult.message ||
          "Algunos productos ya no tienen stock suficiente. Recarga la pagina y vuelve a intentar.",
        {
          status: 409,
          code: "CHECKOUT_STOCK_UNAVAILABLE",
        },
      );
    }

    stockReservations = stockReservationResult.reservations;

    const deliveryEstimate = estimateColombiaDelivery({
      department: validation.formData.department,
    });

    const total = couponApplication?.ok
      ? couponApplication.discountedTotal
      : rawTotal;
    const orderItems = buildOrderItems(pricedItems);

    const clientSentShippingCost = Math.max(0, Number(body.shipping.cost) || 0);
    if (clientSentShippingCost !== shippingCost) {
      return checkoutError(
        "El costo de envío ha cambiado. Por favor revisa el total actualizado.",
        {
          status: 409,
          code: "CHECKOUT_SHIPPING_MISMATCH",
          fields: {
            server_subtotal: subtotal,
            server_shipping: shippingCost,
            server_total: couponApplication?.ok
              ? couponApplication.discountedTotal
              : rawTotal,
            coupon_application: couponApplication?.ok ? couponApplication : undefined,
          },
        },
      );
    }

    const orderPayload: OrderInsert = {
      customer_name: sanitizeText(validation.formData.name, 120),
      customer_email: sanitizeEmail(validation.formData.email),
      customer_phone: cleanPhone,
      customer_document: normalizeDigits(validation.formData.document),
      shipping_address: sanitizeText(cleanAddress, 500),
      shipping_city: sanitizeText(validation.formData.city, 100),
      shipping_department: sanitizeText(validation.formData.department, 100),
      shipping_zip: validation.formData.zip.trim() || null,
      status: "processing",
      payment_id: paymentId,
      payment_method: "manual_cod",
      shipping_type: "nacional",
      subtotal,
      shipping_cost: shippingCost,
      total,
      items: orderItems,
      notes: buildOrderNotes({
        pricing: body.pricing,
        logistics: {
          department: validation.formData.department.trim(),
          selectedCarrierCode: deliveryEstimate.carrier.code,
          selectedCarrierName: deliveryEstimate.carrier.name,
          selectedCarrierInsured: deliveryEstimate.carrier.insured,
          hasOnlyFreeShippingProducts: hasOnlyFreeShipping,
          estimatedMinDays: deliveryEstimate.minBusinessDays,
          estimatedMaxDays: deliveryEstimate.maxBusinessDays,
          estimatedRange: deliveryEstimate.formattedRange,
        },
        checkoutPayloadHash,
        verification: body.verification,
        shippingReference: validation.formData.reference,
        promotion: couponApplication?.ok
          ? {
              code: couponApplication.normalizedCode,
              label:
                couponApplication.coupon?.label ||
                couponApplication.normalizedCode,
              type: couponApplication.coupon?.type || "fixed",
              subtotalDiscount: couponApplication.subtotalDiscount,
              shippingDiscount: couponApplication.shippingDiscount,
              totalDiscount: couponApplication.totalDiscount,
              discountedTotal: couponApplication.discountedTotal,
            }
          : null,
        email: {
          stage: "confirmed",
          initiatedAt: new Date().toISOString(),
          sentTo: validation.formData.email.trim().toLowerCase(),
        },
      }),
    };

    const { data: createdOrder, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert(orderPayload as never)
      .select("id")
      .single();

    if (orderError || !createdOrder) {
      if (isDuplicateOrderPaymentIdError(orderError) && paymentId) {
        await restoreCatalogStock(stockReservations);
        stockReservations = [];

        const existingOrder = await findExistingOrderByPaymentId(paymentId);
        if (existingOrder) {
          const existingToken = createOrderLookupToken(existingOrder.id);
          return buildIdempotentCheckoutReplay(
            existingOrder.id,
            existingOrder.status,
            existingToken,
          );
        }
      }

      console.error("[Checkout COD] Error saving order:", orderError);
      await restoreCatalogStock(stockReservations);
      return checkoutError("No se pudo registrar el pedido.", {
        status: 500,
        code: "CHECKOUT_ORDER_CREATE_FAILED",
      });
    }

    const orderReference = (createdOrder as { id: string }).id;
    const orderLookupToken = createOrderLookupToken(orderReference);
    const redirectPath = buildOrderConfirmationPath(
      orderReference,
      orderLookupToken,
    );

    // Send Discord notification (non-blocking)
    void sendOrderToDiscord({
      orderId: orderReference,
      createdAt: new Date().toISOString(),
      customerName: orderPayload.customer_name,
      customerEmail: orderPayload.customer_email,
      customerPhone: orderPayload.customer_phone,
      customerDocument: orderPayload.customer_document,
      shippingAddress: orderPayload.shipping_address,
      shippingReference: validation.formData.reference.trim() || null,
      shippingCity: orderPayload.shipping_city,
      shippingDepartment: orderPayload.shipping_department,
      shippingZip: orderPayload.shipping_zip || null,
      carrierCode: deliveryEstimate.carrier.code,
      carrierName: deliveryEstimate.carrier.name,
      carrierInsured: deliveryEstimate.carrier.insured,
      etaMinDays: deliveryEstimate.minBusinessDays,
      etaMaxDays: deliveryEstimate.maxBusinessDays,
      etaRange: deliveryEstimate.formattedRange,
      total,
      subtotal,
      shippingCost,
      checkoutModel: "manual_cod_v1",
      fulfillmentMode: "manual_dispatch",
      manualDispatchRequired: true,
      items: pricedItems.map((item) => ({
        product_id: item.id,
        slug: item.slug,
        product_name: item.title,
        quantity: item.quantity,
        price: item.unit_price,
        variant: item.variant ?? null,
        image: item.picture_url || null,
      })),
      clientIp,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // Send order confirmation email to customer
    try {
      await notifyOrderStatus(orderReference, "processing");
    } catch (emailError) {
      console.error(
        "[Checkout COD] Failed to send confirmation email:",
        emailError,
      );
    }

    return checkoutSuccess({
      order_id: orderReference,
      order_token: orderLookupToken,
      status: "processing",
      fulfillment_triggered: false,
      redirect_url: redirectPath,
    });
  } catch (error) {
    console.error("[Checkout COD] Error:", error);
    if (stockReservations.length > 0) {
      await restoreCatalogStock(stockReservations);
      stockReservations = [];
    }
    return checkoutError("No se pudo confirmar el pedido contra entrega.", {
      status: 500,
      code: "CHECKOUT_FAILED",
    });
  }
}

function buildOrderConfirmationPath(
  orderId: string,
  orderToken: string | null,
): string {
  const base = `/orden/confirmacion?order_id=${encodeURIComponent(orderId)}`;
  if (!orderToken) return base;
  return `${base}&order_token=${encodeURIComponent(orderToken)}`;
}
