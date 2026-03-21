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
  "airpods-pro-3": [
    "Cancelación activa de ruido para trayectos, oficina y uso diario.",
    "Traducción en vivo y asistencia auditiva inteligente según compatibilidad.",
    "Detección de frecuencia cardíaca para rutinas y seguimiento básico.",
    "Audio premium con audio espacial y llamadas más claras.",
    "Hasta 30 horas de batería usando el estuche de carga.",
    "Resistencia IPX4 frente a sudor y salpicaduras.",
  ],
  "audifonos-xiaomi-redmi-buds-4-lite": [
    "Bluetooth 5.3 con conexión rápida y estable.",
    "Hasta 20 horas de reproducción con el estuche.",
    "Batería de larga duración de 35 mAh por auricular.",
    "Diseño semi in-ear ligero y ergonómico.",
    "Resistencia IP54 contra sudor y lluvia.",
    "Tecnología avanzada de reducción de ruido en llamadas.",
  ],
  "silla-gamer-premium-reposapies": [
    "Diseño ergonómico con soporte lumbar y cojín cervical.",
    "Reclinación de hasta 135 grados para trabajo o descanso.",
    "Altura ajustable con apoyabrazos cómodos para uso diario.",
    "Reposapies extensible para mayor comodidad entre sesiones.",
    "Base robusta con ruedas giratorias de 360 grados.",
    "Disponible en varios colores para combinar con tu setup.",
  ],
  "air-fryer-freidora-10l-premium": [
    "Capacidad XL de 10 litros para porciones grandes.",
    "Cocción uniforme y rápida con sistema de alto rendimiento.",
    "Estructura en acero inoxidable resistente y fácil de limpiar.",
    "Control de temperatura ajustable para diferentes recetas.",
    "Canastilla desmontable con mango ergonómico antideslizante.",
    "Tapa con filtro anti-salpicaduras para una preparación más limpia.",
  ],
  "smartwatch-ultra-series-pantalla-grande": [
    "Pantalla táctil de formato grande para lectura clara diaria.",
    "Carcasa rectangular robusta de aprox. 4.9 x 4.2 x 1.2 cm.",
    "Registro de actividad física y funciones deportivas básicas.",
    "Monitoreo básico de funciones corporales.",
    "Bateria recargable integrada para uso continuo.",
    "Correa de silicona ajustable e intercambiable.",
  ],
  "camara-seguridad-bombillo-360-wifi": [
    "Fácil instalación tipo bombillo E27 estándar.",
    "Conexión WiFi inalámbrica para vista remota en vivo.",
    "Visión nocturna por infrarrojos de alta definición.",
    "Audio bidireccional para hablar e interactuar en tiempo real.",
    "Rotación de 355° horizontal y 90° vertical.",
    "Ideal como monitor de bebé o seguridad del hogar/negocio.",
  ],
  "cepillo-electrico-5-en-1-secador-alisador": [
    "Herramienta 5 en 1 para secar, alisar, ondular y dar volumen.",
    "Incluye accesorios intercambiables para distintos tipos de peinado.",
    "Tres niveles de temperatura para adaptar calor y flujo de aire.",
    "Control manual para crear ondas con mayor precisión.",
    "Ayuda a reducir frizz y mejorar suavidad y brillo del cabello.",
    "Funciona en diferentes largos y tipos de cabello.",
  ],
  "lampara-mata-zancudos-electrica": [
    "Luz UV para atraer zancudos y rejilla electrica de eliminacion inmediata.",
    "Operación silenciosa para uso en habitaciones, cocina o sala.",
    "Diseño compacto para mesa de noche, escritorio o zona de descanso.",
    "Consumo eléctrico bajo para uso prolongado en interiores.",
    "Recipiente de residuos fácil de desmontar y limpiar.",
    "Ideal para temporadas de lluvia y zonas de alta presencia de insectos.",
  ],
  "aspiradora-inalambrica-de-mano": [
    "Aspiradora inalámbrica 3 en 1 para hogar, carro y oficina.",
    "Incluye boquilla ancha, cepillo y boquilla plana para rincones.",
    "Diseño compacto de fácil agarre para limpiezas rápidas.",
    "Depósito desmontable para vaciado y limpieza sin complicaciones.",
    "Filtro lavable para mantenimiento práctico en uso frecuente.",
    "Bateria recargable para sesiones de limpieza sin cable.",
  ],
  "combo-cargador-4-en-1-adaptadorcable": [
    "Cable multifuncional 4 en 1 compatible con USB-A, USB-C y Lightning.",
    "Carga rápida para múltiples dispositivos desde un solo accesorio.",
    "Transferencia de datos estable para sincronización diaria.",
    "Cable reforzado y flexible para mayor durabilidad.",
    "Diseño anti-enredos para transporte y uso continuo.",
    "Ideal para oficina, viaje y uso en casa.",
  ],
  "depilador-facial-electrico-recargable": [
    "Diseño tipo labial para depilación facial discreta y práctica.",
    "Luz integrada para mayor precisión en retoques diarios.",
    "Uso suave para zona de labio superior, mentón y mejillas.",
    "Equipo compacto y liviano para bolso o viaje.",
    "Incluye brocha de limpieza para mantenimiento sencillo.",
    "Alternativa rápida para cuidado personal en casa.",
  ],
};

const PRODUCT_GUARANTEES_BY_SLUG: Record<string, string[]> = {
  "airpods-pro-3": [
    "Cobertura por pedido incompleto: 10 días.",
    "Cobertura por mal funcionamiento: 10 días.",
    "Cobertura por producto averiado: 10 días.",
    "Cobertura por pedido diferente: 10 días.",
  ],
  "audifonos-xiaomi-redmi-buds-4-lite": [
    "Garantía de 10 días por defectos de fábrica.",
    "Se requieren fotos del empaque original para reclamaciones.",
  ],
  "silla-gamer-premium-reposapies": [
    "Cobertura por pedido incompleto: 10 días.",
    "Cobertura por mal funcionamiento: 10 días.",
    "Cobertura por producto averiado: 10 días.",
    "Cobertura por pedido diferente: 10 días.",
  ],
  "air-fryer-freidora-10l-premium": [
    "Cobertura por pedido incompleto: 10 días.",
    "Cobertura por mal funcionamiento: 90 días.",
    "Cobertura por producto averiado: 10 días.",
    "Cobertura por pedido diferente: 10 días.",
  ],
  "smartwatch-ultra-series-pantalla-grande": [
    "Cobertura por pedido incompleto: 30 días.",
    "Cobertura por mal funcionamiento: 30 días.",
    "Cobertura por producto averiado: 30 días.",
    "Cobertura por pedido diferente: 30 días.",
  ],
  "camara-seguridad-bombillo-360-wifi": [
    "Cobertura por pedido incompleto: 10 días.",
    "Cobertura por mal funcionamiento: 10 días.",
    "Cobertura por producto averiado: 10 días.",
    "Cobertura por pedido diferente: 10 días.",
  ],
  "cepillo-electrico-5-en-1-secador-alisador": [
    "Cobertura por pedido incompleto: 10 días.",
    "Cobertura por mal funcionamiento: 10 días.",
    "Cobertura por producto averiado: 10 días.",
    "Cobertura por pedido diferente: 10 días.",
  ],
  "lampara-mata-zancudos-electrica": [
    "Cobertura por pedido incompleto: 10 días.",
    "Cobertura por mal funcionamiento: 10 días.",
    "Cobertura por producto averiado: 10 días.",
    "Cobertura por pedido diferente: 10 días.",
  ],
  "aspiradora-inalambrica-de-mano": [
    "Cobertura por pedido incompleto: 10 días.",
    "Cobertura por mal funcionamiento: 10 días.",
    "Cobertura por producto averiado: 10 días.",
    "Cobertura por pedido diferente: 10 días.",
  ],
  "combo-cargador-4-en-1-adaptadorcable": [
    "Cobertura por pedido incompleto: 10 días.",
    "Cobertura por mal funcionamiento: 10 días.",
    "Cobertura por producto averiado: 10 días.",
    "Cobertura por pedido diferente: 10 días.",
  ],
  "depilador-facial-electrico-recargable": [
    "Cobertura por pedido incompleto: 10 días.",
    "Cobertura por mal funcionamiento: 30 días.",
    "Cobertura por producto averiado: 10 días.",
    "Cobertura por pedido diferente: 10 días.",
  ],
};

const PRODUCT_SOCIAL_PROOF_BY_SLUG: Record<string, ProductSocialProof> = {
  "airpods-pro-3": {
    rating: 4.8,
    reviewCount: 5,
    badge: "Nuevo destacado",
  },
  "audifonos-xiaomi-redmi-buds-4-lite": {
    rating: 4.8,
    reviewCount: 3412,
    badge: "#1 más vendido",
  },
  "silla-gamer-premium-reposapies": {
    rating: 4.4,
    reviewCount: 396,
    badge: "Top en setup gamer",
  },
  "air-fryer-freidora-10l-premium": {
    rating: 4.7,
    reviewCount: 842,
    badge: "#1 en búsquedas de cocina",
  },
  "smartwatch-ultra-series-pantalla-grande": {
    rating: 4.5,
    reviewCount: 517,
    badge: "Top 5 tecnología",
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
    badge: "Alta salida en tecnología",
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
  "Cobertura por pedido incompleto: 10 días.",
  "Cobertura por mal funcionamiento: 10 días.",
  "Cobertura por producto averiado: 10 días.",
  "Cobertura por pedido diferente: 10 días.",
];

const DEFAULT_SOCIAL_PROOF: ProductSocialProof = {
  rating: 4.5,
  reviewCount: 180,
  badge: "Compra verificada",
};

export function getProductPageContent(slug: string): ProductPageContent {
  const normalizedSlug = String(slug || "")
    .trim()
    .toLowerCase();

  return {
    highlights:
      PRODUCT_HIGHLIGHTS_BY_SLUG[normalizedSlug] ?? DEFAULT_HIGHLIGHTS,
    guaranteeItems:
      PRODUCT_GUARANTEES_BY_SLUG[normalizedSlug] ?? DEFAULT_GUARANTEE_ITEMS,
    socialProof:
      PRODUCT_SOCIAL_PROOF_BY_SLUG[normalizedSlug] ?? DEFAULT_SOCIAL_PROOF,
  };
}
