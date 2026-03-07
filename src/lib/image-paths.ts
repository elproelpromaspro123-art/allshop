const LEGACY_PRODUCT_FOLDER_MAPPINGS: Array<[string, string]> = [
  [
    "/productos/imagenes del producto 1 (Xiaomi Redmi Airdots Manos Libres Blueto)",
    "/productos/xiaomi-redmi-airdots-s",
  ],
  [
    "/productos/imagenes del producto 2 (Silla Gamer Con Reposapies)",
    "/productos/silla-gamer-premium",
  ],
  [
    "/productos/imagenes del producto 3 (Freidora 10l Premium)",
    "/productos/air-fryer-10l-premium",
  ],
  [
    "/productos/imagenes del producto 4 (Reloj Inteligente Pantalla Grande Tactil)",
    "/productos/smartwatch-ultra-series",
  ],
  [
    "/productos/imagenes del producto 5 (Arctic Air Ice Jet Enfriador Portatil A)",
    "/productos/arctic-air-ice-jet",
  ],
  [
    "/productos/imagenes del producto 6 (Cepillo Electrico 5 En 1 Secador Alisado)",
    "/productos/cepillo-electrico-5en1",
  ],
];

function normalizeSlashes(path: string): string {
  const trimmed = path.trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/{2,}/g, "/");
}

export function normalizeLegacyImagePath(path: string): string {
  if (!path) return path;

  const raw = normalizeSlashes(path);
  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();

  let normalized = decoded;
  for (const [legacyFolder, newFolder] of LEGACY_PRODUCT_FOLDER_MAPPINGS) {
    if (normalized.includes(legacyFolder)) {
      normalized = normalized.replace(legacyFolder, newFolder);
    }
  }

  return normalizeSlashes(normalized);
}

export function normalizeLegacyImagePaths(paths: string[] | null | undefined): string[] {
  if (!Array.isArray(paths)) return [];
  return paths.map((path) => normalizeLegacyImagePath(String(path || "")));
}
