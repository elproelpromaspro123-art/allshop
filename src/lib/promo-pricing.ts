interface CompareAtInput {
  slug?: string | null;
  price?: number | null;
  compare_at_price?: number | null;
}

const MIN_COMPARE_AT_BY_SLUG: Record<string, number> = {
  "audifonos-xiaomi-redmi-buds-4-lite": 119000,
};

function normalizeSlug(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function getEffectiveCompareAtPrice(product: CompareAtInput): number {
  const currentCompareAt = Math.max(0, Number(product.compare_at_price) || 0);
  const floorBySlug = MIN_COMPARE_AT_BY_SLUG[normalizeSlug(product.slug)] || 0;
  const nextCompareAt = Math.max(currentCompareAt, floorBySlug);

  const price = Math.max(0, Number(product.price) || 0);
  if (nextCompareAt <= price) return 0;
  return nextCompareAt;
}
