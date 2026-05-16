import { Readable } from "stream";

export interface ExtractedContent {
  text: string;
  metadata: Record<string, any>;
  type: "pdf" | "document" | "image" | "spreadsheet" | "csv" | "text";
  preview: string;
  pages?: number;
  tables?: Array<{ headers: string[]; rows: string[][] }>;
}

export async function extractPdfContent(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const text = buffer.toString("utf-8", 0, Math.min(5000, buffer.length));
    const preview = text.substring(0, 500);

    return {
      text: text.replace(/[^\x20-\x7E\n\r\t]/g, ""),
      metadata: { size: buffer.length },
      type: "pdf",
      preview,
    };
  } catch (error) {
    console.error("[extractPdfContent]", error);
    throw new Error("Failed to extract PDF content");
  }
}

export async function extractDocxContent(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const text = buffer.toString("utf-8", 0, Math.min(5000, buffer.length));
    const preview = text.substring(0, 500);

    return {
      text: text.replace(/[^\x20-\x7E\n\r\t]/g, "").trim(),
      metadata: { size: buffer.length },
      type: "document",
      preview,
    };
  } catch (error) {
    console.error("[extractDocxContent]", error);
    throw new Error("Failed to extract DOCX content");
  }
}

export async function extractSpreadsheetContent(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const text = buffer.toString("utf-8", 0, Math.min(5000, buffer.length));
    const lines = text.split("\n").slice(0, 20);
    const headers = lines[0]?.split("\t") || [];
    const rows = lines.slice(1).map((line) => line.split("\t"));
    const preview = lines.slice(0, 5).join("\n");

    return {
      text: lines.join("\n"),
      metadata: { rows: rows.length },
      type: "spreadsheet",
      preview,
      tables: headers.length > 0 ? [{ headers, rows }] : [],
    };
  } catch (error) {
    console.error("[extractSpreadsheetContent]", error);
    throw new Error("Failed to extract spreadsheet content");
  }
}

export async function extractCsvContent(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const text = buffer.toString("utf-8", 0, Math.min(5000, buffer.length));
    const lines = text.split("\n").slice(0, 100);
    const headers = lines[0]?.split(",") || [];
    const rows = lines.slice(1).map((line) => line.split(","));
    const preview = lines.slice(0, 5).join("\n");

    return {
      text: lines.join("\n"),
      metadata: { rows: rows.length },
      type: "csv",
      preview,
      tables: [{ headers, rows }],
    };
  } catch (error) {
    console.error("[extractCsvContent]", error);
    throw new Error("Failed to extract CSV content");
  }
}

export async function extractTextContent(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const text = buffer.toString("utf-8", 0, Math.min(5000, buffer.length));
    const preview = text.substring(0, 500);

    return {
      text,
      metadata: { size: buffer.length },
      type: "text",
      preview,
    };
  } catch (error) {
    console.error("[extractTextContent]", error);
    throw new Error("Failed to extract text content");
  }
}

export async function extractFileContent(
  file: Buffer,
  mimeType: string
): Promise<ExtractedContent> {
  if (mimeType === "application/pdf") {
    return extractPdfContent(file);
  } else if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocxContent(file);
  } else if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    return extractSpreadsheetContent(file);
  } else if (mimeType === "text/csv" || mimeType === "text/plain") {
    if (mimeType === "text/csv") {
      return extractCsvContent(file);
    }
    return extractTextContent(file);
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}
