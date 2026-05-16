import { createClient } from "@/lib/supabase/server";

export interface DocumentContext {
  fileId: string;
  filename: string;
  content: string;
  chunks: Array<{ index: number; content: string }>;
  metadata: Record<string, any>;
}

/**
 * Retrieves relevant document chunks based on user query
 * This uses simple keyword matching for now
 * For production, consider: embedding similarity, semantic search, etc.
 */
export async function retrieveDocumentContext(
  userId: string,
  query: string,
  fileIds?: string[]
): Promise<DocumentContext[]> {
  const supabase = await createClient();

  try {
    // Build query
    let fileQuery = supabase
      .from("uploaded_files")
      .select("id, filename, extracted_content, metadata, file_type")
      .eq("user_id", userId);

    if (fileIds && fileIds.length > 0) {
      fileQuery = fileQuery.in("id", fileIds);
    }

    const { data: files, error } = await fileQuery;

    if (error) {
      console.error("[DocumentRetriever] Query error:", error);
      return [];
    }

    if (!files) return [];

    // Simple keyword matching
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(" ");

    const results: DocumentContext[] = [];

    for (const file of files) {
      const contentLower = file.extracted_content?.toLowerCase() || "";
      
      // Score based on keyword matches
      let score = 0;
      for (const word of queryWords) {
        if (word.length > 2) {
          const matches = (contentLower.match(new RegExp(word, "g")) || []).length;
          score += matches;
        }
      }

      // Only include if there's some relevance
      if (score > 0) {
        // Get chunks
        const { data: chunks } = await supabase
          .from("file_chunks")
          .select("chunk_index, chunk_content")
          .eq("file_id", file.id)
          .order("chunk_index");

        // Find most relevant chunks
        const relevantChunks = (chunks || [])
          .filter((chunk) => {
            let chunkScore = 0;
            const chunkLower = chunk.chunk_content.toLowerCase();
            for (const word of queryWords) {
              if (word.length > 2) {
                chunkScore += (chunkLower.match(new RegExp(word, "g")) || []).length;
              }
            }
            return chunkScore > 0;
          })
          .slice(0, 3) // Top 3 most relevant chunks
          .map((chunk) => ({
            index: chunk.chunk_index,
            content: chunk.chunk_content,
          }));

        results.push({
          fileId: file.id,
          filename: file.filename,
          content: file.extracted_content || "",
          chunks: relevantChunks,
          metadata: file.metadata || {},
        });
      }
    }

    return results;
  } catch (error) {
    console.error("[DocumentRetriever] Error:", error);
    return [];
  }
}

/**
 * Builds context string from documents for injection into AI prompt
 */
export function buildDocumentContextString(documents: DocumentContext[]): string {
  if (documents.length === 0) return "";

  const contextParts = documents.map((doc) => {
    let content = `**Document: ${doc.filename}**\n\n`;

    if (doc.chunks && doc.chunks.length > 0) {
      content += "Relevant excerpts:\n";
      content += doc.chunks
        .map((chunk) => `> ${chunk.content.substring(0, 500)}...`)
        .join("\n\n");
    } else {
      content += doc.content.substring(0, 1000) + "...";
    }

    return content;
  });

  return (
    "The user is asking about the following documents:\n\n" +
    contextParts.join("\n\n---\n\n") +
    "\n\nPlease answer based on the information in these documents."
  );
}

/**
 * Detects if user is asking about uploaded documents
 */
export function shouldUseDocumentContext(userMessage: string): boolean {
  const documentKeywords = [
    "file",
    "document",
    "pdf",
    "attachment",
    "uploaded",
    "extract",
    "summarize",
    "analyze",
    "what's in",
    "show me",
    "tell me about",
  ];

  const lowerMessage = userMessage.toLowerCase();
  return documentKeywords.some((keyword) => lowerMessage.includes(keyword));
}
