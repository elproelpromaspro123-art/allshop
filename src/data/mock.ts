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

export const PRODUCTS: Product[] = [];
