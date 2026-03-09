import type { ProductReview } from "@/types";

function daysAgo(days: number): string {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value.toISOString();
}

function buildReview(
  productId: string,
  index: number,
  payload: {
    reviewer_name: string;
    rating: number;
    title: string;
    body: string;
    variant?: string | null;
    days_ago: number;
  }
): ProductReview {
  const createdAt = daysAgo(payload.days_ago);
  return {
    id: `rev-${productId}-${index}`,
    product_id: productId,
    order_id: null,
    reviewer_name: payload.reviewer_name,
    rating: payload.rating,
    title: payload.title,
    body: payload.body,
    variant: payload.variant ?? null,
    is_verified_purchase: true,
    is_approved: true,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

export const MOCK_REVIEWS_BY_PRODUCT_ID: Record<string, ProductReview[]> = {
  "prod-1": [
    buildReview("prod-1", 1, {
      reviewer_name: "Camilo R.",
      rating: 5,
      title: "Buen sonido por el precio",
      body: "Llegaron bien empacados, se conectan rápido y el micrófono suena claro en llamadas.",
      variant: "Negro",
      days_ago: 8,
    }),
    buildReview("prod-1", 2, {
      reviewer_name: "Diana M.",
      rating: 4,
      title: "Cómodos para uso diario",
      body: "Los uso para trabajar y han salido estables. La batería me da para casi todo el día.",
      variant: "Negro",
      days_ago: 16,
    }),
  ],
  "prod-2": [
    buildReview("prod-2", 1, {
      reviewer_name: "Jhon F.",
      rating: 5,
      title: "Muy cómoda para jornada larga",
      body: "La armé en menos de una hora y el respaldo se siente firme. El cojín lumbar ayuda bastante.",
      variant: "Negro Rojo",
      days_ago: 6,
    }),
    buildReview("prod-2", 2, {
      reviewer_name: "Paula C.",
      rating: 4,
      title: "Buena relación calidad/precio",
      body: "Para home office me funcionó súper bien. Las ruedas se mueven suave y no rechinan.",
      variant: "Negro",
      days_ago: 11,
    }),
    buildReview("prod-2", 3, {
      reviewer_name: "Andrés V.",
      rating: 5,
      title: "Se ve mejor en persona",
      body: "Los acabados se ven bien y no se siente inestable. Recomendable para escritorio gamer.",
      variant: "Rosa",
      days_ago: 20,
    }),
  ],
  "prod-3": [
    buildReview("prod-3", 1, {
      reviewer_name: "Laura G.",
      rating: 5,
      title: "Capacidad grande de verdad",
      body: "Me gustó que caben varias porciones. El control de temperatura es fácil de usar.",
      variant: "Acero Inoxidable/Negro",
      days_ago: 7,
    }),
    buildReview("prod-3", 2, {
      reviewer_name: "Miguel S.",
      rating: 4,
      title: "Cocina rápido",
      body: "La usamos casi todos los días. Se limpia fácil y no ocupa tanto como pensaba.",
      variant: "Acero Inoxidable/Negro",
      days_ago: 14,
    }),
  ],
  "prod-4": [
    buildReview("prod-4", 1, {
      reviewer_name: "Sofía P.",
      rating: 4,
      title: "Pantalla grande y clara",
      body: "Las notificaciones se ven bien y la correa se siente cómoda durante el día.",
      variant: "Naranja",
      days_ago: 9,
    }),
    buildReview("prod-4", 2, {
      reviewer_name: "Daniel T.",
      rating: 5,
      title: "Cumplió lo esperado",
      body: "Me gustó el diseño y la respuesta táctil. Para actividad diaria funciona perfecto.",
      variant: "Naranja",
      days_ago: 18,
    }),
  ],
  "prod-5": [
    buildReview("prod-5", 1, {
      reviewer_name: "Natalia B.",
      rating: 5,
      title: "Se instala como un bombillo común",
      body: "La puse en el pasillo de la casa y se ve todo desde el celular. La visión nocturna funciona muy bien.",
      variant: "E27 (Estándar)",
      days_ago: 10,
    }),
    buildReview("prod-5", 2, {
      reviewer_name: "Óscar M.",
      rating: 4,
      title: "Buena calidad de imagen",
      body: "Se conectó fácil al WiFi y las alertas de movimiento llegan al momento. Muy práctica para vigilar la entrada.",
      variant: "E27 (Estándar)",
      days_ago: 17,
    }),
  ],
  "prod-6": [
    buildReview("prod-6", 1, {
      reviewer_name: "Valentina H.",
      rating: 5,
      title: "Práctico para alistarme rápido",
      body: "Me sirve para secar y dar forma sin usar tantas herramientas. El cabello queda con menos frizz.",
      variant: "Negro",
      days_ago: 5,
    }),
    buildReview("prod-6", 2, {
      reviewer_name: "Karla R.",
      rating: 4,
      title: "Buena opción en casa",
      body: "Los accesorios ayudan para varios estilos. Lo recomiendo para uso diario en cabello medio.",
      variant: "Negro",
      days_ago: 13,
    }),
  ],
  "prod-7": [
    buildReview("prod-7", 1, {
      reviewer_name: "Marcela V.",
      rating: 5,
      title: "Sí baja bastante los zancudos",
      body: "La pongo en la sala por las noches y se nota el cambio. Es silenciosa y fácil de limpiar.",
      variant: "Blanco",
      days_ago: 4,
    }),
    buildReview("prod-7", 2, {
      reviewer_name: "Javier N.",
      rating: 4,
      title: "Buena para habitaciones",
      body: "Me sirvió para el cuarto. Recomiendo ubicarla cerca de la ventana para mejor resultado.",
      variant: "Blanco",
      days_ago: 12,
    }),
  ],
  "prod-8": [
    buildReview("prod-8", 1, {
      reviewer_name: "Felipe D.",
      rating: 5,
      title: "Buena succión para el carro",
      body: "La uso en el carro y para el escritorio. Tiene buena fuerza para polvo y migas.",
      variant: "Único",
      days_ago: 6,
    }),
    buildReview("prod-8", 2, {
      reviewer_name: "Luisa M.",
      rating: 4,
      title: "Compacta y útil",
      body: "Es liviana y se guarda fácil. El depósito se limpia rápido y no ocupa espacio.",
      variant: "Único",
      days_ago: 15,
    }),
  ],
  "prod-9": [
    buildReview("prod-9", 1, {
      reviewer_name: "Carlos E.",
      rating: 5,
      title: "Me resolvió todos los cables",
      body: "Carga celular y accesorios sin llevar tantos cargadores. Muy práctico para viaje.",
      variant: "Único",
      days_ago: 7,
    }),
    buildReview("prod-9", 2, {
      reviewer_name: "Paola T.",
      rating: 4,
      title: "Carga estable",
      body: "Lo uso en la oficina y no he tenido cortes. El cable se siente resistente.",
      variant: "Único",
      days_ago: 19,
    }),
  ],
  "prod-10": [
    buildReview("prod-10", 1, {
      reviewer_name: "Andrea G.",
      rating: 5,
      title: "Suave y fácil de usar",
      body: "No irrita la piel y sirve bien para retoques rápidos en el rostro.",
      variant: "Único",
      days_ago: 9,
    }),
    buildReview("prod-10", 2, {
      reviewer_name: "Diana P.",
      rating: 4,
      title: "Bueno para bolso",
      body: "Es pequeño y recargable. Me gustaron la luz y la brocha de limpieza.",
      variant: "Único",
      days_ago: 21,
    }),
  ],
};
