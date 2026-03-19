const SLUG_ALIAS_GROUPS: string[][] = [
  [
    "audifonos-xiaomi-redmi-buds-4-lite",
    "auriculares-xiaomi-redmi-airdots-s",
    "xiaomi-redmi-airdots-s",
    "xiaomi-redmi-buds-4-lite",
  ],
  [
    "camara-seguridad-bombillo-360-wifi",
    "aire-acondicionado-portatil-arctic-ice",
    "arctic-air-ice-jet",
    "camara-seguridad-bombillo-360",
  ],
  ["silla-gamer-premium-reposapies", "silla-gamer-premium"],
  ["air-fryer-freidora-10l-premium", "air-fryer-10l-premium"],
  ["smartwatch-ultra-series-pantalla-grande", "smartwatch-ultra-series"],
  ["cepillo-electrico-5-en-1-secador-alisador", "cepillo-electrico-5en1"],
  ["lampara-mata-zancudos-electrica", "lampara-mata-zancudos"],
  ["aspiradora-inalambrica-de-mano", "aspiradora-inalambrica"],
  [
    "combo-cargador-4-en-1-adaptadorcable",
    "combo-cargador-4-en-1-adaptador-cable",
    "combo-cargador-4-en-1",
  ],
  [
    "depilador-facial-electrico-recargable",
    "depilador-facial-electrico",
    "depilador-facial-recargable",
  ],
];

function toKey(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

const slugAliasIndex = (() => {
  const index = new Map<string, string[]>();

  for (const group of SLUG_ALIAS_GROUPS) {
    const normalizedGroup = Array.from(
      new Set(group.map((slug) => toKey(slug)).filter(Boolean)),
    );
    if (normalizedGroup.length === 0) continue;
    for (const slug of normalizedGroup) {
      index.set(slug, normalizedGroup);
    }
  }

  return index;
})();

export function getProductSlugLookupCandidates(
  slug: string | null | undefined,
): string[] {
  const key = toKey(slug);
  if (!key) return [];
  const aliases = slugAliasIndex.get(key);
  if (!aliases) return [key];
  return aliases;
}

export function normalizeProductSlug(
  slug: string | null | undefined,
): string | null {
  const aliases = getProductSlugLookupCandidates(slug);
  if (!aliases.length) return null;
  return aliases[0];
}
