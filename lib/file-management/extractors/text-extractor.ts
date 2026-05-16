export interface ExtractedContent {
  content: string;
  metadata: Record<string, any>;
}

export function extractText(fileBuffer: Buffer): ExtractedContent {
  const content = fileBuffer.toString("utf-8");
  
  const metadata = {
    lines: content.split("\n").length,
    characters: content.length,
    hasCode: content.includes("function") || content.includes("class") || content.includes("import"),
  };

  return { content, metadata };
}
