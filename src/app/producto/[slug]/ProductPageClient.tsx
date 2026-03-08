"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  ShoppingBag,
  Minus,
  Plus,
  ChevronRight,
  Star,
  Waypoints,
  RotateCcw,
  Headset,
  Clock3,
  ShieldCheck,
  Truck,
  CheckCircle2,
  BadgeCheck,
  PackageX,
} from "lucide-react";
import { cn, calculateDiscount } from "@/lib/utils";
import { isProductShippingFree } from "@/lib/shipping";
import { getEffectiveCompareAtPrice } from "@/lib/promo-pricing";
import { Button } from "@/components/ui/Button";
import { ShippingBadge } from "@/components/ShippingBadge";
import { TrustBar } from "@/components/TrustBar";
import { PaymentLogos } from "@/components/PaymentLogos";
import { ProductCard } from "@/components/ProductCard";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";

import type { Product, Category, ProductReview } from "@/types";

interface Props {
  product: Product;
  category: Category | null;
  relatedProducts: Product[];
  reviews: ProductReview[];
}

interface DeliveryEstimatePayload {
  estimate: {
    department: string;
    city: string | null;
    minBusinessDays: number;
    maxBusinessDays: number;
    formattedRange: string;
  };
  location?: {
    source?: string;
    city?: string | null;
    department?: string | null;
  };
}

interface StockPayload {
  live: boolean;
  total_stock: number | null;
  variants: Array<{
    name: string;
    stock: number | null;
    variation_id: number | null;
  }>;
  calculated_at?: string;
  message?: string;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const COLOR_IMAGE_HINTS_BY_SLUG: Record<string, Record<string, string[] | null>> = {
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
  const normalizedHints = hints.map((hint) => normalizeText(hint));
  return (
    images.find((image) => {
      const normalizedImage = normalizeText(image);
      return normalizedHints.some((hint) => normalizedImage.includes(hint));
    }) || null
  );
}

const PRODUCT_HIGHLIGHTS_BY_SLUG: Record<string, string[]> = {
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
    "Reposapiés extensible para mayor comodidad entre sesiones.",
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
    "Batería recargable integrada para uso continuo.",
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

interface ProductSocialProof {
  rating: number;
  reviewCount: number;
  badge: string;
}

const PRODUCT_SOCIAL_PROOF_BY_SLUG: Record<string, ProductSocialProof> = {
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
    badge: "Alta salida en tecnologia",
  },
  "depilador-facial-electrico-recargable": {
    rating: 4.6,
    reviewCount: 173,
    badge: "Top en cuidado personal",
  },
};

export function ProductPageClient({
  product,
  category,
  relatedProducts,
  reviews,
}: Props) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.variants.forEach((variant) => {
      if (variant.options.length > 0) {
        initial[variant.name] = variant.options[0];
      }
    });
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [hasUserSelectedColor, setHasUserSelectedColor] = useState(false);
  const [isManualImageSelection, setIsManualImageSelection] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState<{
    min: number;
    max: number;
    range: string;
    department: string;
    city: string | null;
  } | null>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(true);
  const [stockPayload, setStockPayload] = useState<StockPayload | null>(null);
  const [isLoadingStock, setIsLoadingStock] = useState(true);

  const addItem = useCartStore((store) => store.addItem);
  const { t } = useLanguage();
  const {
    formatDisplayPrice,
    formatPaymentPrice,
    isDisplayDifferentFromPayment,
  } = usePricing();
  const effectiveCompareAtPrice = getEffectiveCompareAtPrice(product);
  const discount = calculateDiscount(product.price, effectiveCompareAtPrice);
  const variantString = Object.values(selectedVariants).join(" / ") || null;
  const productHasFreeShipping = isProductShippingFree({
    id: product.id,
    slug: product.slug,
    free_shipping: product.free_shipping ?? null,
  });

  const colorVariant = product.variants.find(
    (variant) => normalizeText(variant.name) === "color"
  );

  const selectedColor = colorVariant ? selectedVariants[colorVariant.name] : null;

  const imageByColor = useMemo(() => {
    const map = new Map<string, string | null>();
    if (!colorVariant) return map;
    const explicitHints = COLOR_IMAGE_HINTS_BY_SLUG[product.slug] || null;
    const hasOneImagePerColor = product.images.length === colorVariant.options.length;

    colorVariant.options.forEach((option, index) => {
      const normalizedOption = normalizeText(option);
      const colorHints = explicitHints?.[normalizedOption];
      if (colorHints === null) {
        map.set(normalizedOption, null);
        return;
      }

      if (Array.isArray(colorHints) && colorHints.length > 0) {
        const hintedImage = findImageByHints(product.images, colorHints);
        if (hintedImage) {
          map.set(normalizedOption, hintedImage);
          return;
        }
      }

      const imageIndex = hasOneImagePerColor
        ? index
        : Math.min(index + 1, product.images.length - 1);
      const image = product.images[imageIndex] || product.images[0] || "";
      map.set(normalizedOption, image || null);
    });

    return map;
  }, [colorVariant, product.images, product.slug]);

  const imageIndexByColor = useMemo(() => {
    const map = new Map<string, number | null>();
    if (!colorVariant) return map;
    const explicitHints = COLOR_IMAGE_HINTS_BY_SLUG[product.slug] || null;
    const hasOneImagePerColor = product.images.length === colorVariant.options.length;

    colorVariant.options.forEach((option, index) => {
      const normalizedOption = normalizeText(option);
      const colorHints = explicitHints?.[normalizedOption];
      if (colorHints === null) {
        map.set(normalizedOption, null);
        return;
      }

      if (Array.isArray(colorHints) && colorHints.length > 0) {
        const hintedImage = findImageByHints(product.images, colorHints);
        if (hintedImage) {
          const hintedIndex = product.images.findIndex((image) => image === hintedImage);
          map.set(normalizedOption, hintedIndex >= 0 ? hintedIndex : null);
          return;
        }
      }

      const imageIndex = hasOneImagePerColor
        ? index
        : Math.min(index + 1, product.images.length - 1);
      map.set(normalizedOption, imageIndex);
    });

    return map;
  }, [colorVariant, product.images, product.slug]);

  const activeImagePath = product.images[activeImage] || product.images[0] || "";
  const cartImage = isManualImageSelection
    ? activeImagePath
    : selectedColor
      ? imageByColor.get(normalizeText(selectedColor)) || activeImagePath
      : activeImagePath;

  useEffect(() => {
    if (!selectedColor || !hasUserSelectedColor || isManualImageSelection) return;
    const targetIndex = imageIndexByColor.get(normalizeText(selectedColor));
    if (typeof targetIndex === "number" && targetIndex !== activeImage) {
      setActiveImage(targetIndex);
    }
  }, [activeImage, hasUserSelectedColor, imageIndexByColor, isManualImageSelection, selectedColor]);

  const selectedColorStock = useMemo(() => {
    if (!selectedColor) return null;
    const variants = Array.isArray(stockPayload?.variants) ? stockPayload.variants : [];
    if (variants.length === 0) return null;
    return (
      variants.find(
        (item) => normalizeText(item.name) === normalizeText(selectedColor)
      ) || null
    );
  }, [selectedColor, stockPayload]);
  const isSelectedColorOutOfStock =
    typeof selectedColorStock?.stock === "number" && selectedColorStock.stock <= 0;
  const shouldShowOutOfStockImagePlaceholder =
    Boolean(selectedColor) && isSelectedColorOutOfStock;
  const stockByVariantOption = useMemo(() => {
    const map = new Map<string, number | null>();
    if (!Array.isArray(stockPayload?.variants)) return map;

    stockPayload.variants.forEach((variant) => {
      map.set(normalizeText(variant.name), variant.stock ?? null);
    });
    return map;
  }, [stockPayload]);

  const stockUpdatedAtLabel = useMemo(() => {
    if (!stockPayload?.calculated_at) return null;
    const parsedDate = new Date(stockPayload.calculated_at);
    if (Number.isNaN(parsedDate.getTime())) return null;

    return new Intl.DateTimeFormat("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(parsedDate);
  }, [stockPayload?.calculated_at]);

  const trustItems = useMemo(
    () => [
      { Icon: CreditCard, text: t("product.trust1") },
      { Icon: Waypoints, text: t("product.trust2") },
      { Icon: RotateCcw, text: t("product.trust3") },
      { Icon: Headset, text: t("product.trust4") },
    ],
    [t]
  );
  const highlights = PRODUCT_HIGHLIGHTS_BY_SLUG[product.slug] ?? [
    "Producto revisado para uso diario.",
    "Confirma variante, medidas y compatibilidad antes de comprar.",
    "Consulta soporte si necesitas ayuda antes de confirmar.",
  ];

  const guaranteeItems = PRODUCT_GUARANTEES_BY_SLUG[product.slug] ?? [
    "Cobertura por pedido incompleto: 10 días.",
    "Cobertura por mal funcionamiento: 10 días.",
    "Cobertura por producto averiado: 10 días.",
    "Cobertura por pedido diferente: 10 días.",
  ];
  const socialProof = PRODUCT_SOCIAL_PROOF_BY_SLUG[product.slug] ?? {
    rating: 4.5,
    reviewCount: 180,
    badge: "Compra verificada",
  };
  const verifiedReviewStats = useMemo(() => {
    if (!reviews.length) return null;
    const totalRating = reviews.reduce((sum, review) => {
      return sum + Math.min(5, Math.max(1, review.rating));
    }, 0);
    return {
      averageRating: totalRating / reviews.length,
      count: reviews.length,
    };
  }, [reviews]);
  const effectiveRating = verifiedReviewStats?.averageRating ?? socialProof.rating;
  const effectiveReviewCount = verifiedReviewStats?.count ?? socialProof.reviewCount;
  const reviewBadge = verifiedReviewStats ? "Reseñas verificadas" : socialProof.badge;
  const normalizedRating = Math.min(5, Math.max(0, effectiveRating));
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating - fullStars >= 0.5 && fullStars < 5;
  const displayRating = normalizedRating.toFixed(1);
  const reviewDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );
  const formattedReviewCount = new Intl.NumberFormat("es-CO").format(
    effectiveReviewCount
  );
  const formatReviewDate = (value: string): string | null => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return reviewDateFormatter.format(parsed);
  };


  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: cartImage,
      variant: variantString,
      quantity,
      freeShipping: productHasFreeShipping,
      stockLocation: "nacional",
    });
  };

  useEffect(() => {
    let cancelled = false;

    const loadEstimate = async () => {
      setIsLoadingEstimate(true);
      try {
        const response = await fetch("/api/delivery/estimate?auto=1", {
          cache: "no-store",
        });
        const payload = (await response.json()) as DeliveryEstimatePayload;

        if (cancelled) return;

        if (payload?.estimate) {
          setDeliveryEstimate({
            min: payload.estimate.minBusinessDays,
            max: payload.estimate.maxBusinessDays,
            range: payload.estimate.formattedRange,
            department: payload.estimate.department,
            city: payload.estimate.city || payload.location?.city || null,
          });
        } else {
          setDeliveryEstimate(null);
        }
      } catch {
        if (!cancelled) {
          setDeliveryEstimate(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEstimate(false);
        }
      }
    };

    void loadEstimate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let isFetching = false;
    const refreshIntervalMs = 45_000;

    const loadStock = async () => {
      if (cancelled || isFetching) return;
      isFetching = true;
      setIsLoadingStock(true);
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(product.slug)}/stock`, {
          cache: "no-store",
        });
        const data = (await response.json()) as Partial<StockPayload>;
        if (!cancelled) {
          setStockPayload({
            live: Boolean(data.live),
            total_stock:
              typeof data.total_stock === "number" || data.total_stock === null
                ? data.total_stock
                : null,
            variants: Array.isArray(data.variants) ? data.variants : [],
            message: typeof data.message === "string" ? data.message : undefined,
            calculated_at:
              typeof data.calculated_at === "string"
                ? data.calculated_at
                : new Date().toISOString(),
          });
        }
      } catch {
        if (!cancelled) {
          setStockPayload({
            live: false,
            total_stock: null,
            variants: [],
            message: "No fue posible cargar el stock en vivo en este momento.",
            calculated_at: new Date().toISOString(),
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStock(false);
        }
        isFetching = false;
      }
    };

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        void loadStock();
      }
    };

    void loadStock();
    const intervalId = window.setInterval(() => {
      void loadStock();
    }, refreshIntervalMs);

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [product.slug]);

  return (
    <>
      <div
        className={cn(
          "border-b",
          "bg-[var(--surface-muted)] border-[var(--border)]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav
            className={cn(
              "flex items-center gap-1.5 text-xs sm:text-sm",
              "text-[var(--muted)]"
            )}
          >
            <Link
              href="/"
              className={cn(
                "transition-colors",
                "hover:text-[var(--foreground)]"
              )}
            >
              {t("common.home")}
            </Link>
            <ChevronRight className="w-3 h-3" />
            {category && (
              <>
                <Link
                  href={`/categoria/${category.slug}`}
                  className={cn(
                    "transition-colors",
                    "hover:text-[var(--foreground)]"
                  )}
                >
                  {category.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span
              className={cn(
                "font-medium truncate max-w-[140px] sm:max-w-[260px]",
                "text-[var(--foreground)]"
              )}
            >
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <section className={cn("py-6 sm:py-10", "bg-[var(--background)]")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div
                className={cn(
                  "relative aspect-square rounded-2xl overflow-hidden mb-3 border",
                  "bg-white border-[var(--border)]"
                )}
              >
                <AnimatePresence mode="wait">
                  {shouldShowOutOfStockImagePlaceholder ? (
                    <motion.div
                      key={`out-of-stock-${selectedColor || "variant"}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-700 bg-red-50/80"
                    >
                      <PackageX className="w-24 h-24 sm:w-28 sm:h-28" />
                      <p className="text-base sm:text-lg font-bold uppercase tracking-wide">
                        Variante agotada
                      </p>
                      <p className="text-sm text-red-600">
                        {selectedColor ? `${selectedColor}: sin stock` : "Sin stock disponible"}
                      </p>
                    </motion.div>
                  ) : product.images[activeImage] ? (
                    <motion.div
                      key={`${product.images[activeImage]}-${activeImage}`}
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -14 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={product.images[activeImage]}
                        alt={`${product.name} - imagen ${activeImage + 1}`}
                        fill
                        className="object-contain p-4 sm:p-7"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        loading="eager"
                        quality={100}
                        priority
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 items-start">
                  {product.is_bestseller && (
                    <span className="bg-amber-400 text-amber-950 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full shadow-sm">
                      Más vendido
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="bg-[var(--accent)] text-[#071a0a] text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full shadow-sm">
                      -{discount}%
                    </span>
                  )}
                </div>

                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1.5 border border-emerald-200">
                  <Truck className="w-3.5 h-3.5" />
                  {productHasFreeShipping ? "Envio gratis" : "Envio nacional"}
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {product.images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => {
                      setIsManualImageSelection(true);
                      setActiveImage(index);
                    }}
                    className={cn(
                      "w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 relative bg-white",
                      activeImage === index
                        ? "border-[var(--accent)]"
                        : "border-[var(--border)] hover:border-[var(--accent-strong)]/40"
                    )}
                    type="button"
                  >
                    <Image
                      src={image}
                      alt={`${product.name} miniatura ${index + 1}`}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                      loading={index === activeImage ? "eager" : "lazy"}
                      quality={100}
                    />
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={cn(
                        "w-3.5 h-3.5",
                        index < fullStars
                          ? "fill-amber-400 text-amber-400"
                          : index === fullStars && hasHalfStar
                            ? "fill-amber-400/55 text-amber-400"
                            : "fill-amber-400/20 text-amber-400/35"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-neutral-500">
                  {t("product.ratingSummary", {
                    rating: displayRating,
                    count: formattedReviewCount,
                    reviews: t("product.reviews"),
                  })}
                </span>
              </div>

              <h1
                className={cn(
                  "text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-3",
                  "text-[var(--foreground)]"
                )}
              >
                {product.name}
              </h1>

              <div
                className={cn(
                  "inline-flex mb-4 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border",
                  "border-amber-300 bg-amber-50 text-amber-800"
                )}
              >
                {reviewBadge}
              </div>

              <div className="flex items-baseline gap-3 mb-5">
                <span
                  className={cn(
                    "text-2xl sm:text-3xl font-bold",
                    "text-[var(--foreground)]"
                  )}
                >
                  {formatDisplayPrice(product.price)}
                </span>
                {effectiveCompareAtPrice > 0 && (
                  <>
                    <span className="text-base text-neutral-400 line-through">
                      {formatDisplayPrice(effectiveCompareAtPrice)}
                    </span>
                    <span className="px-2.5 py-0.5 text-sm font-bold rounded-full bg-[var(--accent)] text-[#071a0a]">
                      -{discount}%
                    </span>
                  </>
                )}
              </div>
              {isDisplayDifferentFromPayment && (
                <p className="text-xs text-neutral-500 -mt-3 mb-5">
                  {formatPaymentPrice(product.price)}
                </p>
              )}

              <ShippingBadge stockLocation={product.stock_location} className="mb-4" />

              <div
                className={cn(
                  "rounded-2xl border p-4 mb-4",
                  "bg-white border-[var(--border)]"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--accent-strong)]" />
                  <p className={cn("text-sm font-semibold", "text-[var(--foreground)]")}>
                    Disponibilidad actual
                  </p>
                </div>
                {isLoadingStock ? (
                  <p className="text-sm text-neutral-500">Consultando disponibilidad...</p>
                ) : (
                  <div className="space-y-2">
                    {stockPayload?.live ? (
                      <p className="text-sm text-neutral-500">
                        Stock total: <span className="font-semibold text-[var(--accent-strong)]">{stockPayload.total_stock ?? "N/D"}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-neutral-500">
                        {stockPayload?.message || "Disponibilidad no visible en este momento."}
                      </p>
                    )}
                    {stockUpdatedAtLabel && stockPayload?.live && (
                      <p className="text-xs text-neutral-500">
                        Actualizado en tiempo real: {stockUpdatedAtLabel}
                      </p>
                    )}
                    {Array.isArray(stockPayload?.variants) && stockPayload.variants.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {stockPayload.variants.map((variant) => {
                          const isOut = typeof variant.stock === "number" && variant.stock <= 0;
                          return (
                          <div
                            key={`${variant.name}-${variant.variation_id}`}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-xs",
                              isOut
                                ? "border-red-200 bg-red-50"
                                : "border-[var(--border)] bg-[var(--surface-muted)]"
                            )}
                          >
                            <p
                              className={cn(
                                "font-semibold",
                                isOut ? "text-red-700" : "text-[var(--foreground)]"
                              )}
                            >
                              {variant.name}
                            </p>
                            <p className={cn(isOut ? "text-red-600" : "text-neutral-500")}>
                              {typeof variant.stock === "number"
                                ? variant.stock <= 0
                                  ? "Agotado"
                                  : `${variant.stock} unidades`
                                : "N/D"}
                            </p>
                          </div>
                          );
                        })}
                      </div>
                    )}
                    {selectedColorStock?.stock !== null && selectedColorStock?.stock !== undefined ? (
                      <p className="text-xs text-neutral-500">
                        Color seleccionado ({selectedColorStock.name}):{" "}
                        <span className="font-semibold text-[var(--accent-strong)]">
                          {selectedColorStock.stock <= 0 ? "Agotado" : selectedColorStock.stock}
                        </span>
                        {selectedColorStock.stock > 0 ? " disponibles." : "."}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              <div
                className={cn(
                  "rounded-2xl border p-4 mb-5",
                  "bg-white border-[var(--border)]"
                )}
              >
                {isLoadingEstimate ? (
                  <p className="text-sm text-neutral-500">Calculando estimación de entrega...</p>
                ) : deliveryEstimate ? (
                  <div className="space-y-1.5">
                    <p className="text-sm text-neutral-500 flex items-center gap-2">
                      <Clock3 className="w-4 h-4 text-[var(--accent-strong)] shrink-0" />
                      <span>Entrega estimada:</span>
                      <span className="font-semibold text-[var(--accent-strong)]">
                        {deliveryEstimate.min} a {deliveryEstimate.max} días hábiles
                      </span>
                    </p>
                    <p className="text-xs text-neutral-500">
                      Zona consultada:{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {deliveryEstimate.city
                          ? `${deliveryEstimate.city}, ${deliveryEstimate.department}`
                          : deliveryEstimate.department}
                      </span>
                    </p>
                    <p className="text-xs text-neutral-500">
                      Rango estimado en calendario:{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {deliveryEstimate.range}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">No fue posible calcular la estimación ahora.</p>
                )}
              </div>

              {product.variants.map((variant) => (
                <div key={variant.name} className="mb-5">
                  <label
                    className={cn(
                      "text-sm font-semibold mb-2.5 block",
                      "text-[var(--foreground)]"
                    )}
                  >
                    {variant.name}:{" "}
                    <span className="font-normal text-neutral-500">{selectedVariants[variant.name]}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => {
                      const isColorVariant = normalizeText(variant.name) === "color";
                      const optionStock = stockByVariantOption.get(normalizeText(option));
                      const isOptionOutOfStock =
                        isColorVariant &&
                        typeof optionStock === "number" &&
                        optionStock <= 0;
                      return (
                      <button
                        key={option}
                        onClick={() => {
                          if (isColorVariant) {
                            setHasUserSelectedColor(true);
                            setIsManualImageSelection(false);
                          }
                          setSelectedVariants((prev) => ({
                            ...prev,
                            [variant.name]: option,
                          }));
                        }}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                          selectedVariants[variant.name] === option
                            ? isOptionOutOfStock
                              ? "border-red-500 bg-red-100 text-red-800"
                              : "border-[var(--accent)] bg-[var(--accent)] text-[#071a0a]"
                            : isOptionOutOfStock
                              ? "border-red-200 bg-red-50 text-red-700 hover:border-red-300"
                              : "border-[var(--border)] text-neutral-700 hover:border-[var(--accent-strong)]/40"
                        )}
                        type="button"
                      >
                        {option}
                        {isOptionOutOfStock ? " (Agotado)" : ""}
                      </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {isSelectedColorOutOfStock && (
                <p
                  className={cn(
                    "mb-4 text-sm rounded-xl border px-4 py-3",
                    "border-red-200 bg-red-50 text-red-700"
                  )}
                >
                  La variante seleccionada está agotada. Elige otro color disponible.
                </p>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    "flex items-center border rounded-full overflow-hidden",
                    "border-[var(--border)]"
                  )}
                >
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isSelectedColorOutOfStock}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center transition-colors",
                      "hover:bg-[var(--surface-muted)]",
                      isSelectedColorOutOfStock && "opacity-50 cursor-not-allowed"
                    )}
                    type="button"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isSelectedColorOutOfStock}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center transition-colors",
                      "hover:bg-[var(--surface-muted)]",
                      isSelectedColorOutOfStock && "opacity-50 cursor-not-allowed"
                    )}
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleAddToCart}
                  disabled={isSelectedColorOutOfStock}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {isSelectedColorOutOfStock ? "Sin stock en esta variante" : t("product.addToCart")}
                </Button>
              </div>

              <Link href="/checkout">
                <Button
                  variant="outline"
                  size="lg"
                  className={cn(
                    "w-full mb-5"
                  )}
                  onClick={handleAddToCart}
                  disabled={isSelectedColorOutOfStock}
                >
                  {t("product.buyNow")}
                </Button>
              </Link>

              <div
                className={cn(
                  "space-y-2.5 mb-5 p-4 rounded-2xl",
                  "bg-[var(--surface-muted)]"
                )}
              >
                {trustItems.map((item) => (
                  <div
                    key={item.text}
                    className={cn(
                      "flex items-center gap-2.5 text-sm",
                      "text-neutral-600"
                    )}
                  >
                    <item.Icon className="w-[18px] h-[18px] text-[var(--accent-strong)] shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <div className={cn("pt-4 border-t", "border-[var(--border)]")}>
                <p className="text-[11px] text-neutral-400 mb-3 font-semibold uppercase tracking-wider">
                  {t("product.acceptedPayments")}
                </p>
                <PaymentLogos variant="dark" size="sm" />
              </div>
            </motion.div>
          </div>

          <div className="mt-12 sm:mt-16 grid gap-6 lg:grid-cols-2">
            <div
              className={cn(
                "relative overflow-hidden rounded-3xl border p-6 sm:p-7",
                "bg-white border-[var(--border)]"
              )}
            >
              <div className="absolute -top-20 -right-16 h-44 w-44 rounded-full bg-[var(--accent)]/10 blur-2xl" />
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--accent-strong)] mb-3">
                <BadgeCheck className="w-3.5 h-3.5" />
                Detalles premium
              </p>
              <h2
                className={cn(
                  "text-xl font-bold mb-4",
                  "text-[var(--foreground)]"
                )}
              >
                {t("product.description")}
              </h2>
              <p className={cn("leading-relaxed mb-5", "text-neutral-600")}>
                {product.description}
              </p>
              <p
                className={cn(
                  "mb-5 text-sm rounded-xl border px-4 py-3",
                  "border-amber-200 bg-amber-50 text-amber-800"
                )}
              >
                Importante: verifica color, capacidad y dirección antes de confirmar el pedido.
              </p>
              <div className="space-y-3">
                {highlights.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-[var(--accent-strong)] shrink-0" />
                    <span className={cn("text-neutral-700")}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={cn(
                "relative overflow-hidden rounded-3xl border p-6 sm:p-7",
                "bg-white border-[var(--border)]"
              )}
            >
              <div className="absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-[var(--accent)]/10 blur-2xl" />
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--accent-strong)] mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                Compra confiable
              </p>
              <h2
                className={cn(
                  "text-xl font-bold mb-4",
                  "text-[var(--foreground)]"
                )}
              >
                Garantías del producto
              </h2>
              <div className="space-y-3">
                {guaranteeItems.map((item) => (
                  <div
                    key={item}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-sm",
                      "border-[var(--border)] bg-[var(--surface-muted)] text-neutral-700"
                    )}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={cn(
          "py-12 sm:py-16 border-t",
          "bg-[var(--surface)] border-[var(--border)]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "rounded-3xl border p-6 sm:p-7",
              "bg-white border-[var(--border)]"
            )}
          >
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--accent-strong)] mb-3">
              <BadgeCheck className="w-3.5 h-3.5" />
              Confianza real
            </p>
            <h2
              className={cn(
                "text-xl sm:text-2xl font-bold mb-2",
                "text-[var(--foreground)]"
              )}
            >
              Reseñas verificadas
            </h2>
            <p className={cn("text-sm mb-6", "text-neutral-600")}>
              Solo se muestran reseñas aprobadas de compras verificadas.
            </p>

            {reviews.length === 0 ? (
              <p
                className={cn(
                  "text-sm rounded-xl border px-4 py-3",
                  "border-[var(--border)] bg-[var(--surface-muted)] text-neutral-700"
                )}
              >
                Aún no hay reseñas verificadas para este producto.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {reviews.map((review) => {
                  const reviewDate = formatReviewDate(review.created_at);
                  const safeRating = Math.min(5, Math.max(1, review.rating));


                  return (
                    <article
                      key={review.id}
                      className={cn(
                        "rounded-2xl border p-4",
                        "border-[var(--border)] bg-[var(--surface-muted)]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className={cn("font-semibold text-sm", "text-[var(--foreground)]")}>
                            {review.reviewer_name || "Cliente verificado"}
                          </p>
                          {reviewDate ? (
                            <p className="text-xs text-neutral-500">{reviewDate}</p>
                          ) : null}
                        </div>
                        <span
                          className={cn(
                            "text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                            "border-emerald-200 bg-emerald-50 text-emerald-700"
                          )}
                        >
                          Compra verificada
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 mb-2">
                        {[...Array(5)].map((_, starIndex) => (
                          <Star
                            key={`${review.id}-star-${starIndex}`}
                            className={cn(
                              "w-3.5 h-3.5",
                              starIndex < safeRating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-amber-400/20 text-amber-400/35"
                            )}
                          />
                        ))}
                      </div>

                      {review.title ? (
                        <p className={cn("text-sm font-semibold mb-1", "text-[var(--foreground)]")}>
                          {review.title}
                        </p>
                      ) : null}
                      <p className={cn("text-sm leading-relaxed", "text-neutral-700")}>
                        {review.body}
                      </p>
                      {review.variant ? (
                        <p className="text-xs text-neutral-500 mt-2">Variante: {review.variant}</p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section
          className={cn(
            "py-14 sm:py-20 border-t",
            "bg-[var(--surface)] border-[var(--border)]"
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2
              className={cn(
                "text-2xl font-bold mb-8",
                "text-[var(--foreground)]"
              )}
            >
              {t("product.related")}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {relatedProducts.map((item, index) => (
                <ProductCard key={item.id} product={item} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section
        className={cn(
          "py-10 border-t",
          "bg-[var(--background)] border-[var(--border)]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBar />
        </div>
      </section>
    </>
  );
}

