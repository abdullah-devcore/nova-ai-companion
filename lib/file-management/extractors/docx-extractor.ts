import { convertDocx } from "mammoth";

export interface ExtractedContent {
  content: string;
  metadata: Record<string, any>;
}

export async function extractDOCX(fileBuffer: Buffer): Promise<ExtractedContent> {
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
  const result = await convertDocx({ arrayBuffer });
  
  const content = result.value || "";
  const metadata = {
    messages: result.messages || [],
  };

  return { content, metadata };
}
