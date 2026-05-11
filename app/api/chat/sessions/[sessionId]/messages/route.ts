import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getMessages, createMessage } from "@/lib/database/queries";
import { extractMemoriesFromMessage, storeExtractedMemories } from "@/lib/ai/memory-system";
import { handleError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionId = params.sessionId;
    const messages = await getMessages(sessionId);

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    const { message, code, statusCode } = handleError(error);
    return NextResponse.json(
      { success: false, error: message, code },
      { status: statusCode }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const sessionId = params.sessionId;

    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json(
        { success: false, error: "Message content is required" },
        { status: 400 }
      );
    }

    if (!body.role || !["user", "assistant", "system"].includes(body.role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    const message = await createMessage({
      session_id: sessionId,
      role: body.role,
      content: body.content,
      metadata: body.metadata || {},
    });

    if (!message) {
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    // Extract and store memories from user messages
    if (body.role === "user") {
      const extracted = extractMemoriesFromMessage(body.content, "user");
      if (extracted.length > 0) {
        await storeExtractedMemories(extracted);
      }
    }

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    const { message, code, statusCode } = handleError(error);
    return NextResponse.json(
      { success: false, error: message, code },
      { status: statusCode }
    );
  }
}
