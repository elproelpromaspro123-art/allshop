import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { generateCsrfToken, isCsrfSecretConfigured } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production" && !isCsrfSecretConfigured()) {
    return apiError(
      "Falta CSRF_SECRET (o ORDER_LOOKUP_SECRET) en producción. No se puede emitir token CSRF.",
      {
        status: 500,
        code: "CSRF_SECRET_MISSING",
        headers: noStoreHeaders(),
      },
    );
  }

  try {
    const token = generateCsrfToken();
    return apiOkFields(
      { csrfToken: token },
      {
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error("[CSRF] Failed to generate token:", error);
    return apiError("No se pudo generar el token CSRF.", {
      status: 500,
      code: "CSRF_TOKEN_GENERATION_FAILED",
      headers: noStoreHeaders(),
    });
  }
}
