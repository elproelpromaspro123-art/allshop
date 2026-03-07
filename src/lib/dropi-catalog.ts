interface DropiCatalogEntry {
  productId: number;
  supplierId?: number;
  warehouseId?: number;
  variationIds?: Record<string, number>;
}

const DROPI_CATALOG_BY_SLUG: Record<string, DropiCatalogEntry> = {
  "cepillo-electrico-5-en-1-secador-alisador": {
    productId: 570202,
    supplierId: 106656,
    warehouseId: 106656,
  },
  "aire-acondicionado-portatil-arctic-ice": {
    productId: 2085987,
    supplierId: 192984,
    warehouseId: 192984,
  },
  "smartwatch-ultra-series-pantalla-grande": {
    productId: 2073403,
    supplierId: 192984,
    warehouseId: 192984,
  },
  "air-fryer-freidora-10l-premium": {
    productId: 710577,
    supplierId: 45331,
    warehouseId: 45331,
  },
  "silla-gamer-premium-reposapies": {
    productId: 1839552,
    supplierId: 29544,
    warehouseId: 29544,
    variationIds: {
      "negro rojo": 1539198,
      "negro azul": 1539199,
      negro: 1539202,
      "negro total": 1539202,
      "negro blanco": 1539200,
      "negro gris": 1539201,
      rosa: 1539203,
    },
  },
  "auriculares-xiaomi-redmi-airdots-s": {
    productId: 242026,
    supplierId: 32016,
    warehouseId: 32016,
  },
};

function toPositiveInteger(value: string | null | undefined): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.floor(parsed);
  return rounded > 0 ? rounded : null;
}

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

export function getDropiCatalogProductId(slug: string | null | undefined): number | null {
  const key = String(slug || "").trim().toLowerCase();
  const entry = DROPI_CATALOG_BY_SLUG[key];
  return entry?.productId ?? null;
}

export function resolveDropiVariationId(
  slug: string | null | undefined,
  variantLabel: string | null | undefined
): number | null {
  const key = String(slug || "").trim().toLowerCase();
  const entry = DROPI_CATALOG_BY_SLUG[key];
  if (!entry?.variationIds || !variantLabel) return null;

  const normalizedVariant = normalizeLabel(variantLabel);
  if (!normalizedVariant) return null;

  const direct = entry.variationIds[normalizedVariant];
  if (typeof direct === "number") return direct;

  const matched = Object.entries(entry.variationIds).find(([label]) => {
    const normalizedLabel = normalizeLabel(label);
    return (
      normalizedVariant === normalizedLabel ||
      normalizedVariant.includes(normalizedLabel) ||
      normalizedLabel.includes(normalizedVariant)
    );
  });

  if (!matched) return null;
  return matched[1];
}

export function buildDropiProviderUrlFromCatalog(
  slug: string | null | undefined
): string | null {
  const productId = getDropiCatalogProductId(slug);
  if (!productId) return null;

  const key = String(slug || "").trim().toLowerCase();
  const entry = DROPI_CATALOG_BY_SLUG[key];

  const supplierId =
    entry?.supplierId ??
    toPositiveInteger(process.env.DROPI_DEFAULT_SUPPLIER_ID) ??
    toPositiveInteger(process.env.DROPI_SUPPLIER_ID);
  const warehouseId =
    entry?.warehouseId ??
    toPositiveInteger(process.env.DROPI_DEFAULT_WAREHOUSE_ID) ??
    toPositiveInteger(process.env.DROPI_WAREHOUSE_ID);

  if (!supplierId || !warehouseId) return null;

  return `dropi://supplier_id=${supplierId}&product_id=${productId}&warehouse_id=${warehouseId}`;
}
