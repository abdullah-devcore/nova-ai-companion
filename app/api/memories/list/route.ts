import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get("type");
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "20"), 100);

    let query = supabase
      .from("ai_memories")
      .select("*")
      .eq("user_id", user.id)
      .order("importance_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq("type", type);
    }

    const { data: memories, error } = await query;

    if (error) {
      console.error("[MemoriesAPI] Error:", error);
      return NextResponse.json({ error: "Failed to fetch memories" }, { status: 500 });
    }

    return NextResponse.json({ memories }, { status: 200 });
  } catch (error) {
    console.error("[MemoriesAPI] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, type, importance_score = 0.5, metadata } = await request.json();

    if (!content || !type) {
      return NextResponse.json(
        { error: "Content and type are required" },
        { status: 400 }
      );
    }

    const { data: memory, error } = await supabase
      .from("ai_memories")
      .insert({
        user_id: user.id,
        content,
        type,
        importance_score,
        reference_count: 0,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("[MemoriesAPI] Error:", error);
      return NextResponse.json({ error: "Failed to create memory" }, { status: 500 });
    }

    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    console.error("[MemoriesAPI] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
