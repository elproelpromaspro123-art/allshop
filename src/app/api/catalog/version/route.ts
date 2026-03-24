import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { getCatalogVersionToken } from "@/lib/catalog-runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const payload = await getCatalogVersionToken();
    return apiOkFields(payload, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("[CatalogVersion] Error:", error);
    return apiError("Error al obtener versión del catálogo.", {
      status: 500,
      code: "CATALOG_VERSION_FAILED",
      headers: noStoreHeaders(),
    });
  }
}
