import { supabase, isSupabaseClientConfigured } from "./supabase";
import { PRODUCTS, CATEGORIES } from "@/data/mock";
import { MOCK_REVIEWS_BY_PRODUCT_ID } from "@/data/mock-reviews";
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

function normalizeProductList(products: Product[]): Product[] {
  return products.map((product) => normalizeProductImages(product));
}

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return CATEGORIES;

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error || !data) return CATEGORIES;
  return data as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isSupabaseConfigured()) {
    return CATEGORIES.find((c) => c.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return CATEGORIES.find((c) => c.slug === slug) ?? null;
  return data as Category;
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return normalizeProductList(PRODUCTS.filter((p) => p.is_active));
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return normalizeProductList(PRODUCTS.filter((p) => p.is_active));
  }
  return normalizeProductList(data as Product[]);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return normalizeProductList(
      PRODUCTS.filter((p) => p.is_featured && p.is_active)
    );
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return normalizeProductList(
      PRODUCTS.filter((p) => p.is_featured && p.is_active)
    );
  }
  return normalizeProductList(data as Product[]);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const slugCandidates = getProductSlugLookupCandidates(slug);
  const lookupSlugs = slugCandidates.length
    ? slugCandidates
    : [String(slug || "").trim().toLowerCase()].filter(Boolean);

  if (!isSupabaseConfigured()) {
    const product =
      PRODUCTS.find(
        (p) => p.is_active && lookupSlugs.includes(String(p.slug || "").trim().toLowerCase())
      ) ?? null;
    return product ? normalizeProductImages(product) : null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("slug", lookupSlugs)
    .eq("is_active", true);

  if (error || !data?.length) {
    const fallback =
      PRODUCTS.find((p) =>
        lookupSlugs.includes(String(p.slug || "").trim().toLowerCase())
      ) ?? null;
    return fallback ? normalizeProductImages(fallback) : null;
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
    return normalizeProductList(
      PRODUCTS.filter((p) => p.category_id === categoryId && p.is_active)
    );
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return normalizeProductList(
      PRODUCTS.filter((p) => p.category_id === categoryId && p.is_active)
    );
  }
  return normalizeProductList(data as Product[]);
}

export async function getProductSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return Array.from(new Set(PRODUCTS.map((p) => normalizeProductSlug(p.slug) || p.slug)));
  }

  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .eq("is_active", true);

  if (error || !data) {
    return Array.from(new Set(PRODUCTS.map((p) => normalizeProductSlug(p.slug) || p.slug)));
  }
  return Array.from(
    new Set(
      (data as { slug: string }[]).map((p) => normalizeProductSlug(p.slug) || p.slug)
    )
  );
}

export async function getCategorySlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return CATEGORIES.map((c) => c.slug);

  const { data, error } = await supabase
    .from("categories")
    .select("slug");

  if (error || !data) return CATEGORIES.map((c) => c.slug);
  return (data as { slug: string }[]).map((c) => c.slug);
}

export async function getVerifiedReviewsByProductId(
  productId: string,
  limit = 8
): Promise<ProductReview[]> {
  if (!isSupabaseConfigured()) {
    return (MOCK_REVIEWS_BY_PRODUCT_ID[productId] || []).slice(0, limit);
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
