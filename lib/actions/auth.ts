"use server";

import { createClient } from "@/lib/supabase/server";
import { createProfile } from "@/lib/database/queries";
import { redirect } from "next/navigation";

export async function signUp(email: string, password: string, displayName: string) {
  const supabase = await createClient();

  console.log("[Auth] signUp: Starting for", email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    console.log("[Auth] signUp: Failed -", error.message);
    return { error: error.message };
  }

  // Create profile immediately after signup
  if (data.user) {
    console.log("[Auth] signUp: Creating profile for", data.user.id);
    try {
      await createProfile({
        email: data.user.email!,
        username: displayName,
      });
      console.log("[Auth] signUp: Profile created successfully");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Profile creation failed';
      console.error("[Auth] signUp: Profile creation error:", errorMsg);
      // Don't fail the signup if profile creation fails - user can still use the app
    }
  }

  console.log("[Auth] signUp: Success");
  return { data, error: null };
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  console.log("[Auth] signIn: Starting for", email);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log("[Auth] signIn: Failed -", error.message);
    return { error: error.message };
  }

  console.log("[Auth] signIn: Success for", data.user?.email);
  return { data, error: null };
}

export async function signOut() {
  const supabase = await createClient();
  
  console.log("[Auth] signOut: Starting");
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error("[Auth] signOut: Error -", error.message);
  } else {
    console.log("[Auth] signOut: Success");
  }
  
  redirect("/auth/login");
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error("[Auth] getUser: Error -", error.message);
    return null;
  }
  
  return user;
}

export async function refreshSession() {
  const supabase = await createClient();
  
  console.log("[Auth] Refreshing session");
  const { data, error } = await supabase.auth.refreshSession();
  
  if (error) {
    console.error("[Auth] Refresh failed:", error.message);
    return { error: error.message };
  }
  
  console.log("[Auth] Session refreshed");
  return { data, error: null };
}

