import PDFParse from "pdf-parse";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
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
    const data = await PDFParse(buffer);
    const fullText = data.text;
    const preview = fullText.substring(0, 500);

    return {
      text: fullText,
      metadata: { pages: data.numpages },
      type: "pdf",
      preview,
      pages: data.numpages,
    };
  } catch (error) {
    console.error("[extractPdfContent]", error);
    throw new Error("Failed to extract PDF content");
  }
}

export async function extractDocxContent(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    const preview = text.substring(0, 500);

    return {
      text,
      metadata: { warnings: result.messages.length },
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
    const workbook = XLSX.read(buffer);
    const tables: Array<{ headers: string[]; rows: string[][] }> = [];
    let fullText = "";

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      if (data.length > 0) {
        const headers = data[0];
        const rows = data.slice(1, 100); // Limit to first 100 rows
        tables.push({ headers, rows });

        // Convert to readable text format
        fullText += `\n## ${sheetName}\n`;
        fullText += headers.join(" | ") + "\n";
        fullText += rows.map((row) => row.join(" | ")).join("\n");
      }
    }

    const preview = fullText.substring(0, 500);

    return {
      text: fullText,
      metadata: { sheets: workbook.SheetNames.length },
      type: "spreadsheet",
      preview,
      tables,
    };
  } catch (error) {
    console.error("[extractSpreadsheetContent]", error);
    throw new Error("Failed to extract spreadsheet content");
  }
}

export async function extractCsvContent(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const text = buffer.toString("utf-8");
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
    const text = buffer.toString("utf-8");
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
