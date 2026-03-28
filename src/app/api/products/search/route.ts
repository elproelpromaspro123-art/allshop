import { apiError, apiOkFields } from "@/lib/api-response";
import { getCategories, getProducts } from "@/lib/db";
import type { SearchCategoryFacet, SearchProductResult } from "@/types/api";

export const dynamic = "force-dynamic";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toSafeImages(images: string[] | null | undefined): string[] {
  return Array.isArray(images) ? images.filter(Boolean).slice(0, 1) : [];
}

interface RankedSearchProduct extends SearchProductResult {
  score: number;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(999, score));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = String(url.searchParams.get("q") || "").trim();
    const normalizedQuery = normalizeText(query);
    const limitParam = Number(url.searchParams.get("limit") || 12);
    const limit = Math.max(1, Math.min(24, Number.isFinite(limitParam) ? limitParam : 12));

    const [products, categories] = await Promise.all([getProducts(), getCategories()]);

    const categoriesById = new Map(
      categories.map((category) => [
        category.id,
        {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
      ]),
    );

    const rankedCandidates: Array<RankedSearchProduct | null> = products
      .map((product) => {
        const normalizedName = normalizeText(product.name);
        const normalizedDescription = normalizeText(product.description || "");
        const category = categoriesById.get(product.category_id);
        const normalizedCategoryName = normalizeText(category?.name || "");
        const normalizedCategorySlug = normalizeText(category?.slug || "");

        let score = 0;
        let matchedQuery = !normalizedQuery;
        if (!normalizedQuery) {
          score += product.is_featured ? 4 : 0;
          score += product.is_bestseller ? 3 : 0;
          score += Math.min(product.reviews_count || 0, 20);
          score += Math.min(Math.round(product.average_rating || 0) * 2, 10);
        } else {
          if (normalizedName === normalizedQuery) {
            score += 140;
            matchedQuery = true;
          }
          if (normalizedName.startsWith(normalizedQuery)) {
            score += 90;
            matchedQuery = true;
          }
          if (normalizedName.includes(normalizedQuery)) {
            score += 55;
            matchedQuery = true;
          }
          if (normalizedCategoryName === normalizedQuery) {
            score += 70;
            matchedQuery = true;
          }
          if (normalizedCategoryName.startsWith(normalizedQuery)) {
            score += 35;
            matchedQuery = true;
          }
          if (normalizedCategorySlug.includes(normalizedQuery)) {
            score += 24;
            matchedQuery = true;
          }
          if (normalizedDescription.includes(normalizedQuery)) {
            score += 18;
            matchedQuery = true;
          }

          if (!matchedQuery) {
            return null;
          }

          if (product.is_featured) score += 8;
          if (product.is_bestseller) score += 6;
          score += Math.min(product.reviews_count || 0, 20);
          score += Math.min(Math.round(product.average_rating || 0) * 2, 10);
        }

        return {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          images: toSafeImages(product.images),
          category_id: product.category_id,
          category_name: category?.name || "Catalogo",
          category_slug: category?.slug || "",
          is_featured: Boolean(product.is_featured),
          is_bestseller: Boolean(product.is_bestseller),
          reviews_count: Number(product.reviews_count || 0),
          average_rating: Number(product.average_rating || 0),
          free_shipping: Boolean(product.free_shipping),
          stock_location: product.stock_location || "nacional",
          score: clampScore(score),
        };
      });

    const matchedProducts = rankedCandidates
      .filter((product): product is RankedSearchProduct => Boolean(product))
      .sort((left, right) => right.score - left.score)
      .map((product) => product);

    const categoryCounts = new Map<string, SearchCategoryFacet>();
    for (const product of matchedProducts) {
      if (!product.category_id) continue;
      const current = categoryCounts.get(product.category_id);
      if (current) {
        current.count += 1;
        continue;
      }

      categoryCounts.set(product.category_id, {
        id: product.category_id,
        name: product.category_name,
        slug: product.category_slug,
        count: 1,
      });
    }

    const categoryFacets = Array.from(categoryCounts.values())
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
      .slice(0, 4);
    const rankedProducts = matchedProducts.slice(0, limit);

    return apiOkFields(
      {
        products: rankedProducts,
        categories: categoryFacets,
        query,
        count: matchedProducts.length,
      },
      {
        headers: {
          "Cache-Control": normalizedQuery
            ? "public, s-maxage=60, stale-while-revalidate=120"
            : "public, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("Search API error:", error);
    return apiError("Error al buscar productos.", {
      status: 500,
      code: "SEARCH_FAILED",
    });
  }
}
