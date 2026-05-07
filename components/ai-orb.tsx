"use client";

import { motion } from "framer-motion";

interface AIOrbProps {
  isThinking?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
  xl: "w-32 h-32",
};

export function AIOrb({ isThinking = false, size = "md", className = "" }: AIOrbProps) {
  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "linear-gradient(135deg, oklch(0.65 0.2 250 / 0.3), oklch(0.6 0.22 200 / 0.3), oklch(0.55 0.18 180 / 0.3))",
        }}
        animate={{
          scale: isThinking ? [1, 1.3, 1] : [1, 1.1, 1],
          opacity: isThinking ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: isThinking ? 1.2 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Middle glow ring */}
      <motion.div
        className="absolute inset-1 rounded-full"
        style={{
          background: "linear-gradient(135deg, oklch(0.7 0.18 250 / 0.4), oklch(0.65 0.2 200 / 0.4))",
        }}
        animate={{
          scale: isThinking ? [1, 1.15, 1] : [1, 1.05, 1],
          opacity: isThinking ? [0.6, 1, 0.6] : [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: isThinking ? 0.8 : 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />
      
      {/* Core orb */}
      <motion.div
        className="absolute inset-2 rounded-full orb-glow"
        style={{
          background: "linear-gradient(135deg, oklch(0.75 0.15 250), oklch(0.65 0.2 200), oklch(0.6 0.18 180))",
        }}
        animate={{
          scale: isThinking ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 0.6,
          repeat: isThinking ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {/* Inner highlight */}
        <div
          className="absolute top-1 left-1/4 w-1/3 h-1/4 rounded-full opacity-60"
          style={{
            background: "linear-gradient(180deg, oklch(1 0 0 / 0.4), transparent)",
          }}
        />
      </motion.div>
      
      {/* Particle effects when thinking */}
      {isThinking && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: "oklch(0.8 0.15 250)",
                top: "50%",
                left: "50%",
              }}
              animate={{
                x: [0, Math.cos((i * 120 * Math.PI) / 180) * 30, 0],
                y: [0, Math.sin((i * 120 * Math.PI) / 180) * 30, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
