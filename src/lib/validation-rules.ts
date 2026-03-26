/**
 * Validation rules for forms
 */

export const rules = {
  required: (value: string) => !!value?.trim() || "Este campo es requerido",
  
  email: (value: string) => 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Ingresa un email válido",
  
  minLength: (min: number) => (value: string) =>
    value.length >= min || `Mínimo ${min} caracteres`,
  
  maxLength: (max: number) => (value: string) =>
    value.length <= max || `Máximo ${max} caracteres`,
  
  phone: (value: string) =>
    /^\d{10}$/.test(value.replace(/\D/g, "")) || "Ingresa un teléfono válido",
  
  document: (value: string) => 
    /^\d{6,10}$/.test(value.replace(/\D/g, "")) || "Ingresa un documento válido",
  
  url: (value: string) =>
    /^https?:\/\/.+/.test(value) || "Ingresa una URL válida",
  
  positiveNumber: (value: string) =>
    Number(value) > 0 || "Debe ser un número positivo",
  
  minValue: (min: number) => (value: string) =>
    Number(value) >= min || `Mínimo valor: ${min}`,
  
  maxValue: (max: number) => (value: string) =>
    Number(value) <= max || `Máximo valor: ${max}`,
};

export type ValidationRule = (value: string) => string | true;

export function validate(value: string, ruleSet: ValidationRule[]): string | true {
  for (const rule of ruleSet) {
    const result = rule(value);
    if (result !== true) return result;
  }
  return true;
}