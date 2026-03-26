import { apiError, noStoreHeaders } from "@/lib/api-response";

/**
 * Deprecated endpoint.
 * Order confirmation by email code is no longer part of the active checkout flow.
 */
export async function POST() {
  return apiError(
    "Este endpoint fue deshabilitado. El pedido ahora se confirma directamente en checkout.",
    {
      status: 410,
      code: "DEPRECATED_ENDPOINT",
      fields: { deprecated: true },
      headers: noStoreHeaders(),
    },
  );
}

export async function GET() {
  return apiError(
    "Este endpoint fue deshabilitado. El pedido ahora se confirma directamente en checkout.",
    {
      status: 410,
      code: "DEPRECATED_ENDPOINT",
      fields: { deprecated: true },
      headers: noStoreHeaders(),
    },
  );
}
