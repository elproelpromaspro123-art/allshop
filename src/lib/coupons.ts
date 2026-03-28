export type CouponType = "percentage" | "fixed" | "shipping";

export type CouponErrorCode =
  | "COUPON_REQUIRED"
  | "COUPON_NOT_FOUND"
  | "COUPON_MIN_SUBTOTAL"
  | "COUPON_SHIPPING_ALREADY_FREE"
  | "COUPON_NOT_APPLICABLE";

export interface CouponContextItem {
  id: string;
  slug?: string | null;
  quantity: number;
}

interface CouponDefinition {
  code: string;
  label: string;
  description: string;
  type: CouponType;
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
  eligibleProductIds?: string[];
  eligibleProductSlugs?: string[];
  successMessage: string;
}

export interface CouponPublicDetails {
  code: string;
  label: string;
  description: string;
  type: CouponType;
}

interface CouponApplicationBase {
  code: string;
  normalizedCode: string;
  subtotal: number;
  shippingCost: number;
  discountedSubtotal: number;
  discountedShippingCost: number;
  discountedTotal: number;
  subtotalDiscount: number;
  shippingDiscount: number;
  totalDiscount: number;
  coupon?: CouponPublicDetails;
}

export interface CouponApplicationSuccess extends CouponApplicationBase {
  ok: true;
  message: string;
}

export interface CouponApplicationFailure extends CouponApplicationBase {
  ok: false;
  errorCode: CouponErrorCode;
  message: string;
  requiredSubtotal?: number;
  missingSubtotal?: number;
}

export type CouponApplication =
  | CouponApplicationSuccess
  | CouponApplicationFailure;

export interface CouponEvaluationInput {
  code: string | null | undefined;
  subtotal: number;
  shippingCost: number;
  items: CouponContextItem[];
}

const COUPON_CATALOG: readonly CouponDefinition[] = [
  {
    code: "VORTIXY10",
    label: "Vortixy 10",
    description: "10% menos sobre el subtotal en pedidos seleccionados.",
    type: "percentage",
    value: 10,
    minSubtotal: 120_000,
    maxDiscount: 45_000,
    successMessage: "10% de descuento aplicado sobre el subtotal.",
  },
  {
    code: "CLIENTE20K",
    label: "Cliente 20K",
    description: "Ahorra $20.000 COP cuando tu pedido llega al mínimo.",
    type: "fixed",
    value: 20_000,
    minSubtotal: 180_000,
    successMessage: "$20.000 de ahorro aplicado a tu pedido.",
  },
  {
    code: "ENVIOVORTI",
    label: "Envío Vortixy",
    description: "Envío gratis para pedidos con cobertura nacional.",
    type: "shipping",
    value: 100,
    minSubtotal: 90_000,
    successMessage: "Envío gratis aplicado en este pedido.",
  },
] as const;

function toSafeAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function normalizeCouponCode(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 32);
}

function toCouponPublicDetails(
  coupon: CouponDefinition | undefined,
): CouponPublicDetails | undefined {
  if (!coupon) return undefined;

  return {
    code: coupon.code,
    label: coupon.label,
    description: coupon.description,
    type: coupon.type,
  };
}

function createBaseResult(
  input: CouponEvaluationInput,
  coupon?: CouponDefinition,
): CouponApplicationBase {
  const subtotal = toSafeAmount(input.subtotal);
  const shippingCost = toSafeAmount(input.shippingCost);
  const total = subtotal + shippingCost;

  return {
    code: String(input.code || ""),
    normalizedCode: normalizeCouponCode(input.code),
    subtotal,
    shippingCost,
    discountedSubtotal: subtotal,
    discountedShippingCost: shippingCost,
    discountedTotal: total,
    subtotalDiscount: 0,
    shippingDiscount: 0,
    totalDiscount: 0,
    coupon: toCouponPublicDetails(coupon),
  };
}

function matchesEligibleItems(
  coupon: CouponDefinition,
  items: CouponContextItem[],
): boolean {
  if (!coupon.eligibleProductIds?.length && !coupon.eligibleProductSlugs?.length) {
    return true;
  }

  const eligibleIds = new Set(
    (coupon.eligibleProductIds || []).map((item) => item.trim().toLowerCase()),
  );
  const eligibleSlugs = new Set(
    (coupon.eligibleProductSlugs || []).map((item) => item.trim().toLowerCase()),
  );

  return items.some((item) => {
    const itemId = String(item.id || "")
      .trim()
      .toLowerCase();
    const itemSlug = String(item.slug || "")
      .trim()
      .toLowerCase();

    return eligibleIds.has(itemId) || (itemSlug ? eligibleSlugs.has(itemSlug) : false);
  });
}

export function getCouponCatalog(): readonly CouponPublicDetails[] {
  return COUPON_CATALOG.map((coupon) => ({
    code: coupon.code,
    label: coupon.label,
    description: coupon.description,
    type: coupon.type,
  }));
}

export function evaluateCoupon(
  input: CouponEvaluationInput,
): CouponApplication {
  const normalizedCode = normalizeCouponCode(input.code);
  const baseResult = createBaseResult(input);

  if (!normalizedCode) {
    return {
      ...baseResult,
      ok: false,
      errorCode: "COUPON_REQUIRED",
      message: "Ingresa un codigo promocional para validarlo.",
    };
  }

  const coupon = COUPON_CATALOG.find((entry) => entry.code === normalizedCode);
  const couponBase = createBaseResult(input, coupon);

  if (!coupon) {
    return {
      ...couponBase,
      ok: false,
      errorCode: "COUPON_NOT_FOUND",
      message: "Ese codigo no existe o ya no esta activo.",
    };
  }

  if (
    coupon.minSubtotal &&
    couponBase.subtotal < coupon.minSubtotal
  ) {
    return {
      ...couponBase,
      ok: false,
      errorCode: "COUPON_MIN_SUBTOTAL",
      message: `Este codigo se activa desde ${formatCouponCopAmount(coupon.minSubtotal)}.`,
      requiredSubtotal: coupon.minSubtotal,
      missingSubtotal: Math.max(0, coupon.minSubtotal - couponBase.subtotal),
    };
  }

  if (!matchesEligibleItems(coupon, input.items)) {
    return {
      ...couponBase,
      ok: false,
      errorCode: "COUPON_NOT_APPLICABLE",
      message: "Este codigo no aplica a los productos actuales del carrito.",
    };
  }

  if (coupon.type === "shipping" && couponBase.shippingCost <= 0) {
    return {
      ...couponBase,
      ok: false,
      errorCode: "COUPON_SHIPPING_ALREADY_FREE",
      message: "Este código solo aplica cuando tu pedido tiene envío pago.",
    };
  }

  const subtotalDiscount =
    coupon.type === "percentage"
      ? Math.min(
          coupon.maxDiscount ?? Number.MAX_SAFE_INTEGER,
          Math.round((couponBase.subtotal * coupon.value) / 100),
        )
      : coupon.type === "fixed"
        ? Math.min(couponBase.subtotal, toSafeAmount(coupon.value))
        : 0;
  const shippingDiscount =
    coupon.type === "shipping"
      ? Math.min(couponBase.shippingCost, toSafeAmount(couponBase.shippingCost))
      : 0;
  const discountedSubtotal = Math.max(0, couponBase.subtotal - subtotalDiscount);
  const discountedShippingCost = Math.max(
    0,
    couponBase.shippingCost - shippingDiscount,
  );
  const totalDiscount = subtotalDiscount + shippingDiscount;

  return {
    ...couponBase,
    ok: true,
    subtotalDiscount,
    shippingDiscount,
    totalDiscount,
    discountedSubtotal,
    discountedShippingCost,
    discountedTotal: discountedSubtotal + discountedShippingCost,
    message: coupon.successMessage,
  };
}

export function formatCouponCopAmount(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(toSafeAmount(amount));
}
