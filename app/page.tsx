import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { getChats } from "@/lib/actions/chat";
import { getProfile } from "@/lib/actions/auth";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [chats, profile] = await Promise.all([
    getChats(),
    getProfile(),
  ]);

  return (
    <ChatInterface
      initialChats={chats}
      user={{ id: user.id, email: user.email || "", displayName: profile?.display_name || user.email || "" }}
    />
  );
}
