import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, folderId, pinned, pinOrder } = await request.json();

    const updates: Record<string, any> = {};
    if (folderId !== undefined) updates.folder_id = folderId;
    if (pinned !== undefined) updates.pinned = pinned;
    if (pinOrder !== undefined) updates.pin_order = pinOrder;

    const { data: chat, error } = await supabase
      .from("chat_sessions")
      .update(updates)
      .eq("id", chatId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("[ChatOrganizeAPI] Error:", error);
      return NextResponse.json({ error: "Failed to organize chat" }, { status: 500 });
    }

    return NextResponse.json({ chat }, { status: 200 });
  } catch (error) {
    console.error("[ChatOrganizeAPI] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
