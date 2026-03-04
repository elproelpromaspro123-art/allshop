import type { Product, Category } from "@/types";

export const CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "Cocina",
    slug: "cocina",
    description: "Accesorios practicos para tu cocina diaria",
    image_url: "/categories/cocina.jpg",
    icon: "ChefHat",
    color: "#F97316",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-2",
    name: "Tecnologia",
    slug: "tecnologia",
    description: "Gadgets y accesorios utiles para tu dia a dia",
    image_url: "/categories/tecnologia.jpg",
    icon: "Smartphone",
    color: "#3B82F6",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-3",
    name: "Hogar",
    slug: "hogar",
    description: "Productos utiles y duraderos para el hogar",
    image_url: "/categories/hogar.jpg",
    icon: "Home",
    color: "#10B981",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-4",
    name: "Belleza",
    slug: "belleza",
    description: "Cuidado personal y bienestar",
    image_url: "/categories/belleza.jpg",
    icon: "Sparkles",
    color: "#EC4899",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-5",
    name: "Fitness",
    slug: "fitness",
    description: "Accesorios para mantenerte activo",
    image_url: "/categories/fitness.jpg",
    icon: "Dumbbell",
    color: "#8B5CF6",
    created_at: new Date().toISOString(),
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "prod-stanley-termo-40oz",
    name: "Termo Stanley 40 oz",
    slug: "termo-stanley-40oz",
    description:
      "Replica Triple A de termo estilo Stanley 40 oz con tapa antigoteo y manija ergonomica. Conserva mejor la temperatura y esta fabricado con materiales libres de BPA.",
    price: 119_000,
    compare_at_price: 169_900,
    category_id: "cat-3",
    images: [
      "/products/stanley/stanley-hero.png",
      "/products/stanley/stanley-lila.png",
      "/products/stanley/stanley-fucsia.png",
      "/products/stanley/stanley-beige.png",
    ],
    variants: [{ name: "Color", options: ["Lila", "Fucsia", "Beige"] }],
    stock_location: "nacional",
    free_shipping: true,
    provider_api_url: null,
    is_featured: true,
    is_active: true,
    meta_title: "Termo Stanley 40 oz | Vortixy Colombia",
    meta_description:
      "Replica Triple A de termo estilo Stanley 40 oz en colores lila, fucsia y beige. Precio fijo de $119.000 COP con envio nacional gratis.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
