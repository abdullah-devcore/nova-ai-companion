import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = request.nextUrl.searchParams.get("chatId");

    let query = supabase
      .from("uploaded_files")
      .select("id, filename, file_type, file_size, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (chatId) {
      query = query.eq("chat_id", chatId);
    }

    const { data: files, error } = await query;

    if (error) {
      console.error("[FilesListAPI] Error:", error);
      return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
    }

    return NextResponse.json({ files }, { status: 200 });
  } catch (error) {
    console.error("[FilesListAPI] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
