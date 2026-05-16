import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, messageId, style = "balanced", length = "auto" } = await request.json();

    // Fetch the original user message
    const { data: userMessage, error: fetchError } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("id", messageId)
      .eq("role", "user")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !userMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Build regeneration prompt
    let stylePrompt = "";
    let lengthPrompt = "";

    switch (style) {
      case "concise":
        stylePrompt = "Provide a brief, concise response.";
        break;
      case "detailed":
        stylePrompt = "Provide a detailed, comprehensive response.";
        break;
      case "creative":
        stylePrompt = "Provide a creative and imaginative response.";
        break;
      case "technical":
        stylePrompt = "Provide a technical and precise response.";
        break;
      default:
        stylePrompt = "Provide a balanced response.";
    }

    switch (length) {
      case "short":
        lengthPrompt = "Keep it under 100 words.";
        break;
      case "long":
        lengthPrompt = "Provide a comprehensive answer (500+ words if needed).";
        break;
      default:
        lengthPrompt = "Use appropriate length for the topic.";
    }

    // Return regeneration request
    return NextResponse.json(
      {
        success: true,
        regenerationRequest: {
          userMessage: userMessage.content,
          stylePrompt,
          lengthPrompt,
          originalMessageId: messageId,
          chatId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[RegenerateAPI] Error:", error);
    return NextResponse.json({ error: "Failed to regenerate" }, { status: 500 });
  }
}
