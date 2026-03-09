export interface ProductSocialProof {
  rating: number;
  reviewCount: number;
  badge: string;
}

export interface ProductPageContent {
  highlights: string[];
  guaranteeItems: string[];
  socialProof: ProductSocialProof;
}

const PRODUCT_HIGHLIGHTS_BY_SLUG: Record<string, string[]> = {
  "audifonos-xiaomi-redmi-buds-4-lite": [
    "Bluetooth 5.3 con conexion rapida y estable.",
    "Hasta 20 horas de reproduccion con el estuche.",
    "Bateria de larga duracion de 35 mAh por auricular.",
    "Diseno semi in-ear ligero y ergonomico.",
    "Resistencia IP54 contra sudor y lluvia.",
    "Tecnologia avanzada de reduccion de ruido en llamadas.",
  ],
  "silla-gamer-premium-reposapies": [
    "Diseno ergonomico con soporte lumbar y cojin cervical.",
    "Reclinacion de hasta 135 grados para trabajo o descanso.",
    "Altura ajustable con apoyabrazos comodos para uso diario.",
    "Reposapies extensible para mayor comodidad entre sesiones.",
    "Base robusta con ruedas giratorias de 360 grados.",
    "Disponible en varios colores para combinar con tu setup.",
  ],
  "air-fryer-freidora-10l-premium": [
    "Capacidad XL de 10 litros para porciones grandes.",
    "Coccion uniforme y rapida con sistema de alto rendimiento.",
    "Estructura en acero inoxidable resistente y facil de limpiar.",
    "Control de temperatura ajustable para diferentes recetas.",
    "Canastilla desmontable con mango ergonomico antideslizante.",
    "Tapa con filtro anti-salpicaduras para una preparacion mas limpia.",
  ],
  "smartwatch-ultra-series-pantalla-grande": [
    "Pantalla tactil de formato grande para lectura clara diaria.",
    "Carcasa rectangular robusta de aprox. 4.9 x 4.2 x 1.2 cm.",
    "Registro de actividad fisica y funciones deportivas basicas.",
    "Monitoreo basico de funciones corporales.",
    "Bateria recargable integrada para uso continuo.",
    "Correa de silicona ajustable e intercambiable.",
  ],
  "camara-seguridad-bombillo-360-wifi": [
    "Facil instalacion tipo bombillo E27 estandar.",
    "Conexion WiFi inalambrica para vista remota en vivo.",
    "Vision nocturna por infrarrojos de alta definicion.",
    "Audio bidireccional para hablar e interactuar en tiempo real.",
    "Rotacion de 355 horizontal y 90 vertical.",
    "Ideal como monitor de bebe o seguridad del hogar/negocio.",
  ],
  "cepillo-electrico-5-en-1-secador-alisador": [
    "Herramienta 5 en 1 para secar, alisar, ondular y dar volumen.",
    "Incluye accesorios intercambiables para distintos tipos de peinado.",
    "Tres niveles de temperatura para adaptar calor y flujo de aire.",
    "Control manual para crear ondas con mayor precision.",
    "Ayuda a reducir frizz y mejorar suavidad y brillo del cabello.",
    "Funciona en diferentes largos y tipos de cabello.",
  ],
  "lampara-mata-zancudos-electrica": [
    "Luz UV para atraer zancudos y rejilla electrica de eliminacion inmediata.",
    "Operacion silenciosa para uso en habitaciones, cocina o sala.",
    "Diseno compacto para mesa de noche, escritorio o zona de descanso.",
    "Consumo electrico bajo para uso prolongado en interiores.",
    "Recipiente de residuos facil de desmontar y limpiar.",
    "Ideal para temporadas de lluvia y zonas de alta presencia de insectos.",
  ],
  "aspiradora-inalambrica-de-mano": [
    "Aspiradora inalambrica 3 en 1 para hogar, carro y oficina.",
    "Incluye boquilla ancha, cepillo y boquilla plana para rincones.",
    "Diseno compacto de facil agarre para limpiezas rapidas.",
    "Deposito desmontable para vaciado y limpieza sin complicaciones.",
    "Filtro lavable para mantenimiento practico en uso frecuente.",
    "Bateria recargable para sesiones de limpieza sin cable.",
  ],
  "combo-cargador-4-en-1-adaptadorcable": [
    "Cable multifuncional 4 en 1 compatible con USB-A, USB-C y Lightning.",
    "Carga rapida para multiples dispositivos desde un solo accesorio.",
    "Transferencia de datos estable para sincronizacion diaria.",
    "Cable reforzado y flexible para mayor durabilidad.",
    "Diseno anti-enredos para transporte y uso continuo.",
    "Ideal para oficina, viaje y uso en casa.",
  ],
  "depilador-facial-electrico-recargable": [
    "Diseno tipo labial para depilacion facial discreta y practica.",
    "Luz integrada para mayor precision en retoques diarios.",
    "Uso suave para zona de labio superior, menton y mejillas.",
    "Equipo compacto y liviano para bolso o viaje.",
    "Incluye brocha de limpieza para mantenimiento sencillo.",
    "Alternativa rapida para cuidado personal en casa.",
  ],
};

const PRODUCT_GUARANTEES_BY_SLUG: Record<string, string[]> = {
  "audifonos-xiaomi-redmi-buds-4-lite": [
    "Garantia de 10 dias por defectos de fabrica.",
    "Se requieren fotos del empaque original para reclamaciones.",
  ],
  "silla-gamer-premium-reposapies": [
    "Cobertura por pedido incompleto: 10 dias.",
    "Cobertura por mal funcionamiento: 10 dias.",
    "Cobertura por producto averiado: 10 dias.",
    "Cobertura por pedido diferente: 10 dias.",
  ],
  "air-fryer-freidora-10l-premium": [
    "Cobertura por pedido incompleto: 10 dias.",
    "Cobertura por mal funcionamiento: 90 dias.",
    "Cobertura por producto averiado: 10 dias.",
    "Cobertura por pedido diferente: 10 dias.",
  ],
  "smartwatch-ultra-series-pantalla-grande": [
    "Cobertura por pedido incompleto: 30 dias.",
    "Cobertura por mal funcionamiento: 30 dias.",
    "Cobertura por producto averiado: 30 dias.",
    "Cobertura por pedido diferente: 30 dias.",
  ],
  "camara-seguridad-bombillo-360-wifi": [
    "Cobertura por pedido incompleto: 10 dias.",
    "Cobertura por mal funcionamiento: 10 dias.",
    "Cobertura por producto averiado: 10 dias.",
    "Cobertura por pedido diferente: 10 dias.",
  ],
  "cepillo-electrico-5-en-1-secador-alisador": [
    "Cobertura por pedido incompleto: 10 dias.",
    "Cobertura por mal funcionamiento: 10 dias.",
    "Cobertura por producto averiado: 10 dias.",
    "Cobertura por pedido diferente: 10 dias.",
  ],
  "lampara-mata-zancudos-electrica": [
    "Cobertura por pedido incompleto: 10 dias.",
    "Cobertura por mal funcionamiento: 10 dias.",
    "Cobertura por producto averiado: 10 dias.",
    "Cobertura por pedido diferente: 10 dias.",
  ],
  "aspiradora-inalambrica-de-mano": [
    "Cobertura por pedido incompleto: 10 dias.",
    "Cobertura por mal funcionamiento: 10 dias.",
    "Cobertura por producto averiado: 10 dias.",
    "Cobertura por pedido diferente: 10 dias.",
  ],
  "combo-cargador-4-en-1-adaptadorcable": [
    "Cobertura por pedido incompleto: 10 dias.",
    "Cobertura por mal funcionamiento: 10 dias.",
    "Cobertura por producto averiado: 10 dias.",
    "Cobertura por pedido diferente: 10 dias.",
  ],
  "depilador-facial-electrico-recargable": [
    "Cobertura por pedido incompleto: 10 dias.",
    "Cobertura por mal funcionamiento: 30 dias.",
    "Cobertura por producto averiado: 10 dias.",
    "Cobertura por pedido diferente: 10 dias.",
  ],
};

const PRODUCT_SOCIAL_PROOF_BY_SLUG: Record<string, ProductSocialProof> = {
  "audifonos-xiaomi-redmi-buds-4-lite": {
    rating: 4.8,
    reviewCount: 3412,
    badge: "#1 mas vendido",
  },
  "silla-gamer-premium-reposapies": {
    rating: 4.4,
    reviewCount: 396,
    badge: "Top en setup gamer",
  },
  "air-fryer-freidora-10l-premium": {
    rating: 4.7,
    reviewCount: 842,
    badge: "#1 en busquedas de cocina",
  },
  "smartwatch-ultra-series-pantalla-grande": {
    rating: 4.5,
    reviewCount: 517,
    badge: "Top 5 tecnologia",
  },
  "camara-seguridad-bombillo-360-wifi": {
    rating: 4.8,
    reviewCount: 1541,
    badge: "Alta demanda en seguridad",
  },
  "cepillo-electrico-5-en-1-secador-alisador": {
    rating: 4.5,
    reviewCount: 311,
    badge: "Tendencia en belleza",
  },
  "lampara-mata-zancudos-electrica": {
    rating: 4.6,
    reviewCount: 267,
    badge: "Top en hogar",
  },
  "aspiradora-inalambrica-de-mano": {
    rating: 4.7,
    reviewCount: 192,
    badge: "Top en limpieza",
  },
  "combo-cargador-4-en-1-adaptadorcable": {
    rating: 4.5,
    reviewCount: 158,
    badge: "Alta salida en tecnologia",
  },
  "depilador-facial-electrico-recargable": {
    rating: 4.6,
    reviewCount: 173,
    badge: "Top en cuidado personal",
  },
};

const DEFAULT_HIGHLIGHTS = [
  "Producto revisado para uso diario.",
  "Confirma variante, medidas y compatibilidad antes de comprar.",
  "Consulta soporte si necesitas ayuda antes de confirmar.",
];

const DEFAULT_GUARANTEE_ITEMS = [
  "Cobertura por pedido incompleto: 10 dias.",
  "Cobertura por mal funcionamiento: 10 dias.",
  "Cobertura por producto averiado: 10 dias.",
  "Cobertura por pedido diferente: 10 dias.",
];

const DEFAULT_SOCIAL_PROOF: ProductSocialProof = {
  rating: 4.5,
  reviewCount: 180,
  badge: "Compra verificada",
};

export function getProductPageContent(slug: string): ProductPageContent {
  const normalizedSlug = String(slug || "").trim().toLowerCase();

  return {
    highlights: PRODUCT_HIGHLIGHTS_BY_SLUG[normalizedSlug] ?? DEFAULT_HIGHLIGHTS,
    guaranteeItems:
      PRODUCT_GUARANTEES_BY_SLUG[normalizedSlug] ?? DEFAULT_GUARANTEE_ITEMS,
    socialProof: PRODUCT_SOCIAL_PROOF_BY_SLUG[normalizedSlug] ?? DEFAULT_SOCIAL_PROOF,
  };
}
