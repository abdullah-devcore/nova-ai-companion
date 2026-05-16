import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, expiresIn = 7, includeMessages = true } = body;

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // Verify chat ownership
    const { data: chat } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single();

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Generate unique share token
    const shareToken = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    // Store share record
    const { data: share, error } = await supabase
      .from("chat_shares")
      .insert({
        chat_id: chatId,
        user_id: user.id,
        share_token: shareToken,
        expires_at: expiresAt.toISOString(),
        include_messages: includeMessages,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create share" }, { status: 500 });
    }

    // Generate share URL
    const baseUrl = request.nextUrl.origin;
    const shareUrl = `${baseUrl}/chat/shared/${shareToken}`;

    return NextResponse.json(
      { shareUrl, token: shareToken, expiresAt },
      { status: 201 }
    );
  } catch (error) {
    console.error("[share-chat] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shareToken = request.nextUrl.searchParams.get("token");

    if (!shareToken) {
      return NextResponse.json({ error: "Share token is required" }, { status: 400 });
    }

    // Delete share
    const { error } = await supabase
      .from("chat_shares")
      .delete()
      .eq("share_token", shareToken)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to revoke share" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[share-chat] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
