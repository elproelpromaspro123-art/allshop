import type { ShippingType } from "@/types/database";
import {
  getCheckoutFormDataFromPayload,
  type CheckoutFormData,
  validateAllFields,
  validateCheckoutConfirmations,
} from "@/lib/validation";

export interface CheckoutItemInput {
  id: string;
  slug?: string | null;
  quantity: number;
  variant?: string | null;
}

export interface CheckoutVerificationInput {
  address_confirmed?: boolean;
  availability_confirmed?: boolean;
  product_acknowledged?: boolean;
}

export interface CheckoutPricingInput {
  display_currency?: string;
  display_locale?: string;
  country_code?: string;
  display_rate?: number;
}

export interface CheckoutShippingInput {
  address: string;
  reference?: string;
  city: string;
  department: string;
  zip?: string;
  type: ShippingType;
  cost?: number;
  carrier_code?: string | null;
  carrier_name?: string | null;
  insured?: boolean;
  eta_min_days?: number | null;
  eta_max_days?: number | null;
  eta_range?: string | null;
}

export interface CheckoutPayerInput {
  name: string;
  email: string;
  phone: string;
  document: string;
}

export interface CheckoutBody {
  items: CheckoutItemInput[];
  payer: CheckoutPayerInput;
  shipping: CheckoutShippingInput;
  verification?: CheckoutVerificationInput;
  pricing?: CheckoutPricingInput;
}

export interface CheckoutValidationResult {
  formData: CheckoutFormData;
  fieldErrors: Record<string, string>;
  verificationError: string | null;
  shippingTypeError: string | null;
}

export interface CheckoutSuccessResponse {
  ok: true;
  order_id: string;
  order_token?: string | null;
  status: string;
  fulfillment_triggered: boolean;
  redirect_url: string;
  idempotent_replay?: boolean;
}

export interface CheckoutErrorResponse {
  ok: false;
  error: string;
  code?: string;
  retryAfterSeconds?: number;
  field_errors?: Record<string, string>;
  server_total?: number;
}

export function validateCheckoutBody(
  body: CheckoutBody,
): CheckoutValidationResult {
  const formData = getCheckoutFormDataFromPayload(body);

  return {
    formData,
    fieldErrors: validateAllFields(formData),
    verificationError: validateCheckoutConfirmations(body?.verification),
    shippingTypeError:
      body?.shipping?.type === "nacional"
        ? null
        : "Solo esta disponible el envio nacional contra entrega.",
  };
}
