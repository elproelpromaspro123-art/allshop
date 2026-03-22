export function normalizeProductHintText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const COLOR_IMAGE_HINTS_BY_SLUG: Record<
  string,
  Record<string, string[] | null>
> = {
  "silla-gamer-premium-reposapies": {
    "negro rojo": ["negro-con-rojo"],
    "negro azul": null,
    negro: ["silla-negra.jpeg", "silla-negra"],
    "negro blanco": ["negro-con-blanco"],
    "negro gris": ["silla-negra-con-gris.jpeg", "silla-negra-con-gris"],
    rosa: ["silla-rosa"],
  },
  "audifonos-xiaomi-redmi-buds-4-lite": {
    negro: ["buds4-1", "buds4-2", "buds4.png"],
    blanco: ["buds4-W-1", "buds4-W"],
  },
};

function findImageByHints(images: string[], hints: string[]): string | null {
  const normalizedHints = hints.map((hint) => normalizeProductHintText(hint));
  return (
    images.find((image) => {
      const normalizedImage = normalizeProductHintText(image);
      return normalizedHints.some((hint) => normalizedImage.includes(hint));
    }) || null
  );
}

export function buildColorImageMap(input: {
  productSlug: string;
  images: string[];
  options: string[];
}): Map<string, string | null> {
  const map = new Map<string, string | null>();
  const explicitHints = COLOR_IMAGE_HINTS_BY_SLUG[input.productSlug] || null;
  const hasOneImagePerColor = input.images.length === input.options.length;

  input.options.forEach((option, index) => {
    const normalizedOption = normalizeProductHintText(option);
    const colorHints = explicitHints?.[normalizedOption];
    if (colorHints === null) {
      map.set(normalizedOption, null);
      return;
    }

    if (Array.isArray(colorHints) && colorHints.length > 0) {
      const hintedImage = findImageByHints(input.images, colorHints);
      if (hintedImage) {
        map.set(normalizedOption, hintedImage);
        return;
      }
    }

    const imageIndex = hasOneImagePerColor
      ? index
      : Math.min(index + 1, input.images.length - 1);
    const image = input.images[imageIndex] || input.images[0] || "";
    map.set(normalizedOption, image || null);
  });

  return map;
}

export function buildColorImageIndexMap(input: {
  productSlug: string;
  images: string[];
  options: string[];
}): Map<string, number | null> {
  const map = new Map<string, number | null>();
  const explicitHints = COLOR_IMAGE_HINTS_BY_SLUG[input.productSlug] || null;
  const hasOneImagePerColor = input.images.length === input.options.length;

  input.options.forEach((option, index) => {
    const normalizedOption = normalizeProductHintText(option);
    const colorHints = explicitHints?.[normalizedOption];
    if (colorHints === null) {
      map.set(normalizedOption, null);
      return;
    }

    if (Array.isArray(colorHints) && colorHints.length > 0) {
      const hintedImage = findImageByHints(input.images, colorHints);
      if (hintedImage) {
        const hintedIndex = input.images.findIndex((image) => image === hintedImage);
        map.set(normalizedOption, hintedIndex >= 0 ? hintedIndex : null);
        return;
      }
    }

    const imageIndex = hasOneImagePerColor
      ? index
      : Math.min(index + 1, input.images.length - 1);
    map.set(normalizedOption, imageIndex);
  });

  return map;
}
