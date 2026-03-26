import { apiError, noStoreHeaders } from "@/lib/api-response";

/**
 * Deprecated endpoint.
 * Resend confirmation code is no longer used in the current checkout model.
 */
export async function POST() {
  return apiError(
    "Este endpoint fue deshabilitado. El flujo actual no usa confirmación manual por correo.",
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
    "Este endpoint fue deshabilitado. El flujo actual no usa confirmación manual por correo.",
    {
      status: 410,
      code: "DEPRECATED_ENDPOINT",
      fields: { deprecated: true },
      headers: noStoreHeaders(),
    },
  );
}
