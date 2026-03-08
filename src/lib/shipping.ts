const NATIONAL_SHIPPING_FEE_COP = 12_900;

interface ProductShippingInput {
  id?: string | null;
  slug?: string | null;
  free_shipping?: boolean | null;
  freeShipping?: boolean | null;
}

function parseCsvSet(value: string | undefined): Set<string> {
  if (!value) return new Set();

  return new Set(
    String(value)
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

function normalizeToken(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

const FREE_SHIPPING_PRODUCT_IDS = parseCsvSet(
  process.env.NEXT_PUBLIC_FREE_SHIPPING_PRODUCT_IDS ||
  process.env.FREE_SHIPPING_PRODUCT_IDS
);

const FREE_SHIPPING_PRODUCT_SLUGS = parseCsvSet(
  process.env.NEXT_PUBLIC_FREE_SHIPPING_PRODUCT_SLUGS ||
  process.env.FREE_SHIPPING_PRODUCT_SLUGS
);

export function isProductShippingFree(product: ProductShippingInput): boolean {
  if (product.freeShipping === true || product.free_shipping === true) {
    return true;
  }

  const normalizedId = normalizeToken(product.id);
  if (normalizedId && FREE_SHIPPING_PRODUCT_IDS.has(normalizedId)) {
    return true;
  }

  const normalizedSlug = normalizeToken(product.slug);
  if (normalizedSlug && FREE_SHIPPING_PRODUCT_SLUGS.has(normalizedSlug)) {
    return true;
  }

  return false;
}

export function hasOnlyFreeShippingProducts(
  products: ProductShippingInput[]
): boolean {
  if (!products.length) return false;
  return products.every((product) => isProductShippingFree(product));
}

export function calculateNationalShippingCost(input: {
  hasOnlyFreeShippingProducts: boolean;
  baseShippingCost?: number;
}): number {
  if (input.hasOnlyFreeShippingProducts) return 0;
  return input.baseShippingCost !== undefined ? input.baseShippingCost : NATIONAL_SHIPPING_FEE_COP;
}

export {
  NATIONAL_SHIPPING_FEE_COP,
};
