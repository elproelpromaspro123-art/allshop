/**
 * Constants used across the app
 */

export const APP_NAME = "Vortixy";
export const APP_TAGLINE = "Tu tienda online en Colombia";

export const SHORT_APP_NAME = "Vortixy";

export const DEFAULT_LOCALE = "es-CO";
export const SUPPORTED_LOCALES = ["es-CO", "en-US", "pt-BR"] as const;

export const DEFAULT_CURRENCY = "COP";
export const SUPPORTED_CURRENCIES = ["COP", "USD", "EUR", "MXN", "BRL"] as const;

export const FREE_SHIPPING_THRESHOLD = 150000;

export const CART_ITEM_LIMIT = 10;
export const MAX_QUANTITY_PER_ITEM = 10;

export const CHECKOUT_RESERVATION_MS = 15 * 60 * 1000; // 15 minutes

export const SEARCH_DEBOUNCE_MS = 250;
export const IMAGE_ROTATION_INTERVAL_MS = 3000;

export const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const RATE_LIMIT_MAX_REQUESTS = 100;

export const DEBOUNCE_DELAY_MS = 300;
export const TOAST_DURATION_MS = 4000;

export const SEO_DEFAULT_TITLE = "Vortixy - Tu tienda online en Colombia";
export const SEO_DEFAULT_DESCRIPTION = "Productos seleccionados con pago contra entrega en toda Colombia";

export const WHATSAPP_NUMBER = "573142377202";

export const SUPPORT_EMAIL = "vortixyoficial@gmail.com";

export const COLOMBIAN_DEPARTMENTS = [
  { code: "DC", name: "Bogotá D.C." },
  { code: "ANT", name: "Antioquía" },
  { code: "VAL", name: "Valle del Cauca" },
  { code: "COL", name: "Cundinamarca" },
  { code: "ATL", name: "Atlántico" },
  { code: "NSS", name: "Norte de Santander" },
  { code: "COR", name: "Córdoba" },
  { code: "BBL", name: "Bolívar" },
  { code: "TOL", name: "Tolima" },
  { code: "CAU", name: "Cauca" },
] as const;