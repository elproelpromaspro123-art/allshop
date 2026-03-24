"use client";

import {
  BadgeCheck,
  Headset,
  MessageCircle,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

export function HomeValues() {
  const prefersReducedMotion = useReducedMotionSafe();

  const valueItems = [
    {
      Icon: ShieldCheck,
      title: "Compra segura",
      text: "Validamos cada pedido antes de despacharlo.",
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      Icon: Truck,
      title: "Cobertura nacional",
      text: "Despachamos a toda Colombia según cobertura disponible.",
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      Icon: Headset,
      title: "Atención activa",
      text: "Respondemos por WhatsApp y correo cuando necesitas ayuda.",
      color: "bg-amber-50 text-amber-700",
    },
    {
      Icon: BadgeCheck,
      title: "Confirmación clara",
      text: "Recibes confirmación del pedido y actualización de estado.",
      color: "bg-cyan-50 text-cyan-700",
    },
    {
      Icon: Package,
      title: "Despacho ordenado",
      text: "Cada salida se revisa antes de entregarse a la transportadora.",
      color: "bg-rose-50 text-rose-700",
    },
    {
      Icon: MessageCircle,
      title: "Soporte directo",
      text: "Si surge una novedad, te guiamos con el siguiente paso.",
      color: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <section className="v-section" data-density="compact" data-tone="contrast">
      <div className="v-section-inner">
        <motion.div
          className="grid gap-5 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)] lg:items-start"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        >
          <div className="surface-panel-dark surface-ambient brand-v-slash px-5 py-6 sm:px-6 sm:py-7">
            <div className="relative z-[1] v-editorial-copy">
              <p className="v-kicker text-white/76">Así funciona tu compra</p>
              <h2 className="text-headline text-white">
                Te mostramos lo importante para comprar con confianza.
              </h2>
              <p className="text-sm leading-7 text-white/74 sm:text-base">
                Pago, cobertura, confirmación, despacho y soporte visibles desde
                el inicio para que el proceso se sienta claro de verdad.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {valueItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={
                  prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }
                }
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.45,
                  delay: index * 0.06,
                }}
              >
                <div className="surface-panel h-full px-5 py-5 sm:px-6 sm:py-6">
                  <div className="relative z-[1]">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.color}`}
                    >
                      <item.Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-5 text-base font-semibold text-[var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                      {item.text}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
