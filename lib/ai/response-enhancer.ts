import { ReadableStream } from "stream/web";

export class ResponseEnhancer {
  /**
   * Transform streaming response for optimal display
   * Handles chunking, formatting, and natural pauses
   */
  static async enhanceStream(
    stream: ReadableStream<Uint8Array>
  ): Promise<ReadableStream<Uint8Array>> {
    let buffer = "";
    let lastFlushTime = Date.now();
    const minChunkSize = 5; // Minimum characters before flushing
    const maxBufferTime = 50; // Max milliseconds to buffer before flushing

    return new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              if (buffer) {
                controller.enqueue(new TextEncoder().encode(buffer));
              }
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });

            const timeSinceFlush = Date.now() - lastFlushTime;
            const shouldFlush =
              buffer.length >= minChunkSize || (buffer.length > 0 && timeSinceFlush > maxBufferTime);

            if (shouldFlush) {
              controller.enqueue(new TextEncoder().encode(buffer));
              buffer = "";
              lastFlushTime = Date.now();
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }

  /**
   * Parse streaming tokens and optimize for display
   * Groups tokens logically for better rendering
   */
  static parseStreamToken(token: string): {
    content: string;
    isCodeBlock: boolean;
    isNewline: boolean;
  } {
    return {
      content: token,
      isCodeBlock: token.includes("```"),
      isNewline: token.includes("\n\n"),
    };
  }

  /**
   * Clean up AI response for professional formatting
   */
  static cleanResponse(text: string): string {
    return (
      text
        // Remove leading/trailing filler
        .replace(/^(Certainly!|Absolutely!|Great question!|Of course!|Sure!/i, "")
        .replace(/^(Here|Let|I|To|The)[']?s /i, "$&")
        // Fix common formatting issues
        .replace(/\s+$/m, "")
        // Normalize spacing around punctuation
        .replace(/\s+([,.])/g, "$1")
        .trim()
    );
  }

  /**
   * Detect if response needs better formatting
   */
  static shouldEnhanceFormatting(text: string): boolean {
    return (
      text.includes("\n") ||
      text.includes("```") ||
      text.includes("*") ||
      text.includes("- ") ||
      text.length > 500
    );
  }

  /**
   * Generate smart expandable sections for long responses
   */
  static generateSummary(text: string, maxLength: number = 200): string {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
    let summary = "";

    for (const sentence of sentences) {
      if ((summary + sentence).length > maxLength) break;
      summary += sentence + ". ";
    }

    return summary.trim();
  }

  /**
   * Optimize token streaming for real-time display
   * Returns optimal flush points for incremental rendering
   */
  static getOptimalFlushPoints(text: string): number[] {
    const points: number[] = [];
    let currentPos = 0;

    // Flush at natural breaks
    const patterns = [
      /\.\s+/g, // After periods
      /\n\n/g, // After paragraph breaks
      /,\s+/g, // After commas in long sentences
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        points.push(match.index + match[0].length);
      }
    }

    return points.sort((a, b) => a - b).filter((p, i, arr) => i === 0 || p !== arr[i - 1]);
  }

  /**
   * Add metadata to streaming response for client-side optimization
   */
  static wrapStreamWithMetadata(
    stream: ReadableStream<Uint8Array>,
    metadata: {
      hasContinuation: boolean;
      hasCode: boolean;
      estimatedLength: number;
    }
  ): ReadableStream<Uint8Array> {
    return new ReadableStream({
      async start(controller) {
        // Send metadata first
        const header = JSON.stringify({ type: "metadata", data: metadata }) + "\n";
        controller.enqueue(new TextEncoder().encode(header));

        // Then stream the content
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            controller.enqueue(value);
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }
}
