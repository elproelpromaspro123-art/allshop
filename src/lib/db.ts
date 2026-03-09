import { supabase, isSupabaseClientConfigured } from "./supabase";
import { normalizeLegacyImagePaths } from "@/lib/image-paths";
import {
  getProductSlugLookupCandidates,
  normalizeProductSlug,
} from "@/lib/legacy-product-slugs";
import type { Product, Category, ProductReview } from "@/types";

function isSupabaseConfigured(): boolean {
  return isSupabaseClientConfigured;
}

function normalizeProductImages(product: Product): Product {
  const normalizedSlug = normalizeProductSlug(product.slug) || product.slug;
  return {
    ...product,
    slug: normalizedSlug,
    images: normalizeLegacyImagePaths(product.images),
  };
}

interface CanonicalProductEntry {
  product: Product;
  sourceSlug: string;
}

function toSafeTimestamp(value: string | null | undefined): number {
  const parsed = Date.parse(String(value || ""));
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
}

function choosePreferredCanonicalProduct(
  current: CanonicalProductEntry,
  candidate: CanonicalProductEntry
): CanonicalProductEntry {
  const currentCanonicalSlug = String(current.product.slug || "").trim().toLowerCase();
  const candidateCanonicalSlug = String(candidate.product.slug || "")
    .trim()
    .toLowerCase();

  const currentIsCanonicalSource = current.sourceSlug === currentCanonicalSlug;
  const candidateIsCanonicalSource = candidate.sourceSlug === candidateCanonicalSlug;

  if (candidateIsCanonicalSource && !currentIsCanonicalSource) return candidate;
  if (currentIsCanonicalSource && !candidateIsCanonicalSource) return current;

  const currentUpdatedAt = Math.max(
    toSafeTimestamp(current.product.updated_at),
    toSafeTimestamp(current.product.created_at)
  );
  const candidateUpdatedAt = Math.max(
    toSafeTimestamp(candidate.product.updated_at),
    toSafeTimestamp(candidate.product.created_at)
  );

  if (candidateUpdatedAt > currentUpdatedAt) return candidate;

  const currentImages = Array.isArray(current.product.images)
    ? current.product.images.length
    : 0;
  const candidateImages = Array.isArray(candidate.product.images)
    ? candidate.product.images.length
    : 0;

  if (candidateImages > currentImages) return candidate;

  return current;
}

function normalizeAndDedupeProducts(products: Product[]): Product[] {
  const productsByCanonicalSlug = new Map<string, CanonicalProductEntry>();

  for (const product of products) {
    const sourceSlug = String(product.slug || "").trim().toLowerCase();
    const normalizedProduct = normalizeProductImages(product);
    const canonicalSlug = String(normalizedProduct.slug || "").trim().toLowerCase();
    if (!canonicalSlug) continue;

    const current = productsByCanonicalSlug.get(canonicalSlug);
    const candidate: CanonicalProductEntry = {
      product: normalizedProduct,
      sourceSlug,
    };

    if (!current) {
      productsByCanonicalSlug.set(canonicalSlug, candidate);
      continue;
    }

    productsByCanonicalSlug.set(
      canonicalSlug,
      choosePreferredCanonicalProduct(current, candidate)
    );
  }

  return Array.from(productsByCanonicalSlug.values()).map((entry) => entry.product);
}

function normalizeProductList(products: Product[]): Product[] {
  return normalizeAndDedupeProducts(products);
}

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error || !data) return [];
  return data as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data as Category;
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }
  return normalizeProductList(data as Product[]);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }
  return normalizeProductList(data as Product[]);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const slugCandidates = getProductSlugLookupCandidates(slug);
  const lookupSlugs = slugCandidates.length
    ? slugCandidates
    : [String(slug || "").trim().toLowerCase()].filter(Boolean);

  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("slug", lookupSlugs)
    .eq("is_active", true);

  if (error || !data?.length) {
    return null;
  }

  const productRows = data as Product[];
  const selected =
    lookupSlugs
      .map((candidate) =>
        productRows.find((row) => String(row.slug || "").trim().toLowerCase() === candidate)
      )
      .find((row): row is Product => Boolean(row)) || productRows[0];

  return normalizeProductImages(selected);
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }
  return normalizeProductList(data as Product[]);
}

export async function getProductSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .eq("is_active", true);

  if (error || !data) {
    return [];
  }
  return Array.from(
    new Set(
      (data as { slug: string }[]).map((p) => normalizeProductSlug(p.slug) || p.slug)
    )
  );
}

export async function getCategorySlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("slug");

  if (error || !data) return [];
  return (data as { slug: string }[]).map((c) => c.slug);
}

export async function getVerifiedReviewsByProductId(
  productId: string,
  limit = 8
): Promise<ProductReview[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("is_verified_purchase", true)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as ProductReview[];
}
