import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { getChats } from "@/lib/actions/chat";
import { getProfile } from "@/lib/actions/auth";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  console.log("[ChatPage] User:", user ? user.email : "none");

  if (!user) {
    console.log("[ChatPage] No user, redirecting to /auth/login");
    redirect("/auth/login");
  }

  const [chats, profile] = await Promise.all([
    getChats(),
    getProfile(),
  ]);

  console.log("[ChatPage] Rendering chat for:", user.email, "| Profile:", profile?.display_name || "none");

  return (
    <ChatInterface
      initialChats={chats}
      user={{ id: user.id, email: user.email || "", displayName: profile?.display_name || user.email || "" }}
    />
  );
}
