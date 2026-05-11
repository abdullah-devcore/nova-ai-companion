"use server";

import { createClient } from "@/lib/supabase/server";
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

  // Try to create profile on signup
  if (data.user) {
    console.log("[Auth] signUp: Creating profile for", data.user.id);
    try {
      await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          email: data.user.email,
          display_name: displayName,
          created_at: new Date().toISOString(),
        });
      console.log("[Auth] signUp: Profile created");
    } catch (err) {
      console.log("[Auth] signUp: Profile creation error (non-fatal)", err);
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

  console.log("[Auth] signIn: Success");
  return { data, error: null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}
