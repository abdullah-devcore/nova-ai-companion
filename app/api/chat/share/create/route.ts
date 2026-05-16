import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, expiresIn = 7, password } = await request.json();

    // Verify chat ownership
    const { data: chat, error: chatError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Generate unique token
    const token = crypto.randomBytes(16).toString("hex");

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = crypto.createHash("sha256").update(password).digest("hex");
    }

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    // Create share record
    const { data: share, error } = await supabase
      .from("shared_chats")
      .insert({
        chat_id: chatId,
        created_by: user.id,
        token,
        password_hash: passwordHash,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create share" }, { status: 500 });
    }

    const shareUrl = `${request.nextUrl.origin}/share/${token}`;

    return NextResponse.json(
      {
        share: {
          token,
          url: shareUrl,
          expiresAt: expiresAt.toISOString(),
          expiresIn,
          protected: !!password,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ShareChatAPI] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
