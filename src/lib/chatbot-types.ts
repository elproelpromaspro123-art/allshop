export interface ChatSource {
  title: string;
  url: string;
  snippet?: string;
  liveViewUrl?: string;
  type: "browser" | "search";
}

export interface AssistantActionProduct {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  freeShipping: boolean;
  shippingCost: number | null;
  stockLocation: "nacional" | "internacional" | "ambos";
}

interface AssistantActionBase {
  id: string;
  title: string;
  label: string;
  description: string;
  requiresConfirmation: boolean;
}

export interface AssistantNavigateAction extends AssistantActionBase {
  type: "navigate";
  targetType: "category" | "page" | "product" | "section";
  path: string;
  sectionId?: string;
}

export interface AssistantCartAction extends AssistantActionBase {
  type: "add_to_cart" | "add_to_cart_and_checkout";
  targetType: "cart";
  path: string;
  quantity?: number;
  product: AssistantActionProduct;
}

export type AssistantAction = AssistantNavigateAction | AssistantCartAction;

export interface ChatResponse {
  answer?: string;
  tools?: string[];
  sources?: ChatSource[];
  action?: AssistantAction | null;
  error?: string;
}
