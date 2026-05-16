import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const query = request.nextUrl.searchParams.get("q");
    const folderId = request.nextUrl.searchParams.get("folderId");
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "20"), 100);

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const searchLower = query.toLowerCase();
    const searchWords = searchLower.split(" ").filter((w) => w.length > 2);

    // Search in chat_sessions (titles)
    let chatsQuery = supabase
      .from("chat_sessions")
      .select("id, title, user_id, folder_id, created_at")
      .eq("user_id", user.id);

    if (folderId) {
      chatsQuery = chatsQuery.eq("folder_id", folderId);
    }

    const { data: chats } = await chatsQuery;

    // Filter by search words (simple keyword matching)
    const matchedChats = (chats || [])
      .filter((chat) => {
        const titleLower = (chat.title || "").toLowerCase();
        return searchWords.some((word) => titleLower.includes(word));
      })
      .slice(0, limit);

    // Also search in messages if enough results aren't found
    let messages = [];
    if (matchedChats.length < limit / 2) {
      const { data: messageResults } = await supabase
        .from("chat_messages")
        .select(
          "id, chat_id, role, content, created_at, chat_sessions(title)"
        )
        .ilike("content", `%${query}%`)
        .eq("chat_sessions.user_id", user.id)
        .limit(limit - matchedChats.length);

      messages = messageResults || [];
    }

    return NextResponse.json(
      {
        results: {
          chats: matchedChats,
          messages,
          query,
          total: matchedChats.length + messages.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SearchAPI] Error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
