import { supabase, isSupabaseClientConfigured } from "./supabase";
import { PRODUCTS, CATEGORIES } from "@/data/mock";
import type { Product, Category } from "@/types";

function isSupabaseConfigured(): boolean {
  return isSupabaseClientConfigured;
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
  if (!isSupabaseConfigured()) return PRODUCTS.filter((p) => p.is_active);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return PRODUCTS.filter((p) => p.is_active);
  return data as Product[];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return PRODUCTS.filter((p) => p.is_featured && p.is_active);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return PRODUCTS.filter((p) => p.is_featured && p.is_active);
  return data as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return PRODUCTS.find((p) => p.slug === slug && p.is_active) ?? null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return PRODUCTS.find((p) => p.slug === slug) ?? null;
  return data as Product;
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return PRODUCTS.filter((p) => p.category_id === categoryId && p.is_active);
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return PRODUCTS.filter((p) => p.category_id === categoryId && p.is_active);
  }
  return data as Product[];
}

export async function getProductSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return PRODUCTS.map((p) => p.slug);

  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .eq("is_active", true);

  if (error || !data) return PRODUCTS.map((p) => p.slug);
  return (data as { slug: string }[]).map((p) => p.slug);
}

export async function getCategorySlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return CATEGORIES.map((c) => c.slug);

  const { data, error } = await supabase
    .from("categories")
    .select("slug");

  if (error || !data) return CATEGORIES.map((c) => c.slug);
  return (data as { slug: string }[]).map((c) => c.slug);
}
