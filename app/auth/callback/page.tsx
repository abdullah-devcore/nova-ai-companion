"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[Callback] Session error:", sessionError);
          // Gracefully handle without showing error
          setTimeout(() => router.replace("/auth"), 1000);
          return;
        }

        if (session) {
          console.log("[Callback] User authenticated:", session.user.email);
          
          try {
            // Create or update profile
            const { data: profile, error: profileCheckError } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", session.user.id)
              .single();

            if (!profile && !profileCheckError) {
              const displayName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
              
              await supabase.from("profiles").insert({
                id: session.user.id,
                email: session.user.email,
                username: displayName,
                created_at: new Date().toISOString(),
              }).select();
            }
          } catch (profileError) {
            console.error("[Callback] Profile creation error:", profileError);
            // Profile creation is not critical, continue anyway
          }

          // Redirect to chat
          setTimeout(() => router.replace("/chat"), 500);
        } else {
          console.log("[Callback] No session found");
          // Redirect back to auth after a brief delay
          setTimeout(() => router.replace("/auth"), 1000);
        }
      } catch (error) {
        console.error("[Callback] Error:", error);
        // Graceful error handling without showing errors
        setTimeout(() => router.replace("/auth"), 1500);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Sparkles className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Signing you in...</h1>
        <p className="text-muted-foreground text-sm">This will only take a moment</p>
      </div>
    </div>
  );
}
