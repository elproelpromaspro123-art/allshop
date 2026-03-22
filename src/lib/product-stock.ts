import { getManualStockSnapshot } from "@/lib/manual-stock";

export const PRODUCT_CARD_LOW_STOCK_THRESHOLD = 30;

function sumKnownVariantStock(
  variants: Array<{ stock: number | null | undefined }>,
): number | null {
  if (!variants.length) return null;
  if (!variants.every((variant) => typeof variant.stock === "number")) {
    return null;
  }

  return variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
}

export function resolveProductTotalStock(input: {
  slug: string;
  total_stock?: number | null;
}): number | null {
  if (typeof input.total_stock === "number") {
    return Math.max(0, Math.floor(input.total_stock));
  }

  const snapshot = getManualStockSnapshot(input.slug);
  if (!snapshot) return null;

  if (typeof snapshot.total_stock === "number") {
    return Math.max(0, Math.floor(snapshot.total_stock));
  }

  return sumKnownVariantStock(snapshot.variants);
}

export function isProductLowStockBadgeVisible(
  input: {
    slug: string;
    total_stock?: number | null;
  },
  threshold = PRODUCT_CARD_LOW_STOCK_THRESHOLD,
): boolean {
  const totalStock = resolveProductTotalStock(input);
  return (
    typeof totalStock === "number" && totalStock > 0 && totalStock <= threshold
  );
}
