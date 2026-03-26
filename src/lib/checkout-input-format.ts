function digitsOnly(value: string): string {
  return String(value || "").replace(/\D+/g, "");
}

export function formatCheckoutPhoneInput(value: string): string {
  const digits = digitsOnly(value).slice(0, 15);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
}

export function formatCheckoutDocumentInput(value: string): string {
  const digits = digitsOnly(value).slice(0, 15);
  if (!digits) return "";

  const groups: string[] = [];
  for (let index = digits.length; index > 0; index -= 3) {
    groups.unshift(digits.slice(Math.max(0, index - 3), index));
  }
  return groups.join(".");
}

export function formatCheckoutZipInput(value: string): string {
  return digitsOnly(value).slice(0, 6);
}
