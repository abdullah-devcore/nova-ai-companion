import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, content } = await request.json();

    if (!messageId || !content) {
      return NextResponse.json(
        { error: "Message ID and content are required" },
        { status: 400 }
      );
    }

    // Verify message ownership
    const { data: message } = await supabase
      .from("messages")
      .select("id, user_id, chat_id")
      .eq("id", messageId)
      .eq("user_id", user.id)
      .single();

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Update message content
    const { data: updated, error } = await supabase
      .from("messages")
      .update({
        content,
        edited_at: new Date().toISOString(),
        edit_count: (await supabase.rpc("increment_edit_count", { message_id: messageId })).data,
      })
      .eq("id", messageId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to edit message" }, { status: 500 });
    }

    return NextResponse.json({ message: updated });
  } catch (error) {
    console.error("[edit-message] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
