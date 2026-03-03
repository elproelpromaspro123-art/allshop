"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Heart,
  Minus,
  Plus,
  ChevronRight,
  Star,
  Shield,
  Truck,
  RotateCcw,
  CheckCircle2,
  Package,
} from "lucide-react";
import { cn, formatPrice, calculateDiscount } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ShippingBadge } from "@/components/ShippingBadge";
import { TrustBar } from "@/components/TrustBar";
import { PaymentLogos } from "@/components/PaymentLogos";
import { ProductCard } from "@/components/ProductCard";
import { useCartStore } from "@/store/cart";
import type { Product, Category } from "@/types";

interface Props {
  product: Product;
  category: Category | null;
  relatedProducts: Product[];
}

export function ProductPageClient({ product, category, relatedProducts }: Props) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.variants.forEach((v) => {
      if (v.options.length > 0) initial[v.name] = v.options[0];
    });
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCartStore((s) => s.addItem);

  const discount = calculateDiscount(product.price, product.compare_at_price ?? 0);
  const variantString = Object.values(selectedVariants).join(" / ") || null;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? "",
      variant: variantString,
      quantity,
      stockLocation: product.stock_location,
    });
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-neutral-50 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Link href="/" className="hover:text-neutral-900 transition-colors">
              Inicio
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            {category && (
              <>
                <Link
                  href={`/categoria/${category.slug}`}
                  className="hover:text-neutral-900 transition-colors"
                >
                  {category.name}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
            <span className="text-neutral-900 font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Main Image */}
              <div className="relative aspect-square bg-neutral-100 rounded-2xl overflow-hidden mb-4">
                <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                  <Package className="w-20 h-20 text-neutral-400" />
                </div>
                {discount > 0 && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
                    -{discount}%
                  </span>
                )}
                <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                  <Heart className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "w-20 h-20 rounded-xl overflow-hidden border-2 transition-all",
                      activeImage === i
                        ? "border-neutral-900"
                        : "border-neutral-200 hover:border-neutral-400"
                    )}
                  >
                    <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                      <Package className="w-6 h-6 text-neutral-400" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col"
            >
              {/* Reviews */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < 4
                          ? "fill-amber-400 text-amber-400"
                          : "fill-amber-400/50 text-amber-400/50"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-neutral-500">
                  4.8 (127 reseñas)
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mb-2">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-neutral-900">
                  {formatPrice(product.price)}
                </span>
                {product.compare_at_price && (
                  <>
                    <span className="text-lg text-neutral-400 line-through">
                      {formatPrice(product.compare_at_price)}
                    </span>
                    <span className="px-2.5 py-1 bg-red-50 text-red-600 text-sm font-bold rounded-full">
                      -{discount}%
                    </span>
                  </>
                )}
              </div>

              {/* Shipping */}
              <ShippingBadge stockLocation={product.stock_location} className="mb-6" />

              {/* Variants */}
              {product.variants.map((variant) => (
                <div key={variant.name} className="mb-6">
                  <label className="text-sm font-semibold text-neutral-900 mb-3 block">
                    {variant.name}:{" "}
                    <span className="font-normal text-neutral-500">
                      {selectedVariants[variant.name]}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => (
                      <button
                        key={option}
                        onClick={() =>
                          setSelectedVariants((prev) => ({
                            ...prev,
                            [variant.name]: option,
                          }))
                        }
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all",
                          selectedVariants[variant.name] === option
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Quantity + Add to Cart */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center border-2 border-neutral-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-11 h-11 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                  <ShoppingBag className="w-5 h-5" />
                  Agregar al carrito
                </Button>
              </div>

              {/* Buy Now */}
              <Link href="/checkout">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full mb-6"
                  onClick={handleAddToCart}
                >
                  Comprar ahora
                </Button>
              </Link>

              {/* Trust Signals Below CTA */}
              <div className="space-y-3 mb-6 p-4 bg-neutral-50 rounded-2xl">
                {[
                  { icon: Shield, text: "Garantía AllShop — Devolución local en Colombia" },
                  { icon: Truck, text: "Envío express gratuito en pedidos nacionales" },
                  { icon: RotateCcw, text: "30 días para devoluciones sin costo" },
                  { icon: CheckCircle2, text: "Producto verificado y garantizado" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5 text-sm text-neutral-600">
                    <item.icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Payment Logos */}
              <div className="pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-400 mb-3 font-medium uppercase tracking-wider">
                  Métodos de pago aceptados
                </p>
                <PaymentLogos variant="dark" size="sm" />
              </div>
            </motion.div>
          </div>

          {/* Description */}
          <div className="mt-16 max-w-3xl">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Descripción</h2>
            <p className="text-neutral-600 leading-relaxed">{product.description}</p>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 bg-neutral-50 border-t border-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-8">
              Productos relacionados
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Full Trust Bar */}
      <section className="py-12 bg-white border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBar />
        </div>
      </section>
    </>
  );
}
