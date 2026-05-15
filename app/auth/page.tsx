"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Chrome } from "lucide-react";
import { AIOrb } from "@/components/ai-orb";
import { FloatingGradients } from "@/components/floating-gradients";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        router.replace("/chat");
      } else {
        setCheckingSession(false);
      }
    });

    return () => { cancelled = true; };
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        console.error("[Auth] Google sign-in error:", signInError);
        setError(signInError.message || "Failed to sign in with Google");
        setIsLoading(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("[Auth] Exception:", errorMsg);
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingGradients />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="mb-6"
          >
            <AIOrb size="lg" isThinking />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold gradient-text text-center"
          >
            Meet Nova
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-center mt-3 max-w-sm"
          >
            Your AI-powered companion for intelligent conversations and insights
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-strong rounded-2xl p-8 space-y-6"
        >
          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3"
            >
              {error}
            </motion.div>
          )}

          {/* Google Sign In Button */}
          <motion.button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base border-2 border-primary bg-primary/5 hover:bg-primary/10 text-foreground transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
            ) : (
              <>
                <Chrome className="w-5 h-5" />
                Continue with Google
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-background text-muted-foreground">Secure OAuth Authentication</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">One-click login</p>
                <p className="text-muted-foreground text-xs">Use your existing Google account</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">100% secure</p>
                <p className="text-muted-foreground text-xs">Enterprise-grade encryption</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">No passwords</p>
                <p className="text-muted-foreground text-xs">Safer than traditional auth</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-xs text-muted-foreground space-y-2"
        >
          <p>
            By signing in, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
