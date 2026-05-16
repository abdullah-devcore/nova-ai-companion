import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: folders, error } = await supabase
      .from("conversation_folders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[FoldersListAPI] Error:", error);
      return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
    }

    return NextResponse.json({ folders }, { status: 200 });
  } catch (error) {
    console.error("[FoldersListAPI] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
