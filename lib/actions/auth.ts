"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  try {
    const supabase = await createClient();
    
    console.log("[Auth] signOut: Starting");
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("[Auth] signOut: Error -", error.message);
      return { error: error.message };
    }
    
    console.log("[Auth] signOut: Success");
    redirect("/auth");
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Sign out failed';
    console.error("[Auth] signOut: Exception -", errorMsg);
    return { error: errorMsg };
  }
}

export async function getUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("[Auth] getUser: Error -", error.message);
      return null;
    }
    
    return user;
  } catch (err) {
    console.error("[Auth] getUser: Exception -", err instanceof Error ? err.message : 'Unknown error');
    return null;
  }
}

export async function refreshSession() {
  try {
    const supabase = await createClient();
    
    console.log("[Auth] Refreshing session");
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("[Auth] Refresh failed:", error.message);
      return { error: error.message, data: null };
    }
    
    console.log("[Auth] Session refreshed");
    return { data, error: null };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Refresh failed';
    console.error("[Auth] Refresh: Exception -", errorMsg);
    return { error: errorMsg, data: null };
  }
}

