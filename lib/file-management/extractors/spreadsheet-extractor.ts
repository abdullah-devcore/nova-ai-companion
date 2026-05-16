import XLSX from "xlsx";
import Papa from "papaparse";

export interface ExtractedContent {
  content: string;
  metadata: Record<string, any>;
}

export function extractSpreadsheet(fileBuffer: Buffer, mimeType: string): ExtractedContent {
  let content = "";
  let metadata: Record<string, any> = { rows: 0, columns: 0 };

  try {
    if (mimeType === "text/csv") {
      // Parse CSV
      const text = fileBuffer.toString("utf-8");
      const parsed = Papa.parse(text, { header: false });
      const rows = parsed.data as string[][];
      
      metadata.rows = rows.length;
      metadata.columns = rows[0]?.length || 0;
      
      // Convert to formatted text
      content = rows.map((row) => row.join(" | ")).join("\n");
    } else {
      // Parse Excel
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetNames = workbook.SheetNames;
      
      metadata.sheets = sheetNames;
      
      // Extract from all sheets
      const allContent = sheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        return `Sheet: ${sheetName}\n${csv}`;
      });
      
      content = allContent.join("\n---\n");
      metadata.rows = content.split("\n").length;
      metadata.columns = content.split("\n")[0]?.split(",").length || 0;
    }
  } catch (error) {
    console.error("[SpreadsheetExtractor] Error:", error);
    throw new Error("Failed to parse spreadsheet");
  }

  return { content, metadata };
}
