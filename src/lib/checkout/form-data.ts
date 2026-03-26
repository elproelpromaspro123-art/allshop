import type { CheckoutFormData } from "@/lib/validation";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getCheckoutFormDataFromPayload(
  input: {
    payer?: Partial<
      Pick<CheckoutFormData, "name" | "email" | "phone" | "document">
    >;
    shipping?: Partial<
      Pick<
        CheckoutFormData,
        "address" | "reference" | "city" | "department" | "zip"
      >
    >;
  } | null | undefined,
): CheckoutFormData {
  const payload = isRecord(input) ? input : {};
  const payer = isRecord(payload.payer) ? payload.payer : {};
  const shipping = isRecord(payload.shipping) ? payload.shipping : {};

  return {
    name: String(payer.name || ""),
    email: String(payer.email || ""),
    phone: String(payer.phone || ""),
    document: String(payer.document || ""),
    address: String(shipping.address || ""),
    reference: String(shipping.reference || ""),
    city: String(shipping.city || ""),
    department: String(shipping.department || ""),
    zip: String(shipping.zip || ""),
  };
}
