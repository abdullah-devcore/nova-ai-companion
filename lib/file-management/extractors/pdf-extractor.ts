import pdfParse from "pdf-parse";

export interface ExtractedContent {
  content: string;
  metadata: Record<string, any>;
}

export async function extractPDF(fileBuffer: Buffer): Promise<ExtractedContent> {
  const pdf = await pdfParse(fileBuffer);
  
  const content = pdf.text || "";
  const metadata = {
    pages: pdf.numpages,
    info: pdf.info,
    version: pdf.version,
  };

  return { content, metadata };
}
