import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { extractFileContent } from "@/lib/file-extraction";

const EXTRACTION_TIMEOUT = 30000; // 30 seconds

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const chatId = formData.get("chatId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!chatId) {
      return NextResponse.json({ error: "No chat ID provided" }, { status: 400 });
    }

    // Verify chat ownership
    const { data: chat } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single();

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found or unauthorized" },
        { status: 404 }
      );
    }

    // Extract file content with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Extraction timeout")), EXTRACTION_TIMEOUT)
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const extraction = (await Promise.race([
      extractFileContent(buffer, file.type),
      timeoutPromise,
    ])) as any;

    // Store extracted content in database
    const { data: fileRecord, error: insertError } = await supabase
      .from("chat_files")
      .insert({
        chat_id: chatId,
        user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        content_type: extraction.type,
        extracted_text: extraction.text,
        extracted_metadata: extraction.metadata,
        preview: extraction.preview,
        is_processed: true,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[extract] Database insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to store file data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      fileId: fileRecord.id,
      extraction: {
        type: extraction.type,
        preview: extraction.preview,
        metadata: extraction.metadata,
        tables: extraction.tables,
        pages: extraction.pages,
      },
    });
  } catch (error) {
    console.error("[extract] Error:", error);

    if (error instanceof Error) {
      if (error.message === "Extraction timeout") {
        return NextResponse.json(
          { error: "File extraction timed out. File might be too large." },
          { status: 408 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to extract file content" },
      { status: 500 }
    );
  }
}
