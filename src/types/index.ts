export * from "./database";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  variant: string | null;
  quantity: number;
  freeShipping?: boolean;
  stockLocation: "nacional" | "internacional" | "ambos";
}

export interface NicheConfig {
  slug: string;
  name: string;
  tagline: string;
  color: string;
  icon: string;
}

export interface ShippingInfo {
  type: "nacional" | "internacional";
  label: string;
  estimatedDays: string;
  cost: number;
}
