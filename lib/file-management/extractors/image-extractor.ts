export interface ExtractedContent {
  content: string;
  metadata: Record<string, any>;
}

export async function extractImage(fileBuffer: Buffer): Promise<ExtractedContent> {
  // For now, provide image metadata
  // Full OCR would require tesseract.js which is heavy
  const metadata = {
    format: "image",
    size: fileBuffer.length,
    note: "Image OCR can be enabled for premium users",
  };

  const content = "[Image file detected. OCR transcription available for premium users.]";

  return { content, metadata };
}
