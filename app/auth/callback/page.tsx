"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
          router.replace("/auth");
          return;
        }

        if (session) {
          console.log("[Callback] User authenticated:", session.user.email);
          
          // Create or update profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", session.user.id)
            .single();

          if (!profile) {
            const displayName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
            
            await supabase.from("profiles").insert({
              id: session.user.id,
              email: session.user.email,
              username: displayName,
              created_at: new Date().toISOString(),
            });
          }

          // Redirect to chat
          router.replace("/chat");
        } else {
          console.log("[Callback] No session found");
          router.replace("/auth");
        }
      } catch (error) {
        console.error("[Callback] Error:", error);
        router.replace("/auth");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Signing you in...</h1>
        <p className="text-muted-foreground">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}
