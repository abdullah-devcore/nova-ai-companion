import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, content } = await request.json();

    if (!messageId || !content) {
      return NextResponse.json(
        { error: "Message ID and content are required" },
        { status: 400 }
      );
    }

    // Verify user ownership
    const { data: message, error: fetchError } = await supabase
      .from("chat_messages")
      .select("user_id, role")
      .eq("id", messageId)
      .single();

    if (fetchError || message.user_id !== user.id || message.role !== "user") {
      return NextResponse.json(
        { error: "Cannot edit this message" },
        { status: 403 }
      );
    }

    // Update message
    const { data: updated, error } = await supabase
      .from("chat_messages")
      .update({ content, edited_at: new Date().toISOString() })
      .eq("id", messageId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
    }

    return NextResponse.json({ message: updated }, { status: 200 });
  } catch (error) {
    console.error("[EditMessageAPI] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
