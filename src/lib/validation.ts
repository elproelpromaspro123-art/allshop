import {
  COLOMBIA_DEPARTMENTS,
  normalizeDepartment,
} from "@/lib/delivery";

/**
 * Checkout form validation utilities.
 * Provides field-level validation with user-friendly Spanish error messages.
 */

export interface FieldError {
  field: string;
  message: string;
}

export interface CheckoutVerificationState {
  addressConfirmed: boolean;
  availabilityConfirmed: boolean;
  productAcknowledged: boolean;
}

export interface CheckoutVerificationPayload {
  address_confirmed?: boolean;
  availability_confirmed?: boolean;
  product_acknowledged?: boolean;
}

export type CheckoutFormData = {
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  reference: string;
  city: string;
  department: string;
  zip: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_REGEX = /^\d{7,15}$/;

export function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "El nombre completo es obligatorio.";
  if (trimmed.length < 6)
    return "Ingresa tu nombre completo (min. 6 caracteres).";
  if (trimmed.length > 120) return "El nombre es demasiado largo.";
  return null;
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "El correo electrónico es obligatorio.";
  if (!EMAIL_REGEX.test(trimmed))
    return "Ingresa un correo electrónico válido.";
  return null;
}

export function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "El número de teléfono es obligatorio.";
  if (!PHONE_DIGITS_REGEX.test(digits))
    return "El teléfono debe tener entre 7 y 15 dígitos.";
  return null;
}

export function validateDocument(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "El número de documento es obligatorio.";
  if (digits.length < 6) return "El documento debe tener al menos 6 dígitos.";
  if (digits.length > 15) return "El documento es demasiado largo.";
  return null;
}

export function validateAddress(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "La dirección es obligatoria.";
  if (trimmed.length < 12)
    return "La dirección debe ser más específica (min. 12 caracteres).";
  if (trimmed.length > 500) return "La dirección es demasiado larga.";
  return null;
}

export function validateReference(value: string): string | null {
  if (value.trim().length > 160) return "La referencia es demasiado larga.";
  return null;
}

export function validateCity(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "La ciudad es obligatoria.";
  if (trimmed.length < 3) return "Ingresa el nombre completo de la ciudad.";
  if (trimmed.length > 100) return "La ciudad es demasiado larga.";
  return null;
}

export function validateDepartment(value: string): string | null {
  const normalized = normalizeDepartment(value);
  if (!normalized) return "Selecciona un departamento.";

  const isKnownDepartment = COLOMBIA_DEPARTMENTS.some(
    (department) => normalizeDepartment(department) === normalized,
  );
  if (!isKnownDepartment) return "Selecciona un departamento válido.";

  return null;
}

export function getCheckoutFormDataFromPayload(input: {
  payer?: Partial<
    Pick<CheckoutFormData, "name" | "email" | "phone" | "document">
  >;
  shipping?: Partial<
    Pick<
      CheckoutFormData,
      "address" | "reference" | "city" | "department" | "zip"
    >
  >;
}): CheckoutFormData {
  return {
    name: String(input.payer?.name || ""),
    email: String(input.payer?.email || ""),
    phone: String(input.payer?.phone || ""),
    document: String(input.payer?.document || ""),
    address: String(input.shipping?.address || ""),
    reference: String(input.shipping?.reference || ""),
    city: String(input.shipping?.city || ""),
    department: String(input.shipping?.department || ""),
    zip: String(input.shipping?.zip || ""),
  };
}

export function normalizeCheckoutConfirmations(
  value: CheckoutVerificationState | CheckoutVerificationPayload | undefined,
): CheckoutVerificationState {
  const normalizedValue =
    value as
      | Partial<CheckoutVerificationState & CheckoutVerificationPayload>
      | undefined;

  return {
    addressConfirmed:
      normalizedValue?.addressConfirmed === true ||
      normalizedValue?.address_confirmed === true,
    availabilityConfirmed:
      normalizedValue?.availabilityConfirmed === true ||
      normalizedValue?.availability_confirmed === true,
    productAcknowledged:
      normalizedValue?.productAcknowledged === true ||
      normalizedValue?.product_acknowledged === true,
  };
}

export function validateCheckoutConfirmations(
  value: CheckoutVerificationState | CheckoutVerificationPayload | undefined,
): string | null {
  const normalized = normalizeCheckoutConfirmations(value);

  if (
    normalized.addressConfirmed &&
    normalized.availabilityConfirmed &&
    normalized.productAcknowledged
  ) {
    return null;
  }

  if (!normalized.addressConfirmed) {
    return "Debes confirmar que la dirección de entrega está correcta.";
  }

  if (!normalized.availabilityConfirmed) {
    return "Debes confirmar disponibilidad para recibir el pedido.";
  }

  return "Debes confirmar que revisaste los productos antes de continuar.";
}

const FIELD_VALIDATORS: Record<
  keyof Omit<CheckoutFormData, "zip" | "reference">,
  (value: string) => string | null
> = {
  name: validateName,
  email: validateEmail,
  phone: validatePhone,
  document: validateDocument,
  address: validateAddress,
  city: validateCity,
  department: validateDepartment,
};

export function validateField(
  field: keyof CheckoutFormData,
  value: string,
): string | null {
  const validator = FIELD_VALIDATORS[field as keyof typeof FIELD_VALIDATORS];
  if (!validator) return null;
  return validator(value);
}

export function validateAllFields(
  data: CheckoutFormData,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, validator] of Object.entries(FIELD_VALIDATORS)) {
    const error = validator(data[field as keyof CheckoutFormData]);
    if (error) errors[field] = error;
  }
  return errors;
}
