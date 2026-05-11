import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getMemories, createMemory, updateMemory, deleteMemory } from "@/lib/database/queries";
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
    const memoryType = searchParams.get("type") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");

    const memories = await getMemories(memoryType, limit);

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

    if (!body.memory_type || !body.content) {
      return NextResponse.json(
        { success: false, error: "memory_type and content are required" },
        { status: 400 }
      );
    }

    const memory = await createMemory({
      memory_type: body.memory_type,
      content: body.content,
      importance_score: body.importance_score || 5,
    });

    if (!memory) {
      return NextResponse.json(
        { error: "Failed to create memory" },
        { status: 500 }
      );
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
