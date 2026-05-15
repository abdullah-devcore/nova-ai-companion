"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Chrome, Mail, LogIn } from "lucide-react";
import { AIOrb } from "@/components/ai-orb";
import { FloatingGradients } from "@/components/floating-gradients";
import { createClient } from "@/lib/supabase/client";

type AuthMethod = "google" | "email" | null;

export default function AuthPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!cancelled && session) {
          router.replace("/chat");
        } else if (!cancelled) {
          setCheckingSession(false);
        }
      } catch (err) {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    };

    checkSession();
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
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (signInError) {
        console.error("[Auth] OAuth error:", signInError);
        
        // If Google OAuth fails, auto-switch to email auth
        if (signInError.message?.includes("provider") || signInError.message?.includes("configuration")) {
          setAuthMethod("email");
          setError(null);
        } else {
          setError("Please try signing in with email instead.");
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error("[Auth] Exception:", err);
      setAuthMethod("email");
      setError(null);
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: email.split("@")[0],
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Signup failed. Please try again.");
      } else {
        // Auto sign in after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError("Account created. Please sign in manually.");
          setEmail("");
          setPassword("");
        } else {
          router.replace("/chat");
        }
      }
      setIsLoading(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Sign in failed. Please check your credentials.");
      } else {
        router.replace("/chat");
      }
      setIsLoading(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
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
        {/* Header */}
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
          {/* Error message - minimal visibility */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-muted-foreground bg-muted/30 border border-muted/30 rounded-lg px-3 py-2"
            >
              {error}
            </motion.div>
          )}

          {/* Auth Methods Selection */}
          {!authMethod ? (
            <>
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
                  <span className="px-2 bg-background text-muted-foreground">or continue with email</span>
                </div>
              </div>

              {/* Email Sign In Button */}
              <motion.button
                onClick={() => setAuthMethod("email")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base border-2 border-secondary bg-secondary/5 hover:bg-secondary/10 text-foreground transition-all"
              >
                <Mail className="w-5 h-5" />
                Continue with Email
              </motion.button>

              {/* Benefits */}
              <div className="space-y-3 pt-4 border-t border-border/20">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-foreground">One-click login</p>
                    <p className="text-muted-foreground text-xs">Multiple auth options</p>
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
                    <p className="font-medium text-foreground">No setup required</p>
                    <p className="text-muted-foreground text-xs">Works instantly</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Email Form */}
              <form
                onSubmit={authMethod === "email" ? handleEmailSignUp : handleEmailSignIn}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-lg bg-secondary/30 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-lg bg-secondary/30 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      {authMethod === "email" ? "Create Account" : "Sign In"}
                    </>
                  )}
                </button>
              </form>

              {/* Toggle between signup and signin */}
              <button
                onClick={() => setAuthMethod(null)}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to options
              </button>
            </>
          )}
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
