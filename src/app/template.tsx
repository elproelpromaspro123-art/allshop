"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotionSafe();

  return (
    <motion.div
      className="editorial-route-shell"
      initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.995 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.998 }}
      transition={{
        duration: reduceMotion ? 0 : 0.34,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
