import { supabase, isSupabaseClientConfigured } from "./supabase";
import { CATEGORIES, PRODUCTS } from "@/data/mock";
import { normalizeLegacyImagePaths } from "@/lib/image-paths";
import {
  getProductSlugLookupCandidates,
  normalizeProductSlug,
} from "@/lib/legacy-product-slugs";
import type { Product, Category, ProductReview } from "@/types";

function isSupabaseConfigured(): boolean {
  return isSupabaseClientConfigured;
}

function normalizeProductImages(product: any): Product {
  const normalizedSlug = normalizeProductSlug(product.slug) || product.slug;
  
  let reviews_count = product.reviews_count || 0;
  let average_rating = product.average_rating || 0;

  if (Array.isArray(product.product_reviews)) {
    const approved = product.product_reviews.filter((r: any) => r.is_approved);
    reviews_count = approved.length;
    if (reviews_count > 0) {
      average_rating = approved.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews_count;
    }
  }

  const normalized = {
    ...product,
    slug: normalizedSlug,
    images: normalizeLegacyImagePaths(product.images),
    reviews_count,
    average_rating
  };
  delete normalized.product_reviews;
  return normalized;
}

function getMockCategories(): Category[] {
  return CATEGORIES.slice();
}

function getMockProducts(): Product[] {
  return PRODUCTS.filter((product) => product.is_active);
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
  if (!isSupabaseConfigured()) return getMockCategories();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error || !data) return [];
  return data as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isSupabaseConfigured()) {
    const normalized = String(slug || "").trim().toLowerCase();
    if (!normalized) return null;
    return (
      getMockCategories().find(
        (category) => String(category.slug || "").trim().toLowerCase() === normalized
      ) || null
    );
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
    return normalizeProductList(getMockProducts());
  }

  const { data, error } = await supabase
    .from("products")
    .select("*, product_reviews(rating, is_approved)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }
  return normalizeProductList(data as Product[]);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return normalizeProductList(
      getMockProducts().filter((product) => product.is_featured)
    );
  }

  const { data, error } = await supabase
    .from("products")
    .select("*, product_reviews(rating, is_approved)")
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
    const normalizedCandidates = lookupSlugs.length
      ? lookupSlugs
      : [String(slug || "").trim().toLowerCase()].filter(Boolean);
    const mockProducts = getMockProducts().map(normalizeProductImages);
    const match =
      normalizedCandidates
        .map((candidate) =>
          mockProducts.find(
            (product) => String(product.slug || "").trim().toLowerCase() === candidate
          )
        )
        .find((product): product is Product => Boolean(product)) || null;
    return match;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*, product_reviews(rating, is_approved)")
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
    const normalizedId = String(categoryId || "").trim();
    if (!normalizedId) return [];
    return normalizeProductList(
      getMockProducts().filter(
        (product) => String(product.category_id || "").trim() === normalizedId
      )
    );
  }

  const { data, error } = await supabase
    .from("products")
    .select("*, product_reviews(rating, is_approved)")
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
    return Array.from(
      new Set(
        getMockProducts().map((product) =>
          normalizeProductSlug(product.slug) || product.slug
        )
      )
    );
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
  if (!isSupabaseConfigured()) {
    return getMockCategories().map((category) => category.slug);
  }

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
