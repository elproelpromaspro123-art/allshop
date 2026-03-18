import "server-only";

import { unstable_cache } from "next/cache";
import {
  isGreeting,
  shouldPreferLocalStorefrontAnswer,
  wantsCapabilityOverview,
  wantsCheckoutPage,
  wantsFaqPage,
  wantsHumanSupport,
  wantsSupportPage,
  wantsTrackingPage,
} from "@/lib/chatbot-intent";
import { getCategories, getProducts } from "@/lib/db";
import { SUPPORT_EMAIL, WHATSAPP_PHONE, getBaseUrl } from "@/lib/site";
import type { AssistantAction } from "@/lib/chatbot-types";
import type { Category, Product } from "@/types";

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
  price: number;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
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
  kind: "category" | "checkout" | "faq" | "home" | "other" | "product" | "support" | "tracking";
  path: string;
  label: string;
  summary: string;
  sections: Array<{ id: string; label: string }>;
  category?: StorefrontCategory | null;
  product?: StorefrontProduct | null;
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

function sortProductsByPriority(products: StorefrontProduct[]): StorefrontProduct[] {
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

function buildSnapshot(categories: Category[], products: Product[]): StorefrontSnapshot {
  const activeProducts = products.filter((product) => product.is_active !== false);
  const productsByCategory = new Map<string, number>();

  for (const product of activeProducts) {
    const categoryId = String(product.category_id || "").trim();
    if (!categoryId) {
      continue;
    }

    productsByCategory.set(categoryId, (productsByCategory.get(categoryId) || 0) + 1);
  }

  const mappedCategories: StorefrontCategory[] = categories.map((category) => ({
    id: category.id,
    name: String(category.name || "").trim(),
    slug: String(category.slug || "").trim(),
    description: String(category.description || "").trim(),
    productCount: productsByCategory.get(category.id) || 0,
  }));

  const categoryById = new Map(mappedCategories.map((category) => [category.id, category]));

  const mappedProducts: StorefrontProduct[] = activeProducts.map((product) => {
    const category = categoryById.get(String(product.category_id || "").trim());

    return {
      id: product.id,
      name: String(product.name || "").trim(),
      slug: String(product.slug || "").trim(),
      description: String(product.description || "").trim(),
      price: Math.max(0, Number(product.price) || 0),
      categoryId: String(product.category_id || "").trim(),
      categoryName: category?.name || "Sin categoria",
      categorySlug: category?.slug || "",
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
    const [categories, products] = await Promise.all([getCategories(), getProducts()]);
    return buildSnapshot(categories, products);
  },
  ["chatbot-storefront-snapshot"],
  { revalidate: 60 }
);

function parsePageDescriptor(pageUrl: string, snapshot: StorefrontSnapshot): PageDescriptor {
  const baseUrl = getBaseUrl();
  const fallbackUrl = `${baseUrl}/`;
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(pageUrl || fallbackUrl, fallbackUrl);
  } catch {
    parsedUrl = new URL(fallbackUrl);
  }

  const path = parsedUrl.pathname || "/";
  const categoryBySlug = new Map(snapshot.categories.map((category) => [category.slug, category]));
  const productBySlug = new Map(snapshot.products.map((product) => [product.slug, product]));

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
      summary: "Estas en checkout, donde el usuario confirma datos, direccion y pedido contra entrega.",
      sections: [],
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
      sections: [],
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

  return {
    kind: "other",
    path,
    label: "Pagina actual",
    summary: `Estas en ${path}.`,
    sections: [],
  };
}

function searchProducts(query: string, snapshot: StorefrontSnapshot, limit = 8): StorefrontProduct[] {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);

  if (!normalizedQuery) {
    return sortProductsByPriority(snapshot.products).slice(0, limit);
  }

  const scored = snapshot.products
    .map((product) => {
      const haystack = normalizeText(
        `${product.name} ${product.slug} ${product.categoryName} ${product.description}`
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

      return sortProductsByPriority([left.product, right.product])[0].id === left.product.id
        ? -1
        : 1;
    });

  return scored.slice(0, limit).map((entry) => entry.product);
}

function findCategoryMatches(query: string, snapshot: StorefrontSnapshot): StorefrontCategory[] {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);

  return snapshot.categories
    .map((category) => {
      let score = 0;
      const categoryName = normalizeText(category.name);
      const categorySlug = normalizeText(category.slug);

      if (normalizedQuery.includes(categoryName) || normalizedQuery.includes(categorySlug)) {
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
  return /(abr|abre|abrime|gui|guia|guia me|ir a|entra|llev|ll[eé]vame|mostrar|muestrame|mandame|quiero ver|quiero ir|open)/i.test(
    normalizeText(query)
  );
}

function wantsRecommendation(query: string): boolean {
  return /(recomend|algo bueno|mejor producto|que me recomiendes|que recomiendas|cual me recomiendas)/i.test(
    normalizeText(query)
  );
}

function getTopProductsForCategory(categoryId: string, snapshot: StorefrontSnapshot): StorefrontProduct[] {
  return sortProductsByPriority(
    snapshot.products.filter((product) => product.categoryId === categoryId)
  );
}

function pickRecommendedProduct(
  query: string,
  page: PageDescriptor,
  snapshot: StorefrontSnapshot,
  categoryMatch: StorefrontCategory | null
): StorefrontProduct | null {
  if (categoryMatch) {
    return getTopProductsForCategory(categoryMatch.id, snapshot)[0] || null;
  }

  if (page.category) {
    return getTopProductsForCategory(page.category.id, snapshot)[0] || null;
  }

  if (page.product) {
    const sameCategory = getTopProductsForCategory(page.product.categoryId, snapshot).filter(
      (product) => product.id !== page.product?.id
    );
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
  targetType: AssistantAction["targetType"];
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

function inferAssistantAction(
  latestUserMessage: string,
  page: PageDescriptor,
  snapshot: StorefrontSnapshot
): AssistantAction | null {
  const normalizedQuery = normalizeText(latestUserMessage);
  const queryTokens = tokenize(latestUserMessage);
  const categoryMatch = findCategoryMatches(latestUserMessage, snapshot)[0] || null;
  const productMatches = searchProducts(latestUserMessage, snapshot, 3);
  const navigationRequested = wantsNavigation(latestUserMessage);
  const recommendationRequested = wantsRecommendation(latestUserMessage);
  const shortDirectRequest = queryTokens.length > 0 && queryTokens.length <= 3;
  const wantsCheckout = wantsCheckoutPage(latestUserMessage);
  const wantsTracking = wantsTrackingPage(latestUserMessage);
  const wantsSupport = wantsSupportPage(latestUserMessage);
  const wantsFaq = wantsFaqPage(latestUserMessage);

  if (wantsCheckout && (navigationRequested || shortDirectRequest || page.kind !== "checkout")) {
    return buildNavigateAction({
      path: "/checkout",
      targetType: "page",
      title: "Ir al checkout",
      label: "Abrir checkout",
      description: "Te lleva al carrito y checkout para revisar el pedido y completar tus datos.",
    });
  }

  if (wantsTracking && (navigationRequested || shortDirectRequest || page.kind !== "tracking")) {
    return buildNavigateAction({
      path: "/seguimiento",
      targetType: "page",
      title: "Ir a seguimiento",
      label: "Abrir seguimiento",
      description: "Te lleva a la pagina de seguimiento para consultar el estado del pedido.",
    });
  }

  if (wantsSupport && navigationRequested && page.kind !== "support") {
    return buildNavigateAction({
      path: "/soporte",
      targetType: "page",
      title: "Ir a soporte",
      label: "Abrir soporte",
      description: "Te lleva a soporte y contacto para feedback o ayuda detallada.",
    });
  }

  if (wantsFaq && navigationRequested && page.kind !== "faq") {
    return buildNavigateAction({
      path: "/faq",
      targetType: "page",
      title: "Ir a preguntas frecuentes",
      label: "Abrir FAQ",
      description: "Te lleva a preguntas frecuentes para resolver dudas comunes.",
    });
  }

  if (categoryMatch && (navigationRequested || /categoria/.test(normalizedQuery) || shortDirectRequest)) {
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
      categoryMatch
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
      `tiene ${product.reviewsCount} reviews visibles y rating promedio de ${product.averageRating.toFixed(1)}`
    );
  } else {
    reasons.push(`pertenece a la categoria ${product.categoryName}`);
  }

  return reasons.slice(0, 2).join(", ");
}

function buildFallbackAnswer(
  latestUserMessage: string,
  page: PageDescriptor,
  snapshot: StorefrontSnapshot,
  action: AssistantAction | null,
  agentModeEnabled: boolean
): string {
  const normalizedQuery = normalizeText(latestUserMessage);
  const categoryMatch = findCategoryMatches(latestUserMessage, snapshot)[0] || null;
  const productMatches = searchProducts(latestUserMessage, snapshot, 3);
  const recommendationRequested = wantsRecommendation(latestUserMessage);
  const wantsCheckout = wantsCheckoutPage(latestUserMessage);
  const wantsTracking = wantsTrackingPage(latestUserMessage);
  const wantsSupport = wantsSupportPage(latestUserMessage);
  const wantsFaq = wantsFaqPage(latestUserMessage);

  if (wantsHumanSupport(latestUserMessage)) {
    return `Si prefieres atencion humana, puedes escribir ahora mismo a WhatsApp al +${WHATSAPP_PHONE} o al correo ${SUPPORT_EMAIL}. Si quieres, tambien puedo llevarte primero a una categoria o producto antes de escalarlo.`;
  }

  if (action?.targetType === "category") {
    const categorySlug = action.path.replace("/categoria/", "").split("/")[0] || "";
    const category = snapshot.categories.find((item) => item.slug === categorySlug) || categoryMatch;

    if (category) {
      return agentModeEnabled
        ? `Te llevo a ${category.name}. Esa categoria tiene ${category.productCount} productos activos en este momento.`
        : `Puedo llevarte a ${category.name}. Esa categoria tiene ${category.productCount} productos activos ahora mismo. ¿Quieres que la abra?`;
    }
  }

  if (action?.targetType === "product") {
    const productSlug = action.path.replace("/producto/", "").split("/")[0] || "";
    const product =
      snapshot.products.find((item) => item.slug === productSlug) || productMatches[0] || null;

    if (product) {
      const reason = buildProductReason(product);

      if (recommendationRequested) {
        return agentModeEnabled
          ? `Mi recomendacion real ahora mismo es ${product.name}, ${reason}. Ya te llevo a su ficha.`
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

  if (wantsCheckout) {
    return "Si quieres revisar el carrito o terminar la compra, puedo llevarte directo al checkout dentro del sitio.";
  }

  if (wantsTracking) {
    return "Si quieres revisar el estado de una orden, puedo llevarte a seguimiento dentro del sitio.";
  }

  if (wantsSupport || wantsFaq) {
    return "Puedo llevarte a soporte o a preguntas frecuentes dentro del sitio, segun prefieras.";
  }

  if (/envio|entrega|cobertura|contra entrega|contraentrega|pago|pedido|guia|despacho/i.test(normalizedQuery)) {
    return "En Vortixy el pedido se confirma con tus datos, se valida manualmente y el pago contra entrega se realiza al recibir. Tambien puedo llevarte a checkout, seguimiento o soporte si quieres verlo dentro del sitio.";
  }

  if (recommendationRequested) {
    const recommended = pickRecommendedProduct(latestUserMessage, page, snapshot, categoryMatch);

    if (recommended) {
      return `La mejor recomendacion que veo ahora mismo es ${recommended.name}, ${buildProductReason(
        recommended
      )}. Si quieres, te lo abro para que revises la ficha completa.`;
    }
  }

  if (productMatches.length > 0) {
    const topMatches = productMatches
      .slice(0, 3)
      .map((product) => `${product.name} (${formatCop(product.price)})`)
      .join(", ");

    return `Encontré opciones reales del catalogo para eso: ${topMatches}. Si quieres, dime cual te interesa y te llevo directo a la ficha.`;
  }

  if (categoryMatch) {
    return `Veo la categoria ${categoryMatch.name} activa, con ${categoryMatch.productCount} productos publicados. Si quieres, te llevo directo a esa zona.`;
  }

  if (wantsCapabilityOverview(latestUserMessage)) {
    const categoryList = snapshot.categories
      .slice(0, 5)
      .map((category) => category.name)
      .join(", ");

    return `Puedo ubicarte en categorias y productos reales del sitio, recomendarte opciones del catalogo actual y llevarte a paginas utiles como seguimiento o soporte. Ahora mismo tengo contexto vivo de categorias como ${categoryList}.`;
  }

  if (isGreeting(latestUserMessage)) {
    return "Hola. Puedo ayudarte con productos reales, categorias activas, pagos, envios y navegacion dentro de la tienda. Si quieres, dime una categoria, un producto o lo que buscas y te ubico.";
  }

  const topProducts = sortProductsByPriority(snapshot.products)
    .slice(0, 3)
    .map((product) => product.name)
    .join(", ");

  return `Puedo ayudarte a ubicar productos y categorias reales del catalogo actual. Ahora mismo destacan opciones como ${topProducts}. Si me dices que buscas, te llevo a la mejor coincidencia.`;
}

function buildCatalogSummary(
  latestUserMessage: string,
  page: PageDescriptor,
  snapshot: StorefrontSnapshot,
  action: AssistantAction | null
): string {
  const categoryMatch = findCategoryMatches(latestUserMessage, snapshot)[0] || null;
  const mentionedProducts = searchProducts(latestUserMessage, snapshot, 6);
  const priorityProducts: StorefrontProduct[] = [];

  if (page.product) {
    priorityProducts.push(page.product);
  }

  if (page.category) {
    priorityProducts.push(...getTopProductsForCategory(page.category.id, snapshot).slice(0, 4));
  }

  if (categoryMatch) {
    priorityProducts.push(...getTopProductsForCategory(categoryMatch.id, snapshot).slice(0, 4));
  }

  priorityProducts.push(...mentionedProducts);
  priorityProducts.push(...sortProductsByPriority(snapshot.products).slice(0, 6));

  const uniqueProducts = Array.from(
    new Map(priorityProducts.map((product) => [product.id, product])).values()
  ).slice(0, 10);

  const categories = snapshot.categories
    .map(
      (category) =>
        `- ${category.name} | slug: ${category.slug} | ruta: /categoria/${category.slug} | productos activos: ${category.productCount}`
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
    ? `Accion sugerida local: ${action.title} -> ${action.path}${action.sectionId ? `#${action.sectionId}` : ""}`
    : "Accion sugerida local: ninguna";

  return [actionLine, "Categorias activas:", categories, "Productos candidatos del catalogo actual:", products].join(
    "\n"
  );
}

function buildNavigationSummary(page: PageDescriptor): string {
  const lines = [
    "- Inicio: / con secciones #categorias y #productos.",
    "- Categoria: /categoria/{slug}. En categoria existe la seccion #catalogo.",
    "- Producto: /producto/{slug}.",
    "- Checkout: /checkout.",
    "- Seguimiento: /seguimiento.",
    "- Soporte: /soporte.",
    "- FAQ: /faq.",
    `Pagina actual: ${page.label} (${page.path}).`,
  ];

  if (page.sections.length > 0) {
    lines.push(
      `Secciones utiles en la pagina actual: ${page.sections
        .map((section) => `${section.label} (#${section.id})`)
        .join(", ")}.`
    );
  }

  return lines.join("\n");
}

export async function getChatbotStorefrontContext(input: {
  agentModeEnabled?: boolean;
  latestUserMessage: string;
  pageUrl: string;
}): Promise<ChatbotStorefrontContext> {
  const snapshot = await getCachedStorefrontSnapshot();
  const page = parsePageDescriptor(input.pageUrl, snapshot);
  const action = inferAssistantAction(input.latestUserMessage, page, snapshot);
  const preferLocalResponse =
    Boolean(action) || shouldPreferLocalStorefrontAnswer(input.latestUserMessage);

  return {
    action,
    currentPageSummary: page.summary,
    fallbackAnswer: buildFallbackAnswer(
      input.latestUserMessage,
      page,
      snapshot,
      action,
      Boolean(input.agentModeEnabled)
    ),
    navigationSummary: buildNavigationSummary(page),
    catalogSummary: buildCatalogSummary(input.latestUserMessage, page, snapshot, action),
    preferLocalResponse,
  };
}
