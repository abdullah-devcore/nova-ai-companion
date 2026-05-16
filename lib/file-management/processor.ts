import type { Database } from "@/lib/supabase/types";
import { extractPDF } from "./extractors/pdf-extractor";
import { extractDOCX } from "./extractors/docx-extractor";
import { extractSpreadsheet } from "./extractors/spreadsheet-extractor";
import { extractImage } from "./extractors/image-extractor";
import { extractText } from "./extractors/text-extractor";

export interface FileProcessingOptions {
  userId: string;
  chatId?: string;
  filename: string;
  mimeType: string;
  fileBuffer: Buffer;
  fileSize: number;
}

export interface ProcessedFileData {
  filename: string;
  fileType: string;
  fileSize: number;
  extractedContent: string;
  metadata: Record<string, any>;
  chunks: Array<{
    index: number;
    content: string;
  }>;
}

const FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB

export async function processFile(options: FileProcessingOptions): Promise<ProcessedFileData> {
  const { userId, filename, mimeType, fileBuffer, fileSize } = options;

  // Validate file size
  if (fileSize > FILE_SIZE_LIMIT) {
    throw new Error(`File size exceeds limit of 50MB. Got ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
  }

  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/json",
    "text/html",
  ];

  if (!allowedTypes.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  console.log(`[FileProcessor] Processing file: ${filename} (${(fileSize / 1024).toFixed(2)}KB)`);

  let extractedContent = "";
  let metadata: Record<string, any> = { fileType: mimeType, processedAt: new Date().toISOString() };

  try {
    // Route to appropriate extractor
    if (mimeType === "application/pdf") {
      const result = await extractPDF(fileBuffer);
      extractedContent = result.content;
      metadata = { ...metadata, ...result.metadata };
    } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await extractDOCX(fileBuffer);
      extractedContent = result.content;
      metadata = { ...metadata, ...result.metadata };
    } else if (mimeType === "text/csv" || mimeType.includes("spreadsheet")) {
      const result = await extractSpreadsheet(fileBuffer, mimeType);
      extractedContent = result.content;
      metadata = { ...metadata, ...result.metadata };
    } else if (mimeType.startsWith("image/")) {
      const result = await extractImage(fileBuffer);
      extractedContent = result.content;
      metadata = { ...metadata, ...result.metadata };
    } else if (mimeType === "text/plain" || mimeType === "application/json" || mimeType === "text/html") {
      const result = extractText(fileBuffer);
      extractedContent = result.content;
      metadata = { ...metadata, ...result.metadata };
    }
  } catch (error) {
    console.error(`[FileProcessor] Extraction error for ${filename}:`, error);
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Split content into chunks (max 2000 chars per chunk)
  const chunkSize = 2000;
  const chunks = [];
  for (let i = 0; i < extractedContent.length; i += chunkSize) {
    chunks.push({
      index: Math.floor(i / chunkSize),
      content: extractedContent.substring(i, i + chunkSize),
    });
  }

  console.log(`[FileProcessor] Extracted ${extractedContent.length} chars into ${chunks.length} chunks`);

  return {
    filename,
    fileType: mimeType,
    fileSize,
    extractedContent,
    metadata,
    chunks,
  };
}

export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
