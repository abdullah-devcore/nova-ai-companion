import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all"; // all, chats, messages, files
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "Query too short" }, { status: 400 });
    }

    const results: any = {
      chats: [],
      messages: [],
      files: [],
    };

    // Search chats by title
    if (["all", "chats"].includes(type)) {
      const { data: chats } = await supabase
        .from("chats")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .ilike("title", `%${query}%`)
        .limit(limit)
        .order("updated_at", { ascending: false });

      if (chats) {
        results.chats = chats.map((chat) => ({
          id: chat.id,
          type: "chat",
          title: chat.title,
          preview: "",
          createdAt: chat.created_at,
        }));
      }
    }

    // Full-text search on messages
    if (["all", "messages"].includes(type)) {
      const { data: messages } = await supabase
        .rpc("search_messages", {
          search_query: query,
          user_id: user.id,
          limit_count: limit,
        })
        .throwOnError();

      if (messages) {
        results.messages = messages.map((msg: any) => ({
          id: msg.id,
          type: "message",
          chatId: msg.chat_id,
          role: msg.role,
          preview: msg.content.substring(0, 150),
          createdAt: msg.created_at,
        }));
      }
    }

    // Search files by name and extracted content
    if (["all", "files"].includes(type)) {
      const { data: files } = await supabase
        .from("chat_files")
        .select("id, chat_id, file_name, preview, extracted_text")
        .eq("user_id", user.id)
        .or(
          `file_name.ilike.%${query}%,preview.ilike.%${query}%,extracted_text.ilike.%${query}%`
        )
        .limit(limit)
        .order("created_at", { ascending: false });

      if (files) {
        results.files = files.map((file: any) => ({
          id: file.id,
          type: "file",
          chatId: file.chat_id,
          title: file.file_name,
          preview: file.preview,
        }));
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[search] Error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
