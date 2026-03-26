/**
 * Additional validation utilities complementing validation.ts
 */

/**
 * Validate Colombian phone number (10 digits, starts with 3)
 */
export function isValidColombianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 && /^[3]/.test(digits);
}

/**
 * Validate Colombian document (CC 6-10 digits, NIT 9 digits)
 */
export function isValidDocument(doc: string): boolean {
  const digits = doc.replace(/\D/g, "");
  return (digits.length >= 6 && digits.length <= 10) || digits.length === 9;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength requirements
 */
export interface PasswordStrengthResult {
  isValid: boolean;
  score: number;
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("Mínimo 8 caracteres");
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Al menos una letra minúscula");
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Al menos una letra mayúscula");
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push("Al menos un número");
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Al menos un caracteres especial");
  }

  return {
    isValid: score >= 4 && password.length >= 8,
    score,
    feedback,
  };
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate credit card number (basic Luhn check)
 */
export function isValidCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate IP address format
 */
export function isValidIpAddress(ip: string): boolean {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i;
  return ipv4.test(ip) || ipv6.test(ip);
}

/**
 * Validate UUID v4 format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
}

/**
 * Validate coordinate format
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}