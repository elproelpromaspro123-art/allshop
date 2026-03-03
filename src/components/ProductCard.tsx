"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Heart } from "lucide-react";
import { cn, formatPrice, calculateDiscount } from "@/lib/utils";
import { ShippingBadge } from "./ShippingBadge";
import { Button } from "./ui/Button";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cart";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const discount = calculateDiscount(product.price, product.compare_at_price ?? 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? "",
      variant: null,
      quantity: 1,
      stockLocation: product.stock_location,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/producto/${product.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl bg-neutral-100 aspect-square mb-4">
          {/* Placeholder image */}
          <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-neutral-400" />
          </div>

          {/* Discount Badge */}
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              -{discount}%
            </span>
          )}

          {/* Quick Add Button */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <Button size="icon" onClick={handleAddToCart} className="rounded-full shadow-lg">
              <ShoppingBag className="w-4 h-4" />
            </Button>
          </div>

          {/* Wishlist */}
          <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
            <Heart className="w-4 h-4 text-neutral-600" />
          </button>
        </div>

        {/* Info */}
        <div className="space-y-2">
          <ShippingBadge stockLocation={product.stock_location} compact />

          <h3 className="font-semibold text-neutral-900 line-clamp-2 group-hover:text-neutral-600 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-neutral-900">
              {formatPrice(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-sm text-neutral-400 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
