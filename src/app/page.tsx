"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChefHat,
  Smartphone,
  Home,
  Sparkles,
  Dumbbell,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import { TrustBar } from "@/components/TrustBar";
import { PRODUCTS, CATEGORIES } from "@/data/mock";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  ChefHat,
  Smartphone,
  Home,
  Sparkles,
  Dumbbell,
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

export default function HomePage() {
  const featuredProducts = PRODUCTS.filter((p) => p.is_featured);

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <motion.div {...fadeInUp}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 mb-6">
                <Truck className="w-3.5 h-3.5" />
                Envío gratis en pedidos nacionales
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Productos que
              <br />
              <span className="text-neutral-400">transforman tu día.</span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-neutral-500 max-w-xl mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Seleccionamos lo mejor para ti. Garantía local en Colombia,
              devolución gratis y pagos 100% seguros.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link href="#productos">
                <Button size="xl">
                  Ver productos
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="#categorias">
                <Button variant="outline" size="xl">
                  Explorar categorías
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Abstract decoration */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-neutral-100 to-neutral-200/50 rounded-full blur-3xl opacity-60 -z-10" />
        <div className="absolute bottom-0 right-40 w-64 h-64 bg-gradient-to-br from-emerald-100/40 to-transparent rounded-full blur-3xl -z-10" />
      </section>

      {/* Trust Indicators Strip */}
      <section className="border-y border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: Truck, label: "Envío Express", sub: "2-4 días hábiles" },
              { icon: ShieldCheck, label: "Garantía Local", sub: "Respaldado en Colombia" },
              { icon: RotateCcw, label: "Devolución Gratis", sub: "Hasta 30 días" },
              { icon: Clock, label: "Soporte Rápido", sub: "Respuesta en minutos" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-neutral-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{item.label}</p>
                  <p className="text-xs text-neutral-500">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section id="categorias" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
              Explora por categoría
            </h2>
            <p className="text-neutral-500 text-lg">
              Encuentra exactamente lo que necesitas
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat, i) => {
              const IconComponent = CATEGORY_ICONS[cat.icon ?? ""] ?? Sparkles;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="group flex flex-col items-center gap-4 p-6 rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-all duration-300 bg-white"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${cat.color}15` }}
                    >
                      <IconComponent
                        className="w-7 h-7"
                        style={{ color: cat.color ?? undefined }}
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-neutral-900">{cat.name}</h3>
                      <p className="text-xs text-neutral-500 mt-1">{cat.description}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="productos" className="py-16 sm:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex items-end justify-between mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
                Productos destacados
              </h2>
              <p className="text-neutral-500 text-lg">
                Los más vendidos esta semana
              </p>
            </div>
            <Link href="/categoria/cocina" className="hidden sm:block">
              <Button variant="outline">
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          <div className="sm:hidden mt-8 text-center">
            <Link href="/categoria/cocina">
              <Button variant="outline" className="w-full">
                Ver todos los productos
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
              Compra con total confianza
            </h2>
            <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
              Cada compra en AllShop está respaldada por nuestra garantía local
              en Colombia. Sin sorpresas, sin complicaciones.
            </p>
          </motion.div>

          <TrustBar />

          {/* Reviews preview */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-100">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-amber-400 text-amber-400"
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-neutral-700">
                  4.9/5
                </span>
                <span className="text-sm text-neutral-400 ml-1">
                  (2,847 reseñas verificadas)
                </span>
              </div>
              <blockquote className="text-neutral-700 text-lg leading-relaxed mb-4">
                &ldquo;Increíble experiencia de compra. El producto llegó en 3
                días, muy bien empacado. La calidad es exactamente como la
                describieron. 100% recomendado.&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center text-sm font-bold text-neutral-600">
                  CM
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Carolina M.
                  </p>
                  <p className="text-xs text-neutral-500">
                    Bogotá, Colombia — Compra verificada
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Encuentra tu próximo favorito
            </h2>
            <p className="text-neutral-400 text-lg max-w-xl mx-auto mb-8">
              Nuevos productos cada semana. Envío express a toda Colombia.
            </p>
            <Link href="#productos">
              <Button
                size="xl"
                className="bg-white text-neutral-900 hover:bg-neutral-100"
              >
                Comprar ahora
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
