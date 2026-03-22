import { normalizeProductSlug } from "@/lib/legacy-product-slugs";

export interface ManualVariantStock {
  name: string;
  stock: number | null;
  variation_id?: number | null;
}

export interface ManualStockSnapshot {
  total_stock: number | null;
  variants: ManualVariantStock[];
}

const MANUAL_STOCK_BY_SLUG: Record<string, ManualStockSnapshot> = {
  "airpods-pro-3": {
    total_stock: 60,
    variants: [{ name: "BLANCO", stock: 60, variation_id: null }],
  },
  "audifonos-xiaomi-redmi-buds-4-lite": {
    total_stock: 323,
    variants: [
      { name: "NEGRO", stock: 198, variation_id: 1387309 },
      { name: "BLANCO", stock: 125, variation_id: 1387310 },
    ],
  },
  "silla-gamer-premium-reposapies": {
    total_stock: 640,
    variants: [
      { name: "NEGRO ROJO", stock: 120, variation_id: 1539198 },
      { name: "NEGRO AZUL", stock: 0, variation_id: 1539199 },
      { name: "NEGRO", stock: 121, variation_id: 1539202 },
      { name: "NEGRO BLANCO", stock: 120, variation_id: 1539200 },
      { name: "NEGRO GRIS", stock: 129, variation_id: 1539201 },
      { name: "ROSA", stock: 150, variation_id: 1539203 },
    ],
  },
  "air-fryer-freidora-10l-premium": {
    total_stock: 199,
    variants: [
      { name: "ACERO INOXIDABLE/NEGRO", stock: 199, variation_id: null },
    ],
  },
  "smartwatch-ultra-series-pantalla-grande": {
    total_stock: 100,
    variants: [{ name: "NARANJA", stock: 100, variation_id: null }],
  },
  "camara-seguridad-bombillo-360-wifi": {
    total_stock: 150,
    variants: [{ name: "E27 (ESTANDAR)", stock: 150, variation_id: null }],
  },
  "cepillo-electrico-5-en-1-secador-alisador": {
    total_stock: 99,
    variants: [{ name: "NEGRO", stock: 99, variation_id: null }],
  },
  "lampara-mata-zancudos-electrica": {
    total_stock: 300,
    variants: [{ name: "BLANCO", stock: 300, variation_id: null }],
  },
  "aspiradora-inalambrica-de-mano": {
    total_stock: 99,
    variants: [{ name: "UNICO", stock: 99, variation_id: null }],
  },
  "combo-cargador-4-en-1-adaptadorcable": {
    total_stock: 66,
    variants: [{ name: "UNICO", stock: 66, variation_id: null }],
  },
  "corrector-de-postura": {
    total_stock: 288,
    variants: [
      { name: "S", stock: 45, variation_id: 1955346 },
      { name: "M", stock: 46, variation_id: 1955347 },
      { name: "L", stock: 48, variation_id: 1955348 },
      { name: "XL", stock: 49, variation_id: 1955349 },
      { name: "XXL", stock: 50, variation_id: 1955350 },
      { name: "XXXL", stock: 50, variation_id: 1955351 },
    ],
  },
  "depilador-facial-electrico-recargable": {
    total_stock: 95,
    variants: [{ name: "UNICO", stock: 95, variation_id: null }],
  },
};

function cloneSnapshot(snapshot: ManualStockSnapshot): ManualStockSnapshot {
  return {
    total_stock: snapshot.total_stock,
    variants: snapshot.variants.map((variant) => ({
      name: variant.name,
      stock: variant.stock,
      variation_id: variant.variation_id ?? null,
    })),
  };
}

export function getManualStockSnapshot(
  slug: string | null | undefined,
): ManualStockSnapshot | null {
  const normalizedSlug =
    normalizeProductSlug(slug) ||
    String(slug || "")
      .trim()
      .toLowerCase();
  if (!normalizedSlug) return null;

  const snapshot = MANUAL_STOCK_BY_SLUG[normalizedSlug];
  if (!snapshot) return null;
  return cloneSnapshot(snapshot);
}
