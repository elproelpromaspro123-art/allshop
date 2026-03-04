import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { PRODUCTS } from "@/data/mock";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  calculateNationalShippingCost,
  hasOnlyFreeShippingProducts,
  isProductShippingFree,
} from "@/lib/shipping";
import {
  COLOMBIA_DEPARTMENTS,
  estimateColombiaDelivery,
  normalizeDepartment,
} from "@/lib/delivery";
import {
  createOrderLookupToken,
  isOrderLookupSecretConfigured,
} from "@/lib/order-token";
import { notifyOrderStatus } from "@/lib/notifications";
import { parseDropiProviderConfig } from "@/lib/dropi";
import {
  buildWhatsAppFirstConfirmationMessage,
  getWhatsAppPhoneLookupCandidates,
  isWhatsAppMessagingConfigured,
  normalizeWhatsAppPhone,
  sendWhatsAppTextMessage,
  type WhatsAppConfirmationStage,
} from "@/lib/whatsapp";
import type {
  OrderInsert,
  OrderItem,
  OrderStatus,
  ShippingType,
} from "@/types/database";

interface CheckoutItemInput {
  id: string;
  quantity: number;
  variant?: string | null;
}

interface CheckoutBody {
  items: CheckoutItemInput[];
  payer: {
    name: string;
    email: string;
    phone: string;
    document: string;
  };
  shipping: {
    address: string;
    reference?: string;
    city: string;
    department: string;
    zip?: string;
    type: ShippingType;
    cost?: number;
    carrier_code?: string | null;
    carrier_name?: string | null;
    insured?: boolean;
    eta_min_days?: number | null;
    eta_max_days?: number | null;
    eta_range?: string | null;
  };
  verification?: {
    address_confirmed?: boolean;
    availability_confirmed?: boolean;
    product_acknowledged?: boolean;
  };
  pricing?: {
    display_currency?: string;
    display_locale?: string;
    country_code?: string;
    display_rate?: number;
  };
}

interface ProductSnapshot {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: string[];
  free_shipping?: boolean | null;
  provider_api_url: string | null;
}

interface NormalizedCheckoutItem {
  id: string;
  quantity: number;
  variant: string | null;
}

interface PricedCheckoutItem extends NormalizedCheckoutItem {
  title: string;
  unit_price: number;
  picture_url: string;
  free_shipping: boolean;
}

function sanitizeQuantity(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.floor(parsed);
  if (rounded <= 0) return null;
  return Math.min(10, rounded);
}

function normalizeDigits(value: string): string {
  return String(value || "").replace(/\D+/g, "");
}

function toOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isLikelyValidAddress(address: string): boolean {
  const normalized = address.trim();
  return normalized.length >= 12 && /\d/.test(normalized);
}

function isKnownDepartment(value: string): boolean {
  const normalized = normalizeDepartment(value);
  return COLOMBIA_DEPARTMENTS.some(
    (department) => normalizeDepartment(department) === normalized
  );
}

function isValidCheckout(body: CheckoutBody): boolean {
  const cleanName = String(body?.payer?.name || "").trim();
  const cleanEmail = String(body?.payer?.email || "").trim();
  const cleanPhone = normalizeWhatsAppPhone(body?.payer?.phone || "");
  const cleanDocument = normalizeDigits(body?.payer?.document || "");
  const cleanAddress = String(body?.shipping?.address || "").trim();
  const cleanCity = String(body?.shipping?.city || "").trim();
  const cleanDepartment = String(body?.shipping?.department || "").trim();

  return Boolean(
    body?.items?.length &&
      cleanName.length >= 6 &&
      isValidEmail(cleanEmail) &&
      Boolean(cleanPhone) &&
      cleanDocument.length >= 6 &&
      cleanDocument.length <= 15 &&
      isLikelyValidAddress(cleanAddress) &&
      cleanCity.length >= 3 &&
      isKnownDepartment(cleanDepartment) &&
      body.shipping.type === "nacional" &&
      body.verification?.address_confirmed === true &&
      body.verification?.availability_confirmed === true &&
      body.verification?.product_acknowledged === true
  );
}

function normalizeCheckoutItems(
  items: CheckoutItemInput[]
): NormalizedCheckoutItem[] | null {
  const merged = new Map<string, NormalizedCheckoutItem>();

  for (const item of items) {
    const id = String(item.id || "").trim();
    const quantity = sanitizeQuantity(item.quantity);
    const variant = item.variant ? String(item.variant).trim() : null;
    if (!id || quantity === null) return null;

    const mergeKey = `${id}::${variant ?? ""}`;
    const existing = merged.get(mergeKey);
    if (existing) {
      existing.quantity = Math.min(10, existing.quantity + quantity);
      merged.set(mergeKey, existing);
      continue;
    }

    merged.set(mergeKey, {
      id,
      quantity,
      variant,
    });
  }

  return Array.from(merged.values());
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

function resolveProviderUrl(
  product: ProductSnapshot,
  overrides: Record<string, string>
): string | null {
  const fromProduct = String(product.provider_api_url || "").trim();
  if (fromProduct) return fromProduct;
  return overrides[product.slug.toLowerCase()] || null;
}

function hasDropiMapping(
  product: ProductSnapshot,
  overrides: Record<string, string>
): boolean {
  const providerUrl = resolveProviderUrl(product, overrides);
  if (!providerUrl) return false;
  return parseDropiProviderConfig(providerUrl).kind === "ok";
}

async function loadProductSnapshots(
  productIds: string[]
): Promise<Map<string, ProductSnapshot>> {
  if (!productIds.length) return new Map();

  if (isSupabaseAdminConfigured) {
    const baseSelect = "id,slug,name,price,images,provider_api_url,is_active";
    const withFreeShippingSelect = `${baseSelect},free_shipping`;

    let data: Record<string, unknown>[] | null = null;
    let errorMessage: string | null = null;

    const withFreeShipping = await supabaseAdmin
      .from("products")
      .select(withFreeShippingSelect)
      .in("id", productIds)
      .eq("is_active", true);

    if (withFreeShipping.error) {
      if (/free_shipping/i.test(withFreeShipping.error.message)) {
        const fallback = await supabaseAdmin
          .from("products")
          .select(baseSelect)
          .in("id", productIds)
          .eq("is_active", true);

        if (fallback.error) {
          errorMessage = fallback.error.message;
        } else {
          data = (fallback.data || []) as Record<string, unknown>[];
        }
      } else {
        errorMessage = withFreeShipping.error.message;
      }
    } else {
      data = (withFreeShipping.data || []) as Record<string, unknown>[];
    }

    if (errorMessage) {
      throw new Error(`Error fetching products from Supabase: ${errorMessage}`);
    }

    return new Map(
      (data || []).map((product) => [
        String(product.id),
        {
          id: String(product.id),
          slug: String(product.slug),
          name: String(product.name),
          price: Math.max(0, Number(product.price) || 0),
          images: Array.isArray(product.images)
            ? product.images.map((image) => String(image))
            : [],
          free_shipping: toOptionalBoolean(product.free_shipping),
          provider_api_url: String(product.provider_api_url || "").trim() || null,
        },
      ])
    );
  }

  const activeProducts = PRODUCTS.filter((product) => product.is_active);
  return new Map(
    activeProducts
      .filter((product) => productIds.includes(product.id))
      .map((product) => [
        product.id,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          images: product.images,
          free_shipping: toOptionalBoolean(product.free_shipping),
          provider_api_url: product.provider_api_url || null,
        },
      ])
  );
}

function buildPricedItems(
  normalizedItems: NormalizedCheckoutItem[],
  productSnapshots: Map<string, ProductSnapshot>
): PricedCheckoutItem[] | null {
  const pricedItems: PricedCheckoutItem[] = [];

  for (const item of normalizedItems) {
    const product = productSnapshots.get(item.id);
    if (!product) return null;

    pricedItems.push({
      id: item.id,
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
    });
  }

  return pricedItems;
}

function calculateSubtotal(items: PricedCheckoutItem[]): number {
  return items.reduce(
    (sum, item) =>
      sum +
      Math.max(0, Number(item.unit_price)) * Math.max(1, Number(item.quantity)),
    0
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
  verification: CheckoutBody["verification"];
  shippingReference?: string;
  whatsapp: {
    stage: WhatsAppConfirmationStage;
    confirmationsRequired: number;
    confirmationsReceived: number;
    initiatedAt: string;
  };
}): string {
  return JSON.stringify({
    checkout_model: "dropi_cod_v1",
    pricing: input.pricing,
    logistics: {
      department: input.logistics.department,
      selected_carrier_code: input.logistics.selectedCarrierCode,
      selected_carrier_name: input.logistics.selectedCarrierName,
      selected_carrier_insured: input.logistics.selectedCarrierInsured,
      has_only_free_shipping_products: input.logistics.hasOnlyFreeShippingProducts,
      estimated_min_days: input.logistics.estimatedMinDays,
      estimated_max_days: input.logistics.estimatedMaxDays,
      estimated_range: input.logistics.estimatedRange,
    },
    verification: input.verification,
    shipping_reference: input.shippingReference || null,
    whatsapp_confirmation: {
      required: true,
      stage: input.whatsapp.stage,
      confirmations_required: input.whatsapp.confirmationsRequired,
      confirmations_received: input.whatsapp.confirmationsReceived,
      initiated_at: input.whatsapp.initiatedAt,
      last_prompt_at: input.whatsapp.initiatedAt,
    },
  });
}

async function hasRecentDuplicateOrder(input: {
  phone: string;
  address: string;
}): Promise<boolean> {
  const recentSince = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  const phoneCandidates = getWhatsAppPhoneLookupCandidates(input.phone);
  if (!phoneCandidates.length) return false;

  let query = supabaseAdmin
    .from("orders")
    .select("id")
    .eq("shipping_address", input.address)
    .gte("created_at", recentSince)
    .in("status", ["pending", "processing"])
    .limit(1);

  query =
    phoneCandidates.length === 1
      ? query.eq("customer_phone", phoneCandidates[0])
      : query.in("customer_phone", phoneCandidates);

  const { data } = await query;

  return Boolean(data?.length);
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit({
    key: `checkout:${clientIp}`,
    limit: 20,
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

  try {
    if (!isSupabaseAdminConfigured) {
      return NextResponse.json(
        {
          error:
            "La tienda requiere base de datos activa para registrar pedidos contra entrega.",
        },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV === "production" && !isOrderLookupSecretConfigured()) {
      return NextResponse.json(
        { error: "Configura ORDER_LOOKUP_SECRET para proteger la consulta de ordenes." },
        { status: 500 }
      );
    }

    if (!isWhatsAppMessagingConfigured()) {
      return NextResponse.json(
        {
          error:
            "Configura WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID para confirmar pedidos por WhatsApp.",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as CheckoutBody;

    if (!isValidCheckout(body)) {
      return NextResponse.json(
        { error: "Datos incompletos o invalidos para confirmar el pedido." },
        { status: 400 }
      );
    }

    const normalizedItems = normalizeCheckoutItems(body.items);
    if (!normalizedItems?.length) {
      return NextResponse.json(
        { error: "Items de checkout invalidos." },
        { status: 400 }
      );
    }

    const uniqueIds = Array.from(new Set(normalizedItems.map((item) => item.id)));
    const productSnapshots = await loadProductSnapshots(uniqueIds);
    const pricedItems = buildPricedItems(normalizedItems, productSnapshots);

    if (!pricedItems?.length || pricedItems.length !== normalizedItems.length) {
      return NextResponse.json(
        { error: "Algunos productos no estan disponibles en este momento." },
        { status: 400 }
      );
    }

    const providerOverrides = getEnvProviderOverrides();
    for (const item of pricedItems) {
      const product = productSnapshots.get(item.id);
      if (!product || !hasDropiMapping(product, providerOverrides)) {
        return NextResponse.json(
          {
            error:
              "Uno de los productos no tiene mapeo activo con Dropi. Revisa provider_api_url o DROPI_PROVIDER_MAP_OVERRIDES.",
          },
          { status: 409 }
        );
      }
    }

    const cleanPhone = normalizeWhatsAppPhone(body.payer.phone);
    if (!cleanPhone) {
      return NextResponse.json(
        { error: "Numero de telefono invalido para confirmacion por WhatsApp." },
        { status: 400 }
      );
    }

    const cleanAddress = String(body.shipping.address || "").trim();

    if (await hasRecentDuplicateOrder({ phone: cleanPhone, address: cleanAddress })) {
      return NextResponse.json(
        {
          error:
            "Ya existe un pedido reciente con estos datos. Si necesitas ayuda, contacta soporte.",
        },
        { status: 409 }
      );
    }

    const subtotal = calculateSubtotal(pricedItems);
    const hasOnlyFreeShipping = hasOnlyFreeShippingProducts(
      pricedItems.map((item) => ({
        id: item.id,
        free_shipping: item.free_shipping,
      }))
    );
    const shippingCost = calculateNationalShippingCost({
      hasOnlyFreeShippingProducts: hasOnlyFreeShipping,
    });

    const initialEstimate = estimateColombiaDelivery({
      department: body.shipping.department,
      preferredCarrierCode: body.shipping.carrier_code ?? undefined,
    });
    const insuredCarrier =
      initialEstimate.availableCarriers.find((carrier) => carrier.insured) ||
      initialEstimate.carrier;
    const deliveryEstimate = estimateColombiaDelivery({
      department: body.shipping.department,
      preferredCarrierCode: insuredCarrier.code,
    });

    const total = subtotal + shippingCost;
    const orderItems = buildOrderItems(pricedItems);

    const clientSentShippingCost = Math.max(0, Number(body.shipping.cost) || 0);
    if (clientSentShippingCost !== shippingCost) {
      console.warn("[Checkout COD] Shipping mismatch detected", {
        clientIp,
        clientSentShippingCost,
        serverShippingCost: shippingCost,
      });
    }

    const orderPayload: OrderInsert = {
      customer_name: body.payer.name.trim(),
      customer_email: body.payer.email.trim().toLowerCase(),
      customer_phone: cleanPhone,
      customer_document: normalizeDigits(body.payer.document),
      shipping_address: cleanAddress,
      shipping_city: body.shipping.city.trim(),
      shipping_department: body.shipping.department.trim(),
      shipping_zip: body.shipping.zip?.trim() || null,
      status: "pending",
      payment_id: null,
      payment_method: "dropi_cod",
      shipping_type: "nacional",
      subtotal,
      shipping_cost: shippingCost,
      total,
      items: orderItems,
      notes: buildOrderNotes({
        pricing: body.pricing,
        logistics: {
          department: body.shipping.department.trim(),
          selectedCarrierCode: deliveryEstimate.carrier.code,
          selectedCarrierName: deliveryEstimate.carrier.name,
          selectedCarrierInsured: deliveryEstimate.carrier.insured,
          hasOnlyFreeShippingProducts: hasOnlyFreeShipping,
          estimatedMinDays: deliveryEstimate.minBusinessDays,
          estimatedMaxDays: deliveryEstimate.maxBusinessDays,
          estimatedRange: deliveryEstimate.formattedRange,
        },
        verification: body.verification,
        shippingReference: body.shipping.reference,
        whatsapp: {
          stage: "pending_first",
          confirmationsRequired: 2,
          confirmationsReceived: 0,
          initiatedAt: new Date().toISOString(),
        },
      }),
    };

    const { data: createdOrder, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (orderError || !createdOrder) {
      console.error("[Checkout COD] Error saving order:", orderError);
      return NextResponse.json(
        { error: "No se pudo registrar el pedido." },
        { status: 500 }
      );
    }

    const orderReference = createdOrder.id;
    const finalStatus: OrderStatus = "pending";

    const whatsappMessage = buildWhatsAppFirstConfirmationMessage({
      customerName: orderPayload.customer_name,
      orderId: orderReference,
      items: orderItems.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        variant: item.variant,
      })),
      total,
      etaRange: deliveryEstimate.formattedRange,
    });

    try {
      await sendWhatsAppTextMessage({
        to: cleanPhone,
        body: whatsappMessage,
      });
    } catch (whatsappError) {
      console.error("[Checkout COD] WhatsApp send error:", whatsappError);
      const cancelledNotes = mergeOrderNotes(orderPayload.notes || null, {
        whatsapp_confirmation: {
          required: true,
          stage: "failed_to_send",
          confirmations_required: 2,
          confirmations_received: 0,
          failed_at: new Date().toISOString(),
          error: toErrorMessage(whatsappError),
        },
      });

      await supabaseAdmin
        .from("orders")
        .update({ status: "cancelled", notes: cancelledNotes })
        .eq("id", orderReference);

      try {
        await notifyOrderStatus(orderReference, "cancelled");
      } catch (notificationError) {
        console.error("[Checkout COD] Notification error (cancelled):", notificationError);
      }

      return NextResponse.json(
        {
          error:
            "No pudimos confirmar tu pedido por WhatsApp en este momento. Intenta nuevamente en unos minutos.",
        },
        { status: 500 }
      );
    }

    try {
      await notifyOrderStatus(orderReference, finalStatus);
    } catch (notificationError) {
      console.error("[Checkout COD] Notification error:", notificationError);
    }

    const orderLookupToken = createOrderLookupToken(orderReference);
    const redirectPath = orderLookupToken
      ? `/orden/confirmacion?order_id=${encodeURIComponent(
          orderReference
        )}&order_token=${encodeURIComponent(orderLookupToken)}`
      : `/orden/confirmacion?order_id=${encodeURIComponent(orderReference)}`;

    return NextResponse.json({
      order_id: orderReference,
      order_token: orderLookupToken,
      status: finalStatus,
      fulfillment_triggered: false,
      redirect_url: redirectPath,
    });
  } catch (error) {
    console.error("[Checkout COD] Error:", error);
    return NextResponse.json(
      { error: "No se pudo confirmar el pedido contra entrega." },
      { status: 500 }
    );
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
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
