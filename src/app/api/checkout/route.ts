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
import {
  isEmailConfigured,
  notifyOrderStatus,
  sendOrderVerificationEmail,
} from "@/lib/notifications";
import {
  buildPendingEmailConfirmation,
  patchEmailConfirmationNotes,
} from "@/lib/email-confirmation";
import {
  fetchDropiStockSnapshot,
  parseDropiProviderConfig,
} from "@/lib/dropi";
import { buildDropiProviderUrlFromCatalog } from "@/lib/dropi-catalog";
import { getPhoneLookupCandidates, normalizePhone } from "@/lib/phone";
import { sendOrderToDiscord } from "@/lib/discord";
import { isVpnOrProxy } from "@/lib/vpn-detect";
import { isIpBlocked } from "@/lib/ip-block";
import { normalizeLegacyImagePaths } from "@/lib/image-paths";
import type {
  OrderInsert,
  OrderItem,
  ShippingType,
} from "@/types/database";

interface CheckoutItemInput {
  id: string;
  slug?: string | null;
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
  slug: string | null;
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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
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

function getLegacyMockSlugById(productId: string): string | null {
  const match = PRODUCTS.find((product) => product.id === productId);
  return match?.slug || null;
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
        : []
    ),
    free_shipping: toOptionalBoolean(product.free_shipping),
    provider_api_url: String(product.provider_api_url || "").trim() || null,
  };
}

function isValidCheckout(body: CheckoutBody): boolean {
  const cleanName = String(body?.payer?.name || "").trim();
  const cleanEmail = String(body?.payer?.email || "").trim();
  const cleanPhone = normalizePhone(body?.payer?.phone || "");
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
    const slugFromPayload = String(item.slug || "")
      .trim()
      .toLowerCase();
    const slug = slugFromPayload || getLegacyMockSlugById(id);
    const quantity = sanitizeQuantity(item.quantity);
    const variant = item.variant ? String(item.variant).trim() : null;
    if (!id || quantity === null) return null;

    const mergeKey = `${id}::${slug ?? ""}::${variant ?? ""}`;
    const existing = merged.get(mergeKey);
    if (existing) {
      existing.quantity = Math.min(10, existing.quantity + quantity);
      merged.set(mergeKey, existing);
      continue;
    }

    merged.set(mergeKey, {
      id,
      slug,
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

  const fromEnv = overrides[product.slug.toLowerCase()] || null;
  if (fromEnv) return fromEnv;

  return buildDropiProviderUrlFromCatalog(product.slug);
}

function hasDropiMapping(
  product: ProductSnapshot,
  overrides: Record<string, string>
): boolean {
  const providerUrl = resolveProviderUrl(product, overrides);
  if (!providerUrl) return false;
  return parseDropiProviderConfig(providerUrl).kind === "ok";
}

function resolveDropiAvailableStock(input: {
  totalStock: number | null;
  byVariation: Array<{ variationId: number | null; quantity: number }>;
  variationId?: number | null;
}): number | null {
  const desiredVariationId =
    typeof input.variationId === "number" && Number.isFinite(input.variationId)
      ? input.variationId
      : null;

  if (desiredVariationId !== null) {
    const variationRow = input.byVariation.find(
      (row) => row.variationId === desiredVariationId
    );
    if (!variationRow) return 0;
    return Math.max(0, Math.floor(Number(variationRow.quantity) || 0));
  }

  if (typeof input.totalStock === "number" && Number.isFinite(input.totalStock)) {
    return Math.max(0, Math.floor(input.totalStock));
  }

  if (input.byVariation.length > 0) {
    return input.byVariation.reduce((sum, row) => {
      return sum + Math.max(0, Math.floor(Number(row.quantity) || 0));
    }, 0);
  }

  return null;
}

async function loadProductSnapshots(
  items: NormalizedCheckoutItem[]
): Promise<Map<string, ProductSnapshot>> {
  if (!items.length) return new Map();

  const snapshotMap = new Map<string, ProductSnapshot>();
  const requestedIds = Array.from(new Set(items.map((item) => item.id)));
  const requestedSlugs = Array.from(
    new Set(
      items
        .map((item) => item.slug)
        .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
    )
  );

  if (isSupabaseAdminConfigured) {
    const baseSelect = "id,slug,name,price,images,provider_api_url,is_active";
    const withFreeShippingSelect = `${baseSelect},free_shipping`;

    const queryProducts = async (
      field: "id" | "slug",
      values: string[]
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
      throw new Error(`Error fetching products from Supabase: ${String(error)}`);
    }

    const rowsById = new Map<string, Record<string, unknown>>();
    const rowsBySlug = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      const rowId = String(row.id || "").trim();
      const rowSlug = String(row.slug || "")
        .trim()
        .toLowerCase();
      if (rowId) rowsById.set(rowId, row);
      if (rowSlug) rowsBySlug.set(rowSlug, row);
    }

    for (const item of items) {
      const row =
        rowsById.get(item.id) ||
        (item.slug ? rowsBySlug.get(item.slug.toLowerCase()) : undefined);
      if (!row) continue;

      const snapshot = toProductSnapshot(row);
      snapshotMap.set(item.id, snapshot);
      snapshotMap.set(snapshot.id, snapshot);
      snapshotMap.set(snapshot.slug.toLowerCase(), snapshot);
    }

    return snapshotMap;
  }

  const activeProducts = PRODUCTS.filter((product) => product.is_active);
  const productsById = new Map(activeProducts.map((product) => [product.id, product]));
  const productsBySlug = new Map(
    activeProducts.map((product) => [product.slug.toLowerCase(), product])
  );

  for (const item of items) {
    const product =
      productsById.get(item.id) ||
      (item.slug ? productsBySlug.get(item.slug.toLowerCase()) : undefined);

    if (!product) continue;

    const snapshot: ProductSnapshot = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      images: normalizeLegacyImagePaths(product.images),
      free_shipping: toOptionalBoolean(product.free_shipping),
      provider_api_url: product.provider_api_url || null,
    };

    snapshotMap.set(item.id, snapshot);
    snapshotMap.set(snapshot.id, snapshot);
    snapshotMap.set(snapshot.slug.toLowerCase(), snapshot);
  }

  return snapshotMap;
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
      id: product.id,
      slug: product.slug,
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
  email: {
    stage: "pending";
    initiatedAt: string;
    sentTo: string;
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
    email_confirmation: {
      required: true,
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
  const recentSince = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  const phoneCandidates = getPhoneLookupCandidates(input.phone);
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

  // Check if IP is blocked
  if (isIpBlocked(clientIp)) {
    return NextResponse.json(
      { error: "Tu acceso ha sido restringido por violar las normas éticas." },
      { status: 403 }
    );
  }

  // Rate limit: 2 orders per 30 minutes per IP
  const rateLimit = checkRateLimit({
    key: `checkout:${clientIp}`,
    limit: 2,
    windowMs: 30 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "Por medidas de seguridad, el límite de pedidos por cada 30 minutos es de 2. Se recomienda comprar todo lo que necesitas en una sola compra o esperar 30 minutos para poder comprar de nuevo.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  // Anti-VPN check
  const vpnCheck = await isVpnOrProxy(clientIp, request.headers);
  if (vpnCheck.isVpn) {
    return NextResponse.json(
      {
        error:
          "No se permiten pedidos desde VPN o proxy. Por favor desactiva tu VPN e inténtalo de nuevo.",
      },
      { status: 403 }
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

    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          error:
            "Configura SMTP_USER y SMTP_PASSWORD para enviar el codigo de confirmacion por correo.",
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

    const productSnapshots = await loadProductSnapshots(normalizedItems);
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

    for (const item of pricedItems) {
      const product = productSnapshots.get(item.id);
      if (!product) continue;

      const providerUrl = resolveProviderUrl(product, providerOverrides);
      if (!providerUrl) continue;

      const dropiConfigResult = parseDropiProviderConfig(providerUrl);
      if (dropiConfigResult.kind !== "ok") continue;

      let snapshot;
      try {
        snapshot = await fetchDropiStockSnapshot(dropiConfigResult.config);
      } catch (error) {
        console.error("[Checkout COD] Dropi stock validation error:", error);
        return NextResponse.json(
          {
            error:
              "No fue posible validar el inventario en tiempo real. Intenta nuevamente en unos minutos.",
          },
          { status: 503 }
        );
      }

      const availableStock = resolveDropiAvailableStock({
        totalStock: snapshot.totalStock,
        byVariation: snapshot.byVariation,
        variationId: dropiConfigResult.config.variationId,
      });

      if (availableStock === null) {
        return NextResponse.json(
          {
            error:
              "No fue posible confirmar el stock del producto seleccionado. Intenta nuevamente.",
          },
          { status: 503 }
        );
      }

      if (item.quantity > availableStock) {
        const variantLabel = item.variant ? ` (${item.variant})` : "";
        return NextResponse.json(
          {
            error: `Stock insuficiente para "${item.title}"${variantLabel}. Disponible: ${availableStock}.`,
          },
          { status: 409 }
        );
      }
    }

    const cleanPhone = normalizePhone(body.payer.phone);
    if (!cleanPhone) {
      return NextResponse.json(
        { error: "Numero de telefono invalido para confirmar el pedido." },
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

    const deliveryEstimate = estimateColombiaDelivery({
      department: body.shipping.department,
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
        email: {
          stage: "pending",
          initiatedAt: new Date().toISOString(),
          sentTo: body.payer.email.trim().toLowerCase(),
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
    const orderLookupToken = createOrderLookupToken(orderReference);
    const redirectPath = buildOrderConfirmationPath(orderReference, orderLookupToken);

    const emailConfirmation = buildPendingEmailConfirmation({
      orderId: orderReference,
      email: orderPayload.customer_email,
    });
    const notesWithEmailConfirmation = patchEmailConfirmationNotes(
      orderPayload.notes || null,
      emailConfirmation.state
    );

    const { error: notesUpdateError } = await supabaseAdmin
      .from("orders")
      .update({ notes: notesWithEmailConfirmation })
      .eq("id", orderReference);

    if (notesUpdateError) {
      console.error("[Checkout COD] Error updating email confirmation state:", notesUpdateError);
      await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", orderReference);
      return NextResponse.json(
        { error: "No se pudo preparar la validacion del pedido." },
        { status: 500 }
      );
    }

    const verificationUrl = `${getRequestBaseUrl(request)}${redirectPath}`;

    try {
      await sendOrderVerificationEmail({
        orderId: orderReference,
        customerName: orderPayload.customer_name,
        customerEmail: orderPayload.customer_email,
        total,
        verificationCode: emailConfirmation.code,
        verificationUrl,
        etaRange: deliveryEstimate.formattedRange,
        codeExpiresAt: emailConfirmation.state.code_expires_at,
      });
    } catch (emailError) {
      console.error("[Checkout COD] Email verification send error:", emailError);
      const cancelledNotes = patchEmailConfirmationNotes(notesWithEmailConfirmation, {
        stage: "failed_to_send",
        failed_at: new Date().toISOString(),
        last_error: toErrorMessage(emailError),
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
            "No pudimos enviar el codigo de confirmacion por correo. Intenta nuevamente en unos minutos.",
        },
        { status: 500 }
      );
    }

    // Send Discord notification (non-blocking)
    void sendOrderToDiscord({
      orderId: orderReference,
      customerName: orderPayload.customer_name,
      customerEmail: orderPayload.customer_email,
      customerPhone: orderPayload.customer_phone,
      customerDocument: orderPayload.customer_document,
      shippingAddress: orderPayload.shipping_address,
      shippingCity: orderPayload.shipping_city,
      shippingDepartment: orderPayload.shipping_department,
      total,
      subtotal,
      shippingCost,
      items: orderItems,
      clientIp,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      order_id: orderReference,
      order_token: orderLookupToken,
      status: "pending",
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

function buildOrderConfirmationPath(orderId: string, orderToken: string | null): string {
  const base = `/orden/confirmacion?order_id=${encodeURIComponent(orderId)}`;
  if (!orderToken) return base;
  return `${base}&order_token=${encodeURIComponent(orderToken)}`;
}

function getRequestBaseUrl(request: NextRequest): string {
  const explicit = String(process.env.NEXT_PUBLIC_APP_URL || "").trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const forwardedProto = String(request.headers.get("x-forwarded-proto") || "").trim();
  const forwardedHost = String(request.headers.get("x-forwarded-host") || "").trim();
  const host = forwardedHost || String(request.headers.get("host") || "").trim();
  const protocol = forwardedProto || "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}
