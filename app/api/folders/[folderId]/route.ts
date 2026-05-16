import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: { folderId: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, color } = await request.json();

    // Verify ownership
    const { data: folder, error: fetchError } = await supabase
      .from("conversation_folders")
      .select("user_id")
      .eq("id", params.folderId)
      .single();

    if (fetchError || folder.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from("conversation_folders")
      .update({ name, color, updated_at: new Date().toISOString() })
      .eq("id", params.folderId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
    }

    return NextResponse.json({ folder: updated }, { status: 200 });
  } catch (error) {
    console.error("[FolderUpdateAPI] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { folderId: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: folder, error: fetchError } = await supabase
      .from("conversation_folders")
      .select("user_id")
      .eq("id", params.folderId)
      .single();

    if (fetchError || folder.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("conversation_folders")
      .delete()
      .eq("id", params.folderId);

    if (error) {
      return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[FolderDeleteAPI] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
