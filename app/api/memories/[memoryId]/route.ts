import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: { memoryId: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { importance_score, metadata, content } = await request.json();

    const updates: Record<string, any> = {};
    if (importance_score !== undefined) updates.importance_score = importance_score;
    if (metadata !== undefined) updates.metadata = metadata;
    if (content !== undefined) updates.content = content;

    const { data: memory, error } = await supabase
      .from("ai_memories")
      .update(updates)
      .eq("id", params.memoryId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update memory" }, { status: 500 });
    }

    return NextResponse.json({ memory }, { status: 200 });
  } catch (error) {
    console.error("[MemoryUpdateAPI] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { memoryId: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("ai_memories")
      .delete()
      .eq("id", params.memoryId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[MemoryDeleteAPI] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
