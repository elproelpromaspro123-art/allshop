import "server-only";

import { PRODUCTS } from "@/data/mock";
import type { Product } from "@/types";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";
import {
  getProductSlugLookupCandidates,
  normalizeProductSlug,
} from "@/lib/legacy-product-slugs";
import { getManualStockSnapshot } from "@/lib/manual-stock";

const CATALOG_RUNTIME_TABLE = "catalog_runtime_state";

type RuntimeSource = "runtime_state" | "manual_snapshot" | "product_fallback";

interface RuntimeFetchResult {
  rowsBySlug: Map<string, RuntimeStateRow>;
  tableReady: boolean;
  errorMessage: string | null;
}

interface RuntimeStateRow {
  product_slug: string;
  total_stock: number | null;
  variants: CatalogVariantStock[];
  updated_at: string | null;
}

export interface CatalogVariantStock {
  name: string;
  stock: number | null;
  variation_id: number | null;
}

export interface CatalogStockState {
  product_slug: string;
  total_stock: number | null;
  variants: CatalogVariantStock[];
  updated_at: string | null;
  source: RuntimeSource;
}

export interface CatalogControlProduct {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  compare_at_price: number | null;
  discount_percent: number;
  total_stock: number | null;
  variants: CatalogVariantStock[];
  updated_at: string | null;
}

export interface CatalogControlSnapshot {
  version: string;
  updated_at: string | null;
  runtime_table_ready: boolean;
  products: CatalogControlProduct[];
}

export interface CatalogControlUpdateInput {
  slug: string;
  price: number;
  compare_at_price: number | null;
  total_stock: number | null;
  variants: CatalogVariantStock[];
  updated_by?: string | null;
}

export interface CatalogStockAdjustmentItem {
  slug: string;
  variant: string | null;
  quantity: number;
  product_name?: string;
}

export interface CatalogStockReservation {
  slug: string;
  variant: string | null;
  quantity: number;
}

export interface CatalogReserveStockResult {
  ok: boolean;
  reservations: CatalogStockReservation[];
  message?: string;
}

interface ResolvedProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  variants: Product["variants"];
  updated_at: string | null;
}

interface MutationResult {
  ok: boolean;
  slug: string;
  variant: string | null;
  quantity: number;
  message?: string;
}

function normalizeText(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeSlug(value: string | null | undefined): string {
  const raw = String(value || "").trim().toLowerCase();
  return normalizeProductSlug(raw) || raw;
}

function parseNonNegativeInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.floor(parsed);
  return rounded >= 0 ? rounded : null;
}

function parseVariantStockRows(value: unknown): CatalogVariantStock[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Record<string, unknown>;
      const name = String(candidate.name || "").trim();
      if (!name) return null;

      const stock = parseNonNegativeInt(candidate.stock);
      const variationIdRaw = candidate.variation_id;
      const variationId =
        typeof variationIdRaw === "number" && Number.isFinite(variationIdRaw)
          ? Math.floor(variationIdRaw)
          : null;

      return {
        name,
        stock,
        variation_id: variationId,
      };
    })
    .filter((entry): entry is CatalogVariantStock => Boolean(entry));
}

function dedupeVariantRows(variants: CatalogVariantStock[]): CatalogVariantStock[] {
  const seen = new Set<string>();
  const output: CatalogVariantStock[] = [];

  for (const variant of variants) {
    const normalizedName = normalizeText(variant.name);
    if (!normalizedName || seen.has(normalizedName)) continue;
    seen.add(normalizedName);
    output.push({
      name: variant.name.trim(),
      stock: parseNonNegativeInt(variant.stock),
      variation_id:
        typeof variant.variation_id === "number" && Number.isFinite(variant.variation_id)
          ? Math.floor(variant.variation_id)
          : null,
    });
  }

  return output;
}

function calculateDiscountPercent(price: number, compareAtPrice: number | null): number {
  const currentPrice = Math.max(0, Number(price) || 0);
  const compareAt = Math.max(0, Number(compareAtPrice) || 0);
  if (!compareAt || compareAt <= currentPrice) return 0;
  return Math.round(((compareAt - currentPrice) / compareAt) * 100);
}

function calculateTotalStockFromVariants(variants: CatalogVariantStock[]): number | null {
  if (!variants.length) return null;
  const allKnown = variants.every((variant) => typeof variant.stock === "number");
  if (!allKnown) return null;
  return variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
}

function buildVariantFallbackFromProduct(product: Product | ResolvedProduct | null): CatalogVariantStock[] {
  if (!product || !Array.isArray(product.variants) || product.variants.length === 0) return [];

  const firstVariant = product.variants[0];
  if (!firstVariant?.options?.length) return [];

  return firstVariant.options.map((option) => ({
    name: String(option),
    stock: null,
    variation_id: null,
  }));
}

function isRuntimeTableMissingError(error: unknown): boolean {
  const message = String(
    error && typeof error === "object" && "message" in error
      ? (error as { message?: string }).message
      : error || ""
  ).toLowerCase();

  return (
    message.includes("catalog_runtime_state") &&
    (message.includes("does not exist") || message.includes("relation"))
  );
}

function toResolvedProduct(record: Record<string, unknown>): ResolvedProduct {
  return {
    id: String(record.id),
    slug: normalizeSlug(String(record.slug)),
    name: String(record.name || ""),
    price: Math.max(0, Number(record.price) || 0),
    compare_at_price: parseNonNegativeInt(record.compare_at_price),
    images: Array.isArray(record.images) ? record.images.map((item) => String(item)) : [],
    variants: Array.isArray(record.variants)
      ? (record.variants as Product["variants"])
      : [],
    updated_at: String(record.updated_at || "").trim() || null,
  };
}

function toRuntimeStateRow(record: Record<string, unknown>): RuntimeStateRow | null {
  const slug = normalizeSlug(record.product_slug as string);
  if (!slug) return null;

  return {
    product_slug: slug,
    total_stock: parseNonNegativeInt(record.total_stock),
    variants: dedupeVariantRows(parseVariantStockRows(record.variants)),
    updated_at: String(record.updated_at || "").trim() || null,
  };
}

async function fetchRuntimeRowsBySlugs(slugs: string[]): Promise<RuntimeFetchResult> {
  if (!isSupabaseAdminConfigured || !slugs.length) {
    return {
      rowsBySlug: new Map(),
      tableReady: true,
      errorMessage: null,
    };
  }

  const { data, error } = await supabaseAdmin
    .from(CATALOG_RUNTIME_TABLE)
    .select("product_slug,total_stock,variants,updated_at")
    .in("product_slug", slugs);

  if (error) {
    if (isRuntimeTableMissingError(error)) {
      return {
        rowsBySlug: new Map(),
        tableReady: false,
        errorMessage:
          "No existe la tabla catalog_runtime_state. Ejecuta el SQL de sincronizacion para habilitar stock manual en tiempo real.",
      };
    }

    return {
      rowsBySlug: new Map(),
      tableReady: false,
      errorMessage: `No se pudo consultar el estado operativo del catalogo: ${error.message}`,
    };
  }

  const rowsBySlug = new Map<string, RuntimeStateRow>();
  for (const row of (data || []) as Record<string, unknown>[]) {
    const parsed = toRuntimeStateRow(row);
    if (!parsed) continue;
    rowsBySlug.set(parsed.product_slug, parsed);
  }

  return {
    rowsBySlug,
    tableReady: true,
    errorMessage: null,
  };
}

async function getResolvedProductBySlug(
  slug: string
): Promise<ResolvedProduct | null> {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) return null;

  const lookupSlugs = getProductSlugLookupCandidates(normalizedSlug);

  if (!isSupabaseAdminConfigured) {
    const match =
      PRODUCTS.find((product) =>
        lookupSlugs.includes(normalizeSlug(product.slug))
      ) || null;
    if (!match) return null;
    return {
      id: match.id,
      slug: normalizeSlug(match.slug),
      name: match.name,
      price: Math.max(0, Number(match.price) || 0),
      compare_at_price: parseNonNegativeInt(match.compare_at_price),
      images: Array.isArray(match.images) ? match.images : [],
      variants: Array.isArray(match.variants) ? match.variants : [],
      updated_at: String(match.updated_at || "").trim() || null,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id,slug,name,price,compare_at_price,images,variants,updated_at")
    .in("slug", lookupSlugs)
    .eq("is_active", true);

  if (error || !data?.length) return null;

  const rows = (data as Record<string, unknown>[]).map((row) => toResolvedProduct(row));
  for (const lookupSlug of lookupSlugs) {
    const found = rows.find((row) => row.slug === lookupSlug);
    if (found) return found;
  }
  return rows[0] || null;
}

function pickRuntimeRow(
  lookupSlugs: string[],
  rowsBySlug: Map<string, RuntimeStateRow>
): RuntimeStateRow | null {
  for (const slug of lookupSlugs) {
    const row = rowsBySlug.get(slug);
    if (row) return row;
  }
  return null;
}

function getFallbackManualSnapshot(lookupSlugs: string[]) {
  for (const slug of lookupSlugs) {
    const snapshot = getManualStockSnapshot(slug);
    if (snapshot) return snapshot;
  }
  return null;
}

function buildCatalogStateFromFallback(input: {
  slug: string;
  product: Product | ResolvedProduct | null;
  runtimeRow: RuntimeStateRow | null;
  manualSnapshot: ReturnType<typeof getManualStockSnapshot>;
}): CatalogStockState {
  if (input.runtimeRow) {
    const runtimeTotal =
      typeof input.runtimeRow.total_stock === "number"
        ? input.runtimeRow.total_stock
        : calculateTotalStockFromVariants(input.runtimeRow.variants);

    return {
      product_slug: input.runtimeRow.product_slug,
      total_stock: runtimeTotal,
      variants: input.runtimeRow.variants,
      updated_at: input.runtimeRow.updated_at,
      source: "runtime_state",
    };
  }

  if (input.manualSnapshot) {
    return {
      product_slug: input.slug,
      total_stock:
        typeof input.manualSnapshot.total_stock === "number"
          ? input.manualSnapshot.total_stock
          : calculateTotalStockFromVariants(
              parseVariantStockRows(input.manualSnapshot.variants)
            ),
      variants: dedupeVariantRows(
        parseVariantStockRows(input.manualSnapshot.variants)
      ),
      updated_at: null,
      source: "manual_snapshot",
    };
  }

  const variantFallback = buildVariantFallbackFromProduct(input.product);
  return {
    product_slug: input.slug,
    total_stock: calculateTotalStockFromVariants(variantFallback),
    variants: variantFallback,
    updated_at: null,
    source: "product_fallback",
  };
}

async function saveRuntimeState(input: {
  product_slug: string;
  total_stock: number | null;
  variants: CatalogVariantStock[];
  updated_by?: string | null;
}): Promise<void> {
  if (!isSupabaseAdminConfigured) return;

  const payload = {
    product_slug: normalizeSlug(input.product_slug),
    total_stock: parseNonNegativeInt(input.total_stock),
    variants: dedupeVariantRows(input.variants),
    updated_by: String(input.updated_by || "").trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from(CATALOG_RUNTIME_TABLE)
    .upsert(payload, { onConflict: "product_slug" });

  if (error) {
    if (isRuntimeTableMissingError(error)) {
      throw new Error(
        "No existe la tabla catalog_runtime_state. Ejecuta el SQL de sincronizacion para habilitar stock manual en tiempo real."
      );
    }
    throw new Error(`No se pudo guardar el estado operativo: ${error.message}`);
  }
}

function resolveVariantIndex(
  rawVariant: string | null,
  variants: CatalogVariantStock[]
): number | null {
  if (!variants.length) return null;
  if (!rawVariant && variants.length === 1) return 0;

  const normalizedRaw = normalizeText(rawVariant || "");
  if (normalizedRaw) {
    const exactIndex = variants.findIndex(
      (variant) => normalizeText(variant.name) === normalizedRaw
    );
    if (exactIndex >= 0) return exactIndex;

    const segments = normalizedRaw
      .split(/[\/|,]/g)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length) {
      for (const segment of segments) {
        const segmentIndex = variants.findIndex(
          (variant) => normalizeText(variant.name) === segment
        );
        if (segmentIndex >= 0) return segmentIndex;
      }
    }
  }

  return variants.length === 1 ? 0 : null;
}

async function mutateSingleStock(input: {
  slug: string;
  variant: string | null;
  quantity: number;
  direction: "decrement" | "increment";
  updated_by?: string | null;
}): Promise<MutationResult> {
  const quantity = Math.max(0, Math.floor(Number(input.quantity) || 0));
  if (!quantity) {
    return {
      ok: true,
      slug: normalizeSlug(input.slug),
      variant: input.variant,
      quantity: 0,
    };
  }

  const product = await getResolvedProductBySlug(input.slug);
  if (!product) {
    return {
      ok: false,
      slug: normalizeSlug(input.slug),
      variant: input.variant,
      quantity,
      message: "Producto no encontrado para ajustar stock.",
    };
  }

  const canonicalSlug = normalizeSlug(product.slug);
  const lookupSlugs = getProductSlugLookupCandidates(canonicalSlug);
  const runtimeFetch = await fetchRuntimeRowsBySlugs(lookupSlugs);
  const runtimeRow = pickRuntimeRow(lookupSlugs, runtimeFetch.rowsBySlug);
  const manualSnapshot = getFallbackManualSnapshot(lookupSlugs);
  const currentState = buildCatalogStateFromFallback({
    slug: canonicalSlug,
    product,
    runtimeRow,
    manualSnapshot,
  });

  if (!runtimeFetch.tableReady && isSupabaseAdminConfigured) {
    return {
      ok: false,
      slug: canonicalSlug,
      variant: input.variant,
      quantity,
      message: runtimeFetch.errorMessage || "No se pudo acceder a la tabla de stock operativo.",
    };
  }

  const variants = currentState.variants.map((variant) => ({
    ...variant,
    stock: parseNonNegativeInt(variant.stock),
  }));
  const directionMultiplier = input.direction === "decrement" ? -1 : 1;
  const targetVariantIndex = resolveVariantIndex(input.variant, variants);

  if (variants.length > 1 && targetVariantIndex === null) {
    return {
      ok: false,
      slug: canonicalSlug,
      variant: input.variant,
      quantity,
      message:
        "No se pudo identificar la variante para ajustar stock. Recarga la pagina y vuelve a intentar.",
    };
  }

  if (targetVariantIndex !== null) {
    const targetVariant = variants[targetVariantIndex];
    if (
      input.direction === "decrement" &&
      typeof targetVariant.stock === "number" &&
      targetVariant.stock < quantity
    ) {
      return {
        ok: false,
        slug: canonicalSlug,
        variant: targetVariant.name,
        quantity,
        message: `Sin stock suficiente en ${targetVariant.name}.`,
      };
    }

    if (typeof targetVariant.stock === "number") {
      targetVariant.stock = Math.max(0, targetVariant.stock + directionMultiplier * quantity);
    }
  }

  const currentTotal = parseNonNegativeInt(currentState.total_stock);
  let nextTotal: number | null = currentTotal;

  if (typeof currentTotal === "number") {
    if (input.direction === "decrement" && currentTotal < quantity) {
      return {
        ok: false,
        slug: canonicalSlug,
        variant: input.variant,
        quantity,
        message: "Sin stock total suficiente para completar el pedido.",
      };
    }
    nextTotal = Math.max(0, currentTotal + directionMultiplier * quantity);
  } else {
    nextTotal = calculateTotalStockFromVariants(variants);
  }

  await saveRuntimeState({
    product_slug: canonicalSlug,
    total_stock: nextTotal,
    variants,
    updated_by: input.updated_by || "system",
  });

  return {
    ok: true,
    slug: canonicalSlug,
    variant:
      targetVariantIndex !== null ? variants[targetVariantIndex].name : input.variant,
    quantity,
  };
}

export async function getCatalogStockState(input: {
  slug: string;
  product?: Product | null;
}): Promise<CatalogStockState> {
  const normalizedSlug = normalizeSlug(input.slug);
  const lookupSlugs = getProductSlugLookupCandidates(normalizedSlug);
  const runtimeFetch = await fetchRuntimeRowsBySlugs(lookupSlugs);
  const runtimeRow = pickRuntimeRow(lookupSlugs, runtimeFetch.rowsBySlug);
  const manualSnapshot = getFallbackManualSnapshot(lookupSlugs);

  return buildCatalogStateFromFallback({
    slug: normalizedSlug,
    product: input.product || null,
    runtimeRow,
    manualSnapshot,
  });
}

export async function getCatalogVersionToken(): Promise<{
  version: string;
  updated_at: string | null;
}> {
  if (!isSupabaseAdminConfigured) {
    const latest = PRODUCTS.reduce<string | null>((current, product) => {
      const candidate = String(product.updated_at || "").trim();
      if (!candidate) return current;
      if (!current) return candidate;
      return Date.parse(candidate) > Date.parse(current) ? candidate : current;
    }, null);

    return {
      version: latest ? String(Date.parse(latest)) : "0",
      updated_at: latest,
    };
  }

  const latestProductsPromise = supabaseAdmin
    .from("products")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);

  const latestRuntimePromise = supabaseAdmin
    .from(CATALOG_RUNTIME_TABLE)
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);

  const [productsResult, runtimeResult] = await Promise.all([
    latestProductsPromise,
    latestRuntimePromise,
  ]);

  const productUpdatedAt =
    productsResult.data && productsResult.data.length
      ? String((productsResult.data[0] as Record<string, unknown>).updated_at || "").trim() ||
        null
      : null;

  let runtimeUpdatedAt: string | null = null;
  if (!runtimeResult.error && runtimeResult.data && runtimeResult.data.length) {
    runtimeUpdatedAt =
      String((runtimeResult.data[0] as Record<string, unknown>).updated_at || "").trim() ||
      null;
  }

  const candidates = [productUpdatedAt, runtimeUpdatedAt].filter(
    (value): value is string => Boolean(value)
  );
  if (!candidates.length) {
    return { version: "0", updated_at: null };
  }

  const latest = candidates.reduce((current, candidate) => {
    return Date.parse(candidate) > Date.parse(current) ? candidate : current;
  });

  return {
    version: String(Date.parse(latest)),
    updated_at: latest,
  };
}

export async function listCatalogControlProducts(): Promise<CatalogControlSnapshot> {
  let products: ResolvedProduct[] = [];

  if (!isSupabaseAdminConfigured) {
    products = PRODUCTS.filter((product) => product.is_active).map((product) => ({
      id: product.id,
      slug: normalizeSlug(product.slug),
      name: product.name,
      price: Math.max(0, Number(product.price) || 0),
      compare_at_price: parseNonNegativeInt(product.compare_at_price),
      images: Array.isArray(product.images) ? product.images : [],
      variants: Array.isArray(product.variants) ? product.variants : [],
      updated_at: String(product.updated_at || "").trim() || null,
    }));
  } else {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id,slug,name,price,compare_at_price,images,variants,updated_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !data) {
      throw new Error(`No se pudo cargar el catalogo: ${error?.message || "unknown_error"}`);
    }

    products = (data as Record<string, unknown>[]).map((record) =>
      toResolvedProduct(record)
    );
  }

  const runtimeFetch = await fetchRuntimeRowsBySlugs(products.map((product) => product.slug));
  const versionState = await getCatalogVersionToken();

  const controlProducts: CatalogControlProduct[] = products.map((product) => {
    const runtimeRow = runtimeFetch.rowsBySlug.get(product.slug) || null;
    const manualSnapshot = getManualStockSnapshot(product.slug);
    const state = buildCatalogStateFromFallback({
      slug: product.slug,
      product,
      runtimeRow,
      manualSnapshot,
    });

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] || null,
      price: product.price,
      compare_at_price: product.compare_at_price,
      discount_percent: calculateDiscountPercent(product.price, product.compare_at_price),
      total_stock:
        typeof state.total_stock === "number"
          ? state.total_stock
          : calculateTotalStockFromVariants(state.variants),
      variants: state.variants,
      updated_at: state.updated_at || product.updated_at || versionState.updated_at,
    };
  });

  return {
    version: versionState.version,
    updated_at: versionState.updated_at,
    runtime_table_ready: runtimeFetch.tableReady,
    products: controlProducts,
  };
}

export async function updateCatalogControlProduct(
  input: CatalogControlUpdateInput
): Promise<CatalogControlProduct> {
  if (!isSupabaseAdminConfigured) {
    throw new Error("El panel de catalogo requiere Supabase configurado.");
  }

  const normalizedSlug = normalizeSlug(input.slug);
  if (!normalizedSlug) {
    throw new Error("Slug de producto invalido.");
  }

  const lookupSlugs = getProductSlugLookupCandidates(normalizedSlug);
  const { data: candidateRows, error: candidateError } = await supabaseAdmin
    .from("products")
    .select("id,slug,name,price,compare_at_price,images,variants,updated_at")
    .in("slug", lookupSlugs)
    .eq("is_active", true);

  if (candidateError || !candidateRows?.length) {
    throw new Error("No se encontro el producto a actualizar.");
  }

  const resolvedCandidates = (candidateRows as Record<string, unknown>[]).map((row) =>
    toResolvedProduct(row)
  );
  let selected = resolvedCandidates[0];
  for (const lookupSlug of lookupSlugs) {
    const match = resolvedCandidates.find((row) => row.slug === lookupSlug);
    if (match) {
      selected = match;
      break;
    }
  }

  const nextPrice = Math.max(0, Math.floor(Number(input.price) || 0));
  const nextCompareAt =
    input.compare_at_price === null || input.compare_at_price === undefined
      ? null
      : Math.max(nextPrice, Math.floor(Number(input.compare_at_price) || 0));

  const { data: updatedProductData, error: updateProductError } = await supabaseAdmin
    .from("products")
    .update({
      price: nextPrice,
      compare_at_price: nextCompareAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", selected.id)
    .select("id,slug,name,price,compare_at_price,images,variants,updated_at")
    .single();

  if (updateProductError || !updatedProductData) {
    throw new Error(
      `No se pudo actualizar el precio del producto: ${updateProductError?.message || "unknown_error"}`
    );
  }

  const sanitizedVariants = dedupeVariantRows(
    (Array.isArray(input.variants) ? input.variants : []).map((variant) => ({
      name: String(variant.name || "").trim(),
      stock: parseNonNegativeInt(variant.stock),
      variation_id:
        typeof variant.variation_id === "number" && Number.isFinite(variant.variation_id)
          ? Math.floor(variant.variation_id)
          : null,
    }))
  );

  const sanitizedTotal =
    input.total_stock === null || input.total_stock === undefined
      ? calculateTotalStockFromVariants(sanitizedVariants)
      : Math.max(0, Math.floor(Number(input.total_stock) || 0));

  await saveRuntimeState({
    product_slug: normalizeSlug(updatedProductData.slug as string),
    total_stock: sanitizedTotal,
    variants: sanitizedVariants,
    updated_by: input.updated_by || "admin_panel",
  });

  const updatedProduct = toResolvedProduct(updatedProductData as Record<string, unknown>);

  return {
    id: updatedProduct.id,
    slug: updatedProduct.slug,
    name: updatedProduct.name,
    image: updatedProduct.images[0] || null,
    price: updatedProduct.price,
    compare_at_price: updatedProduct.compare_at_price,
    discount_percent: calculateDiscountPercent(
      updatedProduct.price,
      updatedProduct.compare_at_price
    ),
    total_stock: sanitizedTotal,
    variants: sanitizedVariants,
    updated_at: new Date().toISOString(),
  };
}

export async function reserveCatalogStock(
  items: CatalogStockAdjustmentItem[]
): Promise<CatalogReserveStockResult> {
  const grouped = new Map<string, CatalogStockAdjustmentItem>();

  for (const rawItem of items) {
    const slug = normalizeSlug(rawItem.slug);
    const quantity = Math.max(0, Math.floor(Number(rawItem.quantity) || 0));
    if (!slug || !quantity) continue;

    const variant = rawItem.variant ? String(rawItem.variant).trim() : null;
    const key = `${slug}::${normalizeText(variant || "")}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.quantity += quantity;
    } else {
      grouped.set(key, {
        slug,
        variant,
        quantity,
        product_name: rawItem.product_name,
      });
    }
  }

  const reservations: CatalogStockReservation[] = [];

  for (const item of grouped.values()) {
    const mutation = await mutateSingleStock({
      slug: item.slug,
      variant: item.variant,
      quantity: item.quantity,
      direction: "decrement",
      updated_by: "checkout",
    });

    if (!mutation.ok) {
      await restoreCatalogStock(reservations);
      return {
        ok: false,
        reservations: [],
        message: mutation.message || "No se pudo reservar stock para el pedido.",
      };
    }

    reservations.push({
      slug: mutation.slug,
      variant: mutation.variant,
      quantity: mutation.quantity,
    });
  }

  return {
    ok: true,
    reservations,
  };
}

export async function restoreCatalogStock(
  reservations: CatalogStockReservation[]
): Promise<void> {
  for (const reservation of reservations) {
    try {
      await mutateSingleStock({
        slug: reservation.slug,
        variant: reservation.variant,
        quantity: reservation.quantity,
        direction: "increment",
        updated_by: "checkout_rollback",
      });
    } catch (error) {
      console.error("[CatalogStock] Error restoring stock:", error);
    }
  }
}
