export type CookieConsentCategoryKey = "necessary" | "analytics" | "marketing";

export interface CookieConsent {
  necessary?: true;
  analytics: boolean;
  marketing: boolean;
  acceptedAt: string | null;
  version?: number;
}

export interface CookieConsentCategory {
  key: CookieConsentCategoryKey;
  title: string;
  description: string;
  required: boolean;
  controlLabel: string;
  examples: string[];
}

export const COOKIE_CONSENT_STORAGE_KEY = "vortixy_cookie_consent";
export const COOKIE_CONSENT_VERSION = 2;

export const DEFAULT_COOKIE_CONSENT: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
  acceptedAt: null,
  version: COOKIE_CONSENT_VERSION,
};

export const COOKIE_CONSENT_CATEGORIES: CookieConsentCategory[] = [
  {
    key: "necessary",
    title: "Necesarias",
    description:
      "Sostienen el carrito, el checkout, la seguridad y la navegación base.",
    required: true,
    controlLabel: "Siempre activas",
    examples: [
      "Mantener la sesión de compra y el estado del carrito.",
      "Proteger formularios y operaciones sensibles.",
      "Recordar el contexto mínimo para que el sitio funcione.",
    ],
  },
  {
    key: "analytics",
    title: "Analítica",
    description:
      "Nos ayudan a entender el uso del sitio y a priorizar mejoras reales.",
    required: false,
    controlLabel: "Opcionales",
    examples: [
      "Medir visitas, vistas de producto y conversión.",
      "Detectar fricción en búsqueda, checkout y soporte.",
      "Priorizar cambios con datos, no con suposiciones.",
    ],
  },
  {
    key: "marketing",
    title: "Marketing",
    description:
      "Sirven para medir campañas y mostrar mensajes relevantes en otros canales.",
    required: false,
    controlLabel: "Opcionales",
    examples: [
      "Atribuir campañas y anuncios externos.",
      "Evitar mostrar mensajes repetidos o irrelevantes.",
      "Conectar navegación con remarketing, si lo aceptas.",
    ],
  },
];

function normalizeAcceptedAt(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizeCookieConsent(
  consent: Partial<CookieConsent> | null | undefined,
): CookieConsent | null {
  if (!consent) return null;
  if (
    typeof consent.analytics !== "boolean" ||
    typeof consent.marketing !== "boolean"
  ) {
    return null;
  }

  return {
    necessary: true,
    analytics: consent.analytics,
    marketing: consent.marketing,
    acceptedAt: normalizeAcceptedAt(consent.acceptedAt),
    version:
      typeof consent.version === "number"
        ? consent.version
        : COOKIE_CONSENT_VERSION,
  };
}

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    return normalizeCookieConsent(parsed);
  } catch {
    return null;
  }
}

export function writeCookieConsent(consent: CookieConsent): void {
  if (typeof window === "undefined") return;

  const normalized = normalizeCookieConsent(consent);
  if (!normalized) return;

  window.localStorage.setItem(
    COOKIE_CONSENT_STORAGE_KEY,
    JSON.stringify({
      ...DEFAULT_COOKIE_CONSENT,
      ...normalized,
      acceptedAt: normalized.acceptedAt || new Date().toISOString(),
      version: COOKIE_CONSENT_VERSION,
      necessary: true,
    }),
  );
}

export function hasAnalyticsConsent(consent: CookieConsent | null): boolean {
  return Boolean(consent?.analytics);
}

export function hasMarketingConsent(consent: CookieConsent | null): boolean {
  return Boolean(consent?.marketing);
}

export function getCookieConsentStatus(consent: CookieConsent | null) {
  return COOKIE_CONSENT_CATEGORIES.map((category) => ({
    ...category,
    enabled:
      category.key === "necessary" ? true : Boolean(consent?.[category.key]),
  }));
}
