import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memoryType = searchParams.get("type");
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    let query = supabase
      .from("user_memories")
      .select("*")
      .eq("user_id", user.id)
      .order("importance", { ascending: false })
      .order("last_mentioned_at", { ascending: false })
      .limit(limit);

    if (memoryType) {
      query = query.eq("memory_type", memoryType);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data: memories, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: memories });
  } catch (error) {
    const { message, code, statusCode } = handleError(error);
    return NextResponse.json(
      { success: false, error: message, code },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { memory_type, title, content, category, importance = 5 } = body;

    if (!memory_type || !title || !content) {
      return NextResponse.json(
        { success: false, error: "memory_type, title, and content are required" },
        { status: 400 }
      );
    }

    const { data: memory, error } = await supabase
      .from("user_memories")
      .insert({
        user_id: user.id,
        memory_type,
        title,
        content,
        category,
        importance: Math.max(1, Math.min(10, importance)),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: memory }, { status: 201 });
  } catch (error) {
    const { message, code, statusCode } = handleError(error);
    return NextResponse.json(
      { success: false, error: message, code },
      { status: statusCode }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, content, category, importance, mention_count } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Memory ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (importance !== undefined) updateData.importance = Math.max(1, Math.min(10, importance));
    if (mention_count !== undefined) updateData.mention_count = mention_count;
    updateData.last_mentioned_at = new Date().toISOString();
    updateData.updated_at = new Date().toISOString();

    const { data: memory, error } = await supabase
      .from("user_memories")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: memory });
  } catch (error) {
    const { message, code, statusCode } = handleError(error);
    return NextResponse.json(
      { success: false, error: message, code },
      { status: statusCode }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Memory ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("user_memories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, code, statusCode } = handleError(error);
    return NextResponse.json(
      { success: false, error: message, code },
      { status: statusCode }
    );
  }
}
