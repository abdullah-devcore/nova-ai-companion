import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, color = "#7c3aed", parentFolderId } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const { data: folder, error } = await supabase
      .from("conversation_folders")
      .insert({
        user_id: user.id,
        name: name.trim(),
        color,
        parent_folder_id: parentFolderId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[FolderCreateAPI] Error:", error);
      return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
    }

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error("[FolderCreateAPI] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
