"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";
import { AIOrb } from "./ai-orb";
import { Button } from "@/components/ui/button";

interface OnboardingScreenProps {
  onGetStarted: () => void;
}

const features = [
  {
    icon: Sparkles,
    title: "Emotionally Intelligent",
    description: "Nova understands context and nuance, adapting to your communication style",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get instant, thoughtful responses powered by cutting-edge AI",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description: "Your conversations are encrypted and never used for training",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export function OnboardingScreen({ onGetStarted }: OnboardingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-hidden"
    >
      {/* Floating gradient backgrounds */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, oklch(0.65 0.2 250 / 0.4), transparent 70%)",
          }}
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, oklch(0.6 0.22 200 / 0.4), transparent 70%)",
          }}
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/3 right-1/4 w-1/3 h-1/3 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, oklch(0.55 0.18 180 / 0.3), transparent 70%)",
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-2xl mx-auto px-6 text-center"
      >
        {/* AI Orb */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-8"
        >
          <AIOrb size="xl" isThinking />
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
        >
          Meet{" "}
          <span className="gradient-text text-shadow-glow">Nova</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-muted-foreground mb-12 max-w-md mx-auto text-balance"
        >
          Your intelligent AI companion for meaningful conversations and creative collaboration
        </motion.p>

        {/* Features */}
        <motion.div
          variants={itemVariants}
          className="grid md:grid-cols-3 gap-4 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass rounded-2xl p-5"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={itemVariants}>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGetStarted}
            className="
              group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl
              text-lg font-semibold overflow-hidden
            "
          >
            {/* Gradient background */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.2 250), oklch(0.6 0.22 200), oklch(0.55 0.18 180))",
              }}
            />
            
            {/* Shine effect */}
            <motion.div
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
            
            <span className="relative text-white">Get Started</span>
            <ArrowRight className="relative w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>

        {/* Footer text */}
        <motion.p
          variants={itemVariants}
          className="text-xs text-muted-foreground mt-8"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
