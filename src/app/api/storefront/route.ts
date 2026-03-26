import { apiError, apiOkFields } from "@/lib/api-response";
import { getCategories, getFeaturedProducts } from "@/lib/db";

export const revalidate = 60;

export async function GET() {
  try {
    const [categories, featuredProducts] = await Promise.all([
      getCategories(),
      getFeaturedProducts(),
    ]);

    return apiOkFields(
      {
        categories,
        featuredProducts,
        generatedAt: new Date().toISOString(),
        summary: {
          categoryCount: categories.length,
          featuredCount: featuredProducts.length,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("[Storefront API] Error:", error);
    return apiError("No se pudo cargar el storefront.", {
      status: 500,
      code: "STOREFRONT_FAILED",
    });
  }
}
