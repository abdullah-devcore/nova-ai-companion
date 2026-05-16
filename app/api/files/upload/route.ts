import { createClient } from "@/lib/supabase/server";
import { processFile } from "@/lib/file-management/processor";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const chatId = formData.get("chatId") as string | undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log(`[FileUploadAPI] User ${user.id} uploading file: ${file.name} (${file.size} bytes)`);

    // Process file
    const processedData = await processFile({
      userId: user.id,
      chatId,
      filename: file.name,
      mimeType: file.type,
      fileBuffer: buffer,
      fileSize: file.size,
    });

    // Store in database
    const { data: uploadedFile, error: uploadError } = await supabase
      .from("uploaded_files")
      .insert({
        user_id: user.id,
        chat_id: chatId || null,
        filename: processedData.filename,
        file_type: processedData.fileType,
        file_size: processedData.fileSize,
        extracted_content: processedData.extractedContent,
        metadata: processedData.metadata,
      })
      .select()
      .single();

    if (uploadError) {
      console.error("[FileUploadAPI] Database error:", uploadError);
      return NextResponse.json({ error: "Failed to save file metadata" }, { status: 500 });
    }

    // Store chunks for vector search (if needed)
    if (processedData.chunks.length > 0) {
      const chunks = processedData.chunks.map((chunk) => ({
        file_id: uploadedFile.id,
        chunk_index: chunk.index,
        chunk_content: chunk.content,
      }));

      const { error: chunkError } = await supabase.from("file_chunks").insert(chunks);

      if (chunkError) {
        console.error("[FileUploadAPI] Chunk storage error:", chunkError);
        // Don't fail, chunks are optional
      }
    }

    console.log(`[FileUploadAPI] File uploaded successfully: ${uploadedFile.id}`);

    return NextResponse.json(
      {
        success: true,
        file: {
          id: uploadedFile.id,
          filename: uploadedFile.filename,
          size: uploadedFile.file_size,
          type: uploadedFile.file_type,
          extractedContent: processedData.extractedContent.substring(0, 500), // Preview
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[FileUploadAPI] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "File upload failed" },
      { status: 500 }
    );
  }
}

export const config = {
  maxDuration: 60, // 60 second timeout for file processing
};
