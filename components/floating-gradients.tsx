"use client";

import { motion } from "framer-motion";

export function FloatingGradients() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Top left gradient */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.65 0.2 250 / 0.5), transparent 60%)",
        }}
      />
      
      {/* Bottom right gradient */}
      <motion.div
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
          scale: [1, 1.15, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.6 0.22 200 / 0.5), transparent 60%)",
        }}
      />
      
      {/* Center accent gradient */}
      <motion.div
        animate={{
          x: [0, 20, -20, 0],
          y: [0, -15, 15, 0],
          scale: [1, 1.05, 0.95, 1],
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute top-1/3 left-1/3 w-1/3 h-1/3 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.55 0.18 180 / 0.4), transparent 60%)",
        }}
      />
    </div>
  );
}
