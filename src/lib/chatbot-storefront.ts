import "server-only";

import { unstable_cache } from "next/cache";
import {
  isGreeting,
  shouldPreferLocalStorefrontAnswer,
  wantsAddToCart,
  wantsBuyNow,
  wantsComparison,
  wantsCapabilityOverview,
  wantsCheckoutPage,
  wantsFaqPage,
  wantsHumanSupport,
  wantsProductExplanation,
  wantsReturnsPage,
  wantsShippingPage,
  wantsSupportPage,
  wantsTrackingPage,
} from "@/lib/chatbot-intent";
import { getCategories, getProducts } from "@/lib/db";
import { SUPPORT_EMAIL, WHATSAPP_PHONE, getBaseUrl } from "@/lib/site";
import type {
  AssistantAction,
  AssistantActionProduct,
} from "@/lib/chatbot-types";
import type { Category, Product, StockLocation } from "@/types";

interface StorefrontCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
}

interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  price: number;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  stockLocation: StockLocation;
  freeShipping: boolean;
  shippingCost: number | null;
  isFeatured: boolean;
  isBestseller: boolean;
  averageRating: number;
  reviewsCount: number;
  updatedAt: string;
}

interface StorefrontSnapshot {
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
}

interface PageDescriptor {
  kind:
    | "category"
    | "checkout"
    | "faq"
    | "home"
    | "other"
    | "product"
    | "returns"
    | "shipping"
    | "support"
    | "tracking";
  path: string;
  label: string;
  summary: string;
  sections: Array<{ id: string; label: string }>;
  category?: StorefrontCategory | null;
  product?: StorefrontProduct | null;
}

interface ConversationMessage {
  role: "assistant" | "user";
  content: string;
}

interface ConversationFocus {
  category: StorefrontCategory | null;
  product: StorefrontProduct | null;
}

export interface ChatbotStorefrontContext {
  action: AssistantAction | null;
  catalogSummary: string;
  currentPageSummary: string;
  fallbackAnswer: string;
  navigationSummary: string;
  preferLocalResponse: boolean;
}

const STOPWORDS = new Set([
  "a",
  "al",
  "algo",
  "anda",
  "con",
  "de",
  "del",
  "el",
  "en",
  "esta",
  "este",
  "hacia",
  "ir",
  "la",
  "las",
  "lo",
  "los",
  "me",
  "mi",
  "mostrar",
  "muestrame",
  "para",
  "por",
  "que",
  "quiero",
  "te",
  "tu",
  "un",
  "una",
  "ver",
  "ya",
]);

function normalizeText(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9/\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function formatCop(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(price) || 0));
}

function sortProductsByPriority(
  products: StorefrontProduct[],
): StorefrontProduct[] {
  return [...products].sort((left, right) => {
    if (Number(right.isBestseller) !== Number(left.isBestseller)) {
      return Number(right.isBestseller) - Number(left.isBestseller);
    }

    if (Number(right.isFeatured) !== Number(left.isFeatured)) {
      return Number(right.isFeatured) - Number(left.isFeatured);
    }

    if (right.reviewsCount !== left.reviewsCount) {
      return right.reviewsCount - left.reviewsCount;
    }

    if (right.averageRating !== left.averageRating) {
      return right.averageRating - left.averageRating;
    }

    return Date.parse(right.updatedAt || "") - Date.parse(left.updatedAt || "");
  });
}

function buildSnapshot(
  categories: Category[],
  products: Product[],
): StorefrontSnapshot {
  const activeProducts = products.filter(
    (product) => product.is_active !== false,
  );
  const productsByCategory = new Map<string, number>();

  for (const product of activeProducts) {
    const categoryId = String(product.category_id || "").trim();
    if (!categoryId) {
      continue;
    }

    productsByCategory.set(
      categoryId,
      (productsByCategory.get(categoryId) || 0) + 1,
    );
  }

  const mappedCategories: StorefrontCategory[] = categories.map((category) => ({
    id: category.id,
    name: String(category.name || "").trim(),
    slug: String(category.slug || "").trim(),
    description: String(category.description || "").trim(),
    productCount: productsByCategory.get(category.id) || 0,
  }));

  const categoryById = new Map(
    mappedCategories.map((category) => [category.id, category]),
  );

  const mappedProducts: StorefrontProduct[] = activeProducts.map((product) => {
    const category = categoryById.get(String(product.category_id || "").trim());

    return {
      id: product.id,
      name: String(product.name || "").trim(),
      slug: String(product.slug || "").trim(),
      description: String(product.description || "").trim(),
      image: Array.isArray(product.images)
        ? String(product.images[0] || "").trim()
        : "",
      price: Math.max(0, Number(product.price) || 0),
      categoryId: String(product.category_id || "").trim(),
      categoryName: category?.name || "Sin categoria",
      categorySlug: category?.slug || "",
      stockLocation: product.stock_location || "nacional",
      freeShipping: product.free_shipping === true,
      shippingCost:
        typeof product.shipping_cost === "number"
          ? Math.max(0, product.shipping_cost)
          : null,
      isFeatured: product.is_featured === true,
      isBestseller: product.is_bestseller === true,
      averageRating: Math.max(0, Number(product.average_rating) || 0),
      reviewsCount: Math.max(0, Number(product.reviews_count) || 0),
      updatedAt: String(product.updated_at || product.created_at || "").trim(),
    };
  });

  return {
    categories: mappedCategories,
    products: mappedProducts,
  };
}

const getCachedStorefrontSnapshot = unstable_cache(
  async (): Promise<StorefrontSnapshot> => {
    const [categories, products] = await Promise.all([
      getCategories(),
      getProducts(),
    ]);
    return buildSnapshot(categories, products);
  },
  ["chatbot-storefront-snapshot"],
  { revalidate: 60 },
);

function parsePageDescriptor(
  pageUrl: string,
  snapshot: StorefrontSnapshot,
): PageDescriptor {
  const baseUrl = getBaseUrl();
  const fallbackUrl = `${baseUrl}/`;
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(pageUrl || fallbackUrl, fallbackUrl);
  } catch {
    parsedUrl = new URL(fallbackUrl);
  }

  const path = parsedUrl.pathname || "/";
  const categoryBySlug = new Map(
    snapshot.categories.map((category) => [category.slug, category]),
  );
  const productBySlug = new Map(
    snapshot.products.map((product) => [product.slug, product]),
  );

  if (path === "/") {
    return {
      kind: "home",
      path,
      label: "Inicio",
      summary:
        "Estas en la pagina de inicio. Las secciones navegables mas utiles aqui son categorias (#categorias) y productos destacados (#productos).",
      sections: [
        { id: "categorias", label: "Categorias" },
        { id: "productos", label: "Productos destacados" },
      ],
    };
  }

  if (path.startsWith("/categoria/")) {
    const slug = path.replace("/categoria/", "").split("/")[0] || "";
    const category = categoryBySlug.get(slug) || null;
    return {
      kind: "category",
      path,
      label: category ? `Categoria ${category.name}` : "Categoria",
      summary: category
        ? `Estas en la categoria ${category.name}. Esta pagina tiene una seccion navegable de catalogo con id #catalogo y ${category.productCount} productos activos.`
        : "Estas en una pagina de categoria.",
      sections: [{ id: "catalogo", label: "Catalogo de la categoria" }],
      category,
    };
  }

  if (path.startsWith("/producto/")) {
    const slug = path.replace("/producto/", "").split("/")[0] || "";
    const product = productBySlug.get(slug) || null;
    return {
      kind: "product",
      path,
      label: product ? product.name : "Producto",
      summary: product
        ? `Estas viendo la ficha del producto ${product.name}, categoria ${product.categoryName}, precio actual ${formatCop(product.price)}.`
        : "Estas en una pagina de producto.",
      sections: [],
      product,
    };
  }

  if (path === "/checkout") {
    return {
      kind: "checkout",
      path,
      label: "Checkout",
      summary:
        "Estas en checkout, donde el usuario confirma datos, direccion y pedido contra entrega.",
      sections: [
        { id: "checkout-contacto", label: "Datos de contacto" },
        { id: "checkout-envio", label: "Datos de envio" },
        { id: "checkout-confirmaciones", label: "Confirmaciones" },
        { id: "checkout-resumen", label: "Resumen del pedido" },
      ],
    };
  }

  if (path === "/seguimiento") {
    return {
      kind: "tracking",
      path,
      label: "Seguimiento",
      summary: "Estas en seguimiento de pedidos.",
      sections: [],
    };
  }

  if (path === "/soporte") {
    return {
      kind: "support",
      path,
      label: "Soporte",
      summary: "Estas en la pagina de soporte y contacto.",
      sections: [{ id: "feedback-form", label: "Formulario de feedback" }],
    };
  }

  if (path === "/faq") {
    return {
      kind: "faq",
      path,
      label: "Preguntas frecuentes",
      summary: "Estas en la pagina de preguntas frecuentes.",
      sections: [],
    };
  }

  if (path === "/envios") {
    return {
      kind: "shipping",
      path,
      label: "Envios",
      summary: "Estas en la pagina de envios, cobertura y tiempos estimados.",
      sections: [],
    };
  }

  if (path === "/devoluciones") {
    return {
      kind: "returns",
      path,
      label: "Devoluciones",
      summary: "Estas en la pagina de devoluciones, cambios y garantias.",
      sections: [],
    };
  }

  return {
    kind: "other",
    path,
    label: "Pagina actual",
    summary: `Estas en ${path}.`,
    sections: [],
  };
}

function searchProducts(
  query: string,
  snapshot: StorefrontSnapshot,
  limit = 8,
): StorefrontProduct[] {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);

  if (!normalizedQuery) {
    return sortProductsByPriority(snapshot.products).slice(0, limit);
  }

  const scored = snapshot.products
    .map((product) => {
      const haystack = normalizeText(
        `${product.name} ${product.slug} ${product.categoryName} ${product.description}`,
      );
      let score = 0;

      if (haystack.includes(normalizedQuery)) {
        score += 100;
      }

      for (const token of queryTokens) {
        if (normalizeText(product.name).includes(token)) {
          score += 12;
        }
        if (normalizeText(product.slug).includes(token)) {
          score += 10;
        }
        if (normalizeText(product.categoryName).includes(token)) {
          score += 6;
        }
        if (normalizeText(product.description).includes(token)) {
          score += 2;
        }
      }

      if (product.isBestseller) {
        score += 2;
      }

      if (product.isFeatured) {
        score += 1;
      }

      return { product, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return sortProductsByPriority([left.product, right.product])[0].id ===
        left.product.id
        ? -1
        : 1;
    });

  return scored.slice(0, limit).map((entry) => entry.product);
}

function findCategoryMatches(
  query: string,
  snapshot: StorefrontSnapshot,
): StorefrontCategory[] {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);

  return snapshot.categories
    .map((category) => {
      let score = 0;
      const categoryName = normalizeText(category.name);
      const categorySlug = normalizeText(category.slug);

      if (
        normalizedQuery.includes(categoryName) ||
        normalizedQuery.includes(categorySlug)
      ) {
        score += 100;
      }

      for (const token of queryTokens) {
        if (categoryName.includes(token) || categorySlug.includes(token)) {
          score += 15;
        }
      }

      return { category, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.category);
}

function wantsNavigation(query: string): boolean {
  return /(abr|abre|abrime|gui|guia|guia me|ir a|ve a|entra|llev|llevame|bajame|mostrar|muestrame|mandame|quiero ver|quiero ir|open)/i.test(
    normalizeText(query),
  );
}

function wantsRecommendation(query: string): boolean {
  return /(recomend|algo bueno|mejor producto|que me recomiendes|que recomiendas|cual me recomiendas)/i.test(
    normalizeText(query),
  );
}

function getTopProductsForCategory(
  categoryId: string,
  snapshot: StorefrontSnapshot,
): StorefrontProduct[] {
  return sortProductsByPriority(
    snapshot.products.filter((product) => product.categoryId === categoryId),
  );
}

function inferRequestedQuantity(query: string): number {
  const normalized = normalizeText(query);
  const match = normalized.match(
    /\b(10|[1-9])\b(?:\s*(unidad|unidades|ud|uds|x|piezas?))?/,
  );

  if (!match) {
    return 1;
  }

  return Math.min(10, Math.max(1, Number(match[1]) || 1));
}

function toAssistantActionProduct(
  product: StorefrontProduct,
): AssistantActionProduct {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image || "/images/fallback-product.png",
    freeShipping: product.freeShipping,
    shippingCost: product.shippingCost,
    stockLocation: product.stockLocation,
  };
}

function findRecentConversationFocus(
  messages: ConversationMessage[],
  page: PageDescriptor,
  snapshot: StorefrontSnapshot,
): ConversationFocus {
  let product = page.product || null;
  let category = page.category || null;

  for (const message of [...messages].reverse()) {
    if (!product) {
      product = searchProducts(message.content, snapshot, 1)[0] || null;
    }

    if (!category) {
      category = findCategoryMatches(message.content, snapshot)[0] || null;
    }

    if (!category && product) {
      category =
        snapshot.categories.find((entry) => entry.id === product?.categoryId) ||
        null;
    }

    if (product && category) {
      break;
    }
  }

  return {
    product,
    category,
  };
}

function resolveTargetProduct(
  latestUserMessage: string,
  page: PageDescriptor,
  snapshot: StorefrontSnapshot,
  focus: ConversationFocus,
  categoryMatch: StorefrontCategory | null,
): StorefrontProduct | null {
  const explicitMatch =
    searchProducts(latestUserMessage, snapshot, 1)[0] || null;

  if (page.product) {
    if (!explicitMatch) {
      return page.product;
    }

    if (
      !queryReferencesProduct(latestUserMessage, explicitMatch) &&
      !queryReferencesProduct(latestUserMessage, page.product)
    ) {
      return page.product;
    }
  }

  if (explicitMatch) {
    return explicitMatch;
  }

  if (page.product) {
    return page.product;
  }

  if (focus.product) {
    return focus.product;
  }

  if (categoryMatch) {
    return getTopProductsForCategory(categoryMatch.id, snapshot)[0] || null;
  }

  if (focus.category) {
    return getTopProductsForCategory(focus.category.id, snapshot)[0] || null;
  }

  return null;
}

function pickComparisonProduct(
  baseProduct: StorefrontProduct | null,
  snapshot: StorefrontSnapshot,
): StorefrontProduct | null {
  if (!baseProduct) {
    return null;
  }

  const sameCategoryOptions = getTopProductsForCategory(
    baseProduct.categoryId,
    snapshot,
  ).filter((product) => product.id !== baseProduct.id);

  if (sameCategoryOptions.length > 0) {
    return sameCategoryOptions[0];
  }

  return (
    sortProductsByPriority(snapshot.products).find(
      (product) => product.id !== baseProduct.id,
    ) || null
  );
}

function queryReferencesProduct(
  query: string,
  product: StorefrontProduct | null,
): boolean {
  if (!product) {
    return false;
  }

  const normalizedQuery = normalizeText(query);
  const normalizedName = normalizeText(product.name);
  const normalizedSlug = normalizeText(product.slug.replace(/-/g, " "));

  return (
    normalizedQuery.includes(normalizedName) ||
    normalizedQuery.includes(normalizedSlug)
  );
}

function pickRecommendedProduct(
  query: string,
  page: PageDescriptor,
  snapshot: StorefrontSnapshot,
  categoryMatch: StorefrontCategory | null,
): StorefrontProduct | null {
  if (categoryMatch) {
    return getTopProductsForCategory(categoryMatch.id, snapshot)[0] || null;
  }

  if (page.category) {
    return getTopProductsForCategory(page.category.id, snapshot)[0] || null;
  }

  if (page.product) {
    const sameCategory = getTopProductsForCategory(
      page.product.categoryId,
      snapshot,
    ).filter((product) => product.id !== page.product?.id);
    if (sameCategory.length > 0) {
      return sameCategory[0];
    }
  }

  const matches = searchProducts(query, snapshot, 4);
  if (matches.length > 0) {
    return matches[0];
  }

  return sortProductsByPriority(snapshot.products)[0] || null;
}

function buildNavigateAction(input: {
  path: string;
  targetType: "category" | "page" | "product" | "section";
  title: string;
  label: string;
  description: string;
  sectionId?: string;
}): AssistantAction {
  return {
    id: `${input.targetType}:${input.path}:${input.sectionId || ""}`,
    type: "navigate",
    targetType: input.targetType,
    title: input.title,
    label: input.label,
    description: input.description,
    path: input.path,
    sectionId: input.sectionId,
    requiresConfirmation: true,
  };
}

function buildCartAction(input: {
  type: "add_to_cart" | "add_to_cart_and_checkout";
  product: StorefrontProduct;
  quantity?: number;
  title: string;
  label: string;
  description: string;
}): AssistantAction {
  return {
    id: `${input.type}:${input.product.slug}:${input.quantity || 1}`,
    type: input.type,
    targetType: "cart",
    title: input.title,
    label: input.label,
    description: input.description,
    path:
      input.type === "add_to_cart_and_checkout"
        ? "/checkout"
        : `/producto/${input.product.slug}`,
    quantity: input.quantity || 1,
    product: toAssistantActionProduct(input.product),
    requiresConfirmation: true,
  };
}

function inferAssistantAction(
  latestUserMessage: string,
  page: PageDescriptor,
  snapshot: StorefrontSnapshot,
  conversationMessages: ConversationMessage[],
): AssistantAction | null {
  const normalizedQuery = normalizeText(latestUserMessage);
  const queryTokens = tokenize(latestUserMessage);
  const categoryMatch =
    findCategoryMatches(latestUserMessage, snapshot)[0] || null;
  const focus = findRecentConversationFocus(
    conversationMessages,
    page,
    snapshot,
  );
  const productMatches = searchProducts(latestUserMessage, snapshot, 3);
  const targetProduct =
    resolveTargetProduct(
      latestUserMessage,
      page,
      snapshot,
      focus,
      categoryMatch,
    ) ||
    productMatches[0] ||
    null;
  const comparisonProduct = pickComparisonProduct(targetProduct, snapshot);
  const navigationRequested = wantsNavigation(latestUserMessage);
  const recommendationRequested = wantsRecommendation(latestUserMessage);
  const comparisonRequested = wantsComparison(latestUserMessage);
  const addToCartRequested = wantsAddToCart(latestUserMessage);
  const buyNowRequested = wantsBuyNow(latestUserMessage);
  const shortDirectRequest = queryTokens.length > 0 && queryTokens.length <= 3;
  const wantsShipping = wantsShippingPage(latestUserMessage);
  const wantsReturns = wantsReturnsPage(latestUserMessage);
  const wantsCheckout = wantsCheckoutPage(latestUserMessage);
  const wantsTracking = wantsTrackingPage(latestUserMessage);
  const wantsSupport = wantsSupportPage(latestUserMessage);
  const wantsFaq = wantsFaqPage(latestUserMessage);
  const quantity = inferRequestedQuantity(latestUserMessage);

  if (buyNowRequested && targetProduct) {
    return buildCartAction({
      type: "add_to_cart_and_checkout",
      product: targetProduct,
      quantity,
      title: `Comprar ahora ${targetProduct.name}`,
      label: quantity > 1 ? `Comprar ${quantity} ahora` : "Comprar ahora",
      description:
        quantity > 1
          ? `Agrega ${quantity} unidades de ${targetProduct.name} al carrito y te lleva directo al checkout.`
          : `Agrega ${targetProduct.name} al carrito y te lleva directo al checkout.`,
    });
  }

  if (addToCartRequested && targetProduct) {
    return buildCartAction({
      type: "add_to_cart",
      product: targetProduct,
      quantity,
      title: `Agregar ${targetProduct.name} al carrito`,
      label:
        quantity > 1 ? `Agregar ${quantity} al carrito` : "Agregar al carrito",
      description:
        quantity > 1
          ? `Agrega ${quantity} unidades reales de ${targetProduct.name} al carrito actual.`
          : `Agrega ${targetProduct.name} al carrito actual sin salir del flujo.`,
    });
  }

  if (comparisonRequested && comparisonProduct) {
    return buildNavigateAction({
      path: `/producto/${comparisonProduct.slug}`,
      targetType: "product",
      title: `Comparar con ${comparisonProduct.name}`,
      label: "Ver alternativa",
      description: `Te abre una alternativa real del mismo catalogo para comparar mejor antes de decidir.`,
    });
  }

  if (
    wantsShipping &&
    (navigationRequested || shortDirectRequest) &&
    page.kind !== "shipping"
  ) {
    return buildNavigateAction({
      path: "/envios",
      targetType: "page",
      title: "Ir a envios",
      label: "Abrir envios",
      description:
        "Te lleva a la pagina de envios, cobertura y tiempos estimados.",
    });
  }

  if (
    wantsReturns &&
    (navigationRequested || shortDirectRequest) &&
    page.kind !== "returns"
  ) {
    return buildNavigateAction({
      path: "/devoluciones",
      targetType: "page",
      title: "Ir a devoluciones",
      label: "Abrir devoluciones",
      description: "Te lleva a la pagina de cambios, devoluciones y garantias.",
    });
  }

  if (
    wantsCheckout &&
    (navigationRequested || shortDirectRequest || page.kind !== "checkout")
  ) {
    return buildNavigateAction({
      path: "/checkout",
      targetType: "page",
      title: "Ir al checkout",
      label: "Abrir checkout",
      description:
        "Te lleva al carrito y checkout para revisar el pedido y completar tus datos.",
    });
  }

  if (
    wantsTracking &&
    (navigationRequested || shortDirectRequest || page.kind !== "tracking")
  ) {
    return buildNavigateAction({
      path: "/seguimiento",
      targetType: "page",
      title: "Ir a seguimiento",
      label: "Abrir seguimiento",
      description:
        "Te lleva a la pagina de seguimiento para consultar el estado del pedido.",
    });
  }

  if (wantsSupport && navigationRequested && page.kind !== "support") {
    return buildNavigateAction({
      path: "/soporte",
      targetType: "page",
      title: "Ir a soporte",
      label: "Abrir soporte",
      description:
        "Te lleva a soporte y contacto para feedback o ayuda detallada.",
    });
  }

  if (wantsFaq && navigationRequested && page.kind !== "faq") {
    return buildNavigateAction({
      path: "/faq",
      targetType: "page",
      title: "Ir a preguntas frecuentes",
      label: "Abrir FAQ",
      description:
        "Te lleva a preguntas frecuentes para resolver dudas comunes.",
    });
  }

  if (page.kind === "checkout" && (navigationRequested || shortDirectRequest)) {
    if (
      /(contacto|nombre|correo|email|telefono|documento)/i.test(normalizedQuery)
    ) {
      return buildNavigateAction({
        path: "/checkout",
        targetType: "section",
        title: "Ir a datos de contacto",
        label: "Abrir contacto",
        description:
          "Te lleva a la parte del checkout donde completas tus datos personales.",
        sectionId: "checkout-contacto",
      });
    }

    if (
      /(envio|direccion|ciudad|departamento|referencia)/i.test(normalizedQuery)
    ) {
      return buildNavigateAction({
        path: "/checkout",
        targetType: "section",
        title: "Ir a datos de envio",
        label: "Abrir envio",
        description:
          "Te lleva a la parte del checkout donde completas direccion y entrega.",
        sectionId: "checkout-envio",
      });
    }

    if (
      /(confirma|confirmacion|confirmaciones|checkbox|acepto)/i.test(
        normalizedQuery,
      )
    ) {
      return buildNavigateAction({
        path: "/checkout",
        targetType: "section",
        title: "Ir a confirmaciones",
        label: "Abrir confirmaciones",
        description:
          "Te lleva a las validaciones finales del checkout antes de confirmar el pedido.",
        sectionId: "checkout-confirmaciones",
      });
    }

    if (/(resumen|total|pedido|cantidades|cantidad)/i.test(normalizedQuery)) {
      return buildNavigateAction({
        path: "/checkout",
        targetType: "section",
        title: "Ir al resumen del pedido",
        label: "Abrir resumen",
        description:
          "Te lleva al resumen del pedido para revisar cantidades, subtotal y total.",
        sectionId: "checkout-resumen",
      });
    }
  }

  if (
    categoryMatch &&
    (navigationRequested ||
      /categoria/.test(normalizedQuery) ||
      shortDirectRequest)
  ) {
    if (page.category?.slug === categoryMatch.slug) {
      return buildNavigateAction({
        path: `/categoria/${categoryMatch.slug}`,
        targetType: "section",
        title: `Ir al catalogo de ${categoryMatch.name}`,
        label: `Ver catalogo de ${categoryMatch.name}`,
        description: `Te baja al catalogo real de la categoria ${categoryMatch.name}.`,
        sectionId: "catalogo",
      });
    }

    return buildNavigateAction({
      path: `/categoria/${categoryMatch.slug}`,
      targetType: "category",
      title: `Abrir categoria ${categoryMatch.name}`,
      label: `Ir a ${categoryMatch.name}`,
      description: `Te lleva a la categoria ${categoryMatch.name}, que ahora mismo tiene ${categoryMatch.productCount} productos activos.`,
    });
  }

  if (
    /(categorias|categoria|catalogo completo)/i.test(normalizedQuery) &&
    !categoryMatch &&
    (navigationRequested || page.kind !== "home" || shortDirectRequest)
  ) {
    return buildNavigateAction({
      path: "/",
      targetType: "section",
      title: "Ir a categorias",
      label: "Abrir categorias",
      description: "Te lleva a la seccion de categorias del inicio.",
      sectionId: "categorias",
    });
  }

  if (
    /(productos|destacados)/i.test(normalizedQuery) &&
    (navigationRequested || page.kind !== "home" || shortDirectRequest)
  ) {
    return buildNavigateAction({
      path: "/",
      targetType: "section",
      title: "Ir a productos destacados",
      label: "Abrir productos",
      description: "Te lleva a la seccion de productos destacados del inicio.",
      sectionId: "productos",
    });
  }

  if (productMatches.length > 0 && navigationRequested) {
    const product = productMatches[0];
    return buildNavigateAction({
      path: `/producto/${product.slug}`,
      targetType: "product",
      title: `Abrir ${product.name}`,
      label: "Abrir producto",
      description: `Te lleva a la ficha actual de ${product.name}.`,
    });
  }

  if (recommendationRequested) {
    const recommended = pickRecommendedProduct(
      latestUserMessage,
      page,
      snapshot,
      categoryMatch || focus.category,
    );

    if (recommended) {
      return buildNavigateAction({
        path: `/producto/${recommended.slug}`,
        targetType: "product",
        title: `Ver recomendacion: ${recommended.name}`,
        label: "Ver producto recomendado",
        description: `Te abre la ficha de ${recommended.name}, una recomendacion real del catalogo actual.`,
      });
    }
  }

  return null;
}

function buildProductReason(product: StorefrontProduct): string {
  const reasons: string[] = [];

  if (product.isBestseller) {
    reasons.push("es de los productos con mejor salida del catalogo actual");
  }

  if (product.isFeatured) {
    reasons.push("esta destacado en la tienda");
  }

  if (product.reviewsCount > 0) {
    reasons.push(
      `tiene ${product.reviewsCount} reviews visibles y rating promedio de ${product.averageRating.toFixed(1)}`,
    );
  } else {
    reasons.push(`pertenece a la categoria ${product.categoryName}`);
  }

  if (product.freeShipping) {
    reasons.push("incluye envio gratis");
  } else if (product.shippingCost !== null) {
    reasons.push(`tiene envio estimado de ${formatCop(product.shippingCost)}`);
  }

  if (product.stockLocation === "nacional") {
    reasons.push("sale desde stock nacional");
  } else if (product.stockLocation === "internacional") {
    reasons.push("depende de stock internacional");
  }

  return reasons.slice(0, 2).join(", ");
}

function summarizeProductDescription(product: StorefrontProduct): string {
  const summary = product.description.replace(/\s+/g, " ").trim();

  if (!summary) {
    return `Es una opcion activa dentro de la categoria ${product.categoryName}.`;
  }

  if (summary.length <= 180) {
    return summary;
  }

  return `${summary.slice(0, 177).trim()}...`;
}

function buildAlternativeLine(
  product: StorefrontProduct | null,
): string | null {
  if (!product) {
    return null;
  }

  return `Como alternativa real, tambien veo ${product.name} en ${formatCop(product.price)}.`;
}

function buildComparisonAnswer(
  baseProduct: StorefrontProduct,
  alternativeProduct: StorefrontProduct | null,
  agentModeEnabled: boolean,
): string {
  if (!alternativeProduct) {
    return `${baseProduct.name} es una opcion real del catalogo actual. ${summarizeProductDescription(
      baseProduct,
    )}`;
  }

  const priceLead =
    baseProduct.price === alternativeProduct.price
      ? `Ambos estan en el mismo rango de precio: ${formatCop(baseProduct.price)}.`
      : baseProduct.price < alternativeProduct.price
        ? `${baseProduct.name} sale por ${formatCop(baseProduct.price)} y ${alternativeProduct.name} por ${formatCop(alternativeProduct.price)}.`
        : `${alternativeProduct.name} sale por ${formatCop(alternativeProduct.price)} y ${baseProduct.name} por ${formatCop(baseProduct.price)}.`;

  const reviewLead =
    baseProduct.reviewsCount > alternativeProduct.reviewsCount
      ? `${baseProduct.name} llega con mas validacion visible: ${baseProduct.reviewsCount} reviews frente a ${alternativeProduct.reviewsCount}.`
      : alternativeProduct.reviewsCount > baseProduct.reviewsCount
        ? `${alternativeProduct.name} trae mas respaldo visible: ${alternativeProduct.reviewsCount} reviews frente a ${baseProduct.reviewsCount}.`
        : "Los dos estan publicados en el catalogo actual y son comparables dentro de la misma categoria.";

  const close = agentModeEnabled
    ? `Ya te llevo a ${alternativeProduct.name} para que tengas la otra ficha a mano.`
    : `Si quieres, puedo abrirte ${alternativeProduct.name} para revisar la otra opcion.`;

  return `${baseProduct.name}: ${buildProductReason(baseProduct)}. ${alternativeProduct.name}: ${buildProductReason(
    alternativeProduct,
  )}. ${priceLead} ${reviewLead} ${close}`;
}

function buildFallbackAnswer(
  latestUserMessage: string,
  page: PageDescriptor,
  snapshot: StorefrontSnapshot,
  action: AssistantAction | null,
  agentModeEnabled: boolean,
  conversationMessages: ConversationMessage[],
): string {
  const normalizedQuery = normalizeText(latestUserMessage);
  const categoryMatch =
    findCategoryMatches(latestUserMessage, snapshot)[0] || null;
  const focus = findRecentConversationFocus(
    conversationMessages,
    page,
    snapshot,
  );
  const productMatches = searchProducts(latestUserMessage, snapshot, 3);
  const targetProduct =
    resolveTargetProduct(
      latestUserMessage,
      page,
      snapshot,
      focus,
      categoryMatch,
    ) ||
    productMatches[0] ||
    null;
  const comparisonProduct = pickComparisonProduct(targetProduct, snapshot);
  const recommendationRequested = wantsRecommendation(latestUserMessage);
  const comparisonRequested = wantsComparison(latestUserMessage);
  const productExplanationRequested =
    wantsProductExplanation(latestUserMessage);
  const wantsShipping = wantsShippingPage(latestUserMessage);
  const wantsReturns = wantsReturnsPage(latestUserMessage);
  const quantity = inferRequestedQuantity(latestUserMessage);
  const wantsCheckout = wantsCheckoutPage(latestUserMessage);
  const wantsTracking = wantsTrackingPage(latestUserMessage);
  const wantsSupport = wantsSupportPage(latestUserMessage);
  const wantsFaq = wantsFaqPage(latestUserMessage);

  if (wantsHumanSupport(latestUserMessage)) {
    return `Te puedo escalar con una persona por WhatsApp al +${WHATSAPP_PHONE} o por correo a ${SUPPORT_EMAIL}. Si antes quieres dejar listo el contexto, tambien puedo abrirte soporte dentro del sitio o llevarte al producto o categoria exacta.`;
  }

  if (action?.type === "add_to_cart_and_checkout") {
    return quantity > 1
      ? `Voy a agregar ${quantity} unidades de ${action.product.name} y dejarte en checkout para cerrar el pedido sin pasos extra.`
      : `Voy a agregar ${action.product.name} al carrito y dejarte en checkout para que cierres la compra de una vez.`;
  }

  if (action?.type === "add_to_cart") {
    return quantity > 1
      ? `Puedo agregar ${quantity} unidades de ${action.product.name} al carrito sin sacarte del flujo actual.`
      : `Puedo agregar ${action.product.name} al carrito ahora mismo sin sacarte del flujo actual.`;
  }

  if (action?.targetType === "category") {
    const categorySlug =
      action.path.replace("/categoria/", "").split("/")[0] || "";
    const category =
      snapshot.categories.find((item) => item.slug === categorySlug) ||
      categoryMatch;

    if (category) {
      return agentModeEnabled
        ? `Te llevo a ${category.name}. Esa categoria tiene ${category.productCount} productos activos en este momento.`
        : `Puedo llevarte a ${category.name}. Esa categoria tiene ${category.productCount} productos activos ahora mismo. ¿Quieres que la abra?`;
    }
  }

  if (action?.targetType === "product") {
    const productSlug =
      action.path.replace("/producto/", "").split("/")[0] || "";
    const product =
      snapshot.products.find((item) => item.slug === productSlug) ||
      targetProduct ||
      null;

    if (product) {
      if (comparisonRequested && targetProduct) {
        return buildComparisonAnswer(targetProduct, product, agentModeEnabled);
      }

      const reason = buildProductReason(product);

      if (recommendationRequested) {
        const alternative = buildAlternativeLine(
          pickComparisonProduct(product, snapshot),
        );
        return agentModeEnabled
          ? `Mi recomendacion principal ahora mismo es ${product.name}, ${reason}. ${alternative || ""} Ya te llevo a su ficha.`
          : `Mi recomendacion real ahora mismo es ${product.name}, ${reason}. ¿Quieres que te lo abra?`;
      }

      return agentModeEnabled
        ? `Te llevo a la ficha real de ${product.name}. Su precio visible ahora es ${formatCop(product.price)}.`
        : `Puedo abrirte ${product.name}. Su precio visible ahora es ${formatCop(product.price)}. ¿Quieres que te lo muestre?`;
    }
  }

  if (action?.targetType === "section") {
    if (action.sectionId === "categorias") {
      return agentModeEnabled
        ? "Te llevo a la seccion de categorias del inicio para que explores el catalogo por colecciones."
        : "Puedo llevarte a la seccion de categorias del inicio. ¿Quieres que la abra?";
    }

    if (action.sectionId === "productos") {
      return agentModeEnabled
        ? "Te llevo a la seccion de productos destacados del inicio para que veas opciones reales publicadas."
        : "Puedo llevarte a la seccion de productos destacados del inicio. ¿Quieres que la abra?";
    }

    if (action.sectionId === "catalogo" && page.category) {
      return agentModeEnabled
        ? `Te bajo al catalogo de ${page.category.name} para que veas sus productos activos.`
        : `Puedo bajarte al catalogo de ${page.category.name}. ¿Quieres que continúe?`;
    }
  }

  if (action?.targetType === "section") {
    if (action.sectionId === "checkout-contacto") {
      return agentModeEnabled
        ? "Te llevo a los datos de contacto del checkout para que completes el pedido."
        : "Puedo bajarte a los datos de contacto del checkout. ¿Quieres que continúe?";
    }

    if (action.sectionId === "checkout-envio") {
      return agentModeEnabled
        ? "Te llevo a la parte de direccion y envio del checkout."
        : "Puedo abrirte la parte de direccion y envio del checkout. ¿Quieres que la abra?";
    }

    if (action.sectionId === "checkout-confirmaciones") {
      return agentModeEnabled
        ? "Te llevo a las confirmaciones finales del checkout."
        : "Puedo bajarte a las confirmaciones finales del checkout. ¿Quieres que continúe?";
    }

    if (action.sectionId === "checkout-resumen") {
      return agentModeEnabled
        ? "Te llevo al resumen del pedido para revisar cantidades y total."
        : "Puedo abrirte el resumen del pedido dentro del checkout. ¿Quieres que lo muestre?";
    }
  }

  if (action?.targetType === "page") {
    if (action.path === "/checkout") {
      return agentModeEnabled
        ? "Te llevo al checkout para revisar carrito, direccion y confirmacion del pedido."
        : "Puedo llevarte al checkout para revisar carrito, direccion y confirmacion del pedido. ¿Quieres que lo abra?";
    }

    if (action.path === "/seguimiento") {
      return agentModeEnabled
        ? "Te llevo a seguimiento para que revises el estado real del pedido."
        : "Puedo abrir la pagina de seguimiento para revisar el estado del pedido. ¿Quieres que la abra?";
    }

    if (action.path === "/soporte") {
      return agentModeEnabled
        ? "Te llevo a soporte para que tengas el formulario y los canales de contacto a mano."
        : "Puedo abrir soporte para que revises ayuda, feedback y contacto. ¿Quieres que continúe?";
    }

    if (action.path === "/faq") {
      return agentModeEnabled
        ? "Te llevo a preguntas frecuentes para revisar dudas comunes de compra, envio y seguimiento."
        : "Puedo abrir preguntas frecuentes para revisar dudas comunes. ¿Quieres que la abra?";
    }
  }

  if (action?.targetType === "page") {
    if (action.path === "/envios") {
      return agentModeEnabled
        ? "Te llevo a la pagina de envios para revisar cobertura, tiempos y condiciones."
        : "Puedo abrirte la pagina de envios para revisar cobertura, tiempos y condiciones. ¿Quieres que la abra?";
    }

    if (action.path === "/devoluciones") {
      return agentModeEnabled
        ? "Te llevo a devoluciones y garantias para revisar cambios, reembolsos y condiciones."
        : "Puedo abrir devoluciones y garantias para que revises cambios y reembolsos. ¿Quieres que la abra?";
    }
  }

  if (productExplanationRequested && targetProduct) {
    const alternative = buildAlternativeLine(comparisonProduct);
    return `${targetProduct.name} es una opcion real de ${targetProduct.categoryName}. ${summarizeProductDescription(
      targetProduct,
    )} Hoy aparece en ${formatCop(targetProduct.price)} y ${buildProductReason(targetProduct)}. ${alternative || ""}`.trim();
  }

  if (comparisonRequested && targetProduct) {
    return buildComparisonAnswer(
      targetProduct,
      comparisonProduct,
      agentModeEnabled,
    );
  }

  if (wantsCheckout) {
    return "Si quieres revisar el carrito o terminar la compra, puedo llevarte directo al checkout dentro del sitio.";
  }

  if (wantsTracking) {
    return "Si quieres revisar el estado de una orden, puedo llevarte a seguimiento dentro del sitio.";
  }

  if (wantsSupport || wantsFaq) {
    return "Puedo llevarte a soporte o a preguntas frecuentes dentro del sitio, segun prefieras.";
  }

  if (wantsShipping) {
    return "Vortixy maneja cobertura nacional, contra entrega y seguimiento del pedido. Si quieres verlo ordenado dentro del sitio, puedo abrirte la pagina de envios.";
  }

  if (wantsReturns) {
    return "Si necesitas revisar cambios, devoluciones o garantias, puedo abrirte esa pagina dentro del sitio para que veas las condiciones publicadas.";
  }

  if (
    /envio|entrega|cobertura|contra entrega|contraentrega|pago|pedido|guia|despacho/i.test(
      normalizedQuery,
    )
  ) {
    return "En Vortixy el pedido se confirma con tus datos, se valida manualmente y el pago contra entrega se realiza al recibir. Tambien puedo llevarte a checkout, seguimiento o soporte si quieres verlo dentro del sitio.";
  }

  if (wantsCapabilityOverview(latestUserMessage)) {
    const categoryList = snapshot.categories
      .slice(0, 4)
      .map((category) => category.name)
      .join(", ");
    const topProducts = sortProductsByPriority(snapshot.products)
      .slice(0, 2)
      .map((product) => product.name)
      .join(" y ");

    return `Puedo hacer cosas utiles de verdad: ubicarte en categorias y productos reales, explicarte un producto actual, compararlo con otra opcion del catalogo, agregarte al carrito, dejarte en checkout y llevarte a paginas como envios, seguimiento o soporte. Ahora mismo tengo contexto vivo de categorias como ${categoryList} y productos destacados como ${topProducts}.`;
  }

  if (isGreeting(latestUserMessage)) {
    return "Hola. Puedo ayudarte con productos reales, categorias activas, comparaciones, carrito, checkout, pagos, envios y navegacion dentro de la tienda. Si quieres, dime una categoria, un producto o lo que buscas y te ubico.";
  }

  if (recommendationRequested) {
    const recommended = pickRecommendedProduct(
      latestUserMessage,
      page,
      snapshot,
      categoryMatch || focus.category,
    );

    if (recommended) {
      const alternative = buildAlternativeLine(
        pickComparisonProduct(recommended, snapshot),
      );
      return `La recomendacion principal que veo ahora mismo es ${recommended.name}, ${buildProductReason(
        recommended,
      )}. ${alternative || ""} Si quieres, te abro la principal o la alternativa.`;
    }
  }

  if (productMatches.length > 0) {
    const topMatches = productMatches
      .slice(0, 3)
      .map((product) => `${product.name} (${formatCop(product.price)})`)
      .join(", ");
    return `Encontre opciones reales del catalogo para eso: ${topMatches}. Si quieres, dime cual te interesa y te llevo directo a la ficha, al carrito o al checkout.`;
  }

  if (categoryMatch) {
    return `Veo la categoria ${categoryMatch.name} activa, con ${categoryMatch.productCount} productos publicados. Si quieres, te llevo directo a esa zona o te recomiendo una opcion puntual.`;
  }

  const topProducts = sortProductsByPriority(snapshot.products)
    .slice(0, 3)
    .map((product) => product.name)
    .join(", ");

  return `Puedo ayudarte a ubicar productos y categorias reales del catalogo actual. Ahora mismo destacan opciones como ${topProducts}. Si me dices que buscas, te llevo a la mejor coincidencia, te comparo opciones o preparo el siguiente paso de compra.`;
}

function buildCatalogSummary(
  latestUserMessage: string,
  page: PageDescriptor,
  snapshot: StorefrontSnapshot,
  action: AssistantAction | null,
): string {
  const categoryMatch =
    findCategoryMatches(latestUserMessage, snapshot)[0] || null;
  const mentionedProducts = searchProducts(latestUserMessage, snapshot, 6);
  const priorityProducts: StorefrontProduct[] = [];

  if (page.product) {
    priorityProducts.push(page.product);
  }

  if (page.category) {
    priorityProducts.push(
      ...getTopProductsForCategory(page.category.id, snapshot).slice(0, 4),
    );
  }

  if (categoryMatch) {
    priorityProducts.push(
      ...getTopProductsForCategory(categoryMatch.id, snapshot).slice(0, 4),
    );
  }

  priorityProducts.push(...mentionedProducts);
  priorityProducts.push(
    ...sortProductsByPriority(snapshot.products).slice(0, 6),
  );

  const uniqueProducts = Array.from(
    new Map(priorityProducts.map((product) => [product.id, product])).values(),
  ).slice(0, 10);

  const categories = snapshot.categories
    .map(
      (category) =>
        `- ${category.name} | slug: ${category.slug} | ruta: /categoria/${category.slug} | productos activos: ${category.productCount}`,
    )
    .join("\n");

  const products = uniqueProducts
    .map((product) => {
      const badges = [
        product.isBestseller ? "bestseller" : null,
        product.isFeatured ? "destacado" : null,
        product.reviewsCount > 0
          ? `reviews: ${product.reviewsCount}, rating: ${product.averageRating.toFixed(1)}`
          : "sin reviews visibles",
      ]
        .filter(Boolean)
        .join(" | ");

      return `- ${product.name} | slug: ${product.slug} | categoria: ${product.categoryName} | ruta: /producto/${product.slug} | precio: ${formatCop(product.price)} | ${badges}`;
    })
    .join("\n");

  const actionLine = action
    ? action.type === "navigate"
      ? `Accion sugerida local: ${action.title} -> ${action.path}${action.sectionId ? `#${action.sectionId}` : ""}`
      : `Accion sugerida local: ${action.title} -> carrito (${action.product.name})`
    : "Accion sugerida local: ninguna";

  return [
    actionLine,
    "Categorias activas:",
    categories,
    "Productos candidatos del catalogo actual:",
    products,
    "Guia de respuesta:",
    "- Prioriza una respuesta breve, exacta y accionable.",
    "- Si hay accion local, explica el siguiente paso y evita dar rodeos.",
  ].join("\n");
}

function buildNavigationSummary(page: PageDescriptor): string {
  const lines = [
    "- Inicio: / con secciones #categorias y #productos.",
    "- Categoria: /categoria/{slug}. En categoria existe la seccion #catalogo.",
    "- Producto: /producto/{slug}.",
    "- Checkout: /checkout.",
    "- Envios: /envios.",
    "- Devoluciones: /devoluciones.",
    "- Seguimiento: /seguimiento.",
    "- Soporte: /soporte.",
    "- FAQ: /faq.",
    `Pagina actual: ${page.label} (${page.path}).`,
  ];

  if (page.sections.length > 0) {
    lines.push(
      `Secciones utiles en la pagina actual: ${page.sections
        .map((section) => `${section.label} (#${section.id})`)
        .join(", ")}.`,
    );
  }

  return lines.join("\n");
}

export async function getChatbotStorefrontContext(input: {
  agentModeEnabled?: boolean;
  conversationMessages?: ConversationMessage[];
  latestUserMessage: string;
  pageUrl: string;
}): Promise<ChatbotStorefrontContext> {
  const snapshot = await getCachedStorefrontSnapshot();
  const page = parsePageDescriptor(input.pageUrl, snapshot);
  const conversationMessages = Array.isArray(input.conversationMessages)
    ? input.conversationMessages
    : [];
  const action = inferAssistantAction(
    input.latestUserMessage,
    page,
    snapshot,
    conversationMessages,
  );
  const preferLocalResponse =
    Boolean(action) ||
    shouldPreferLocalStorefrontAnswer(input.latestUserMessage) ||
    wantsProductExplanation(input.latestUserMessage) ||
    wantsComparison(input.latestUserMessage);

  return {
    action,
    currentPageSummary: page.summary,
    fallbackAnswer: buildFallbackAnswer(
      input.latestUserMessage,
      page,
      snapshot,
      action,
      Boolean(input.agentModeEnabled),
      conversationMessages,
    ),
    navigationSummary: buildNavigationSummary(page),
    catalogSummary: buildCatalogSummary(
      input.latestUserMessage,
      page,
      snapshot,
      action,
    ),
    preferLocalResponse,
  };
}
