interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class GroqProvider {
  private apiKey: string;
  private apiUrl = "https://api.groq.com/openai/v1/chat/completions";

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("Groq API key is required");
    }
    this.apiKey = apiKey;
  }

  async streamChat(messages: ChatMessage[], systemPrompt: string): Promise<ReadableStream<Uint8Array>> {
    const allMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: allMessages,
        stream: true,
        max_tokens: 2048,
        temperature: 0.75,
        top_p: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Groq API error: ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage += ` - ${errorText.substring(0, 200)}`;
      }
      
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("Groq API returned empty stream");
    }

    return response.body;
  }

  async getStream(messages: ChatMessage[], systemPrompt: string): Promise<Response> {
    const stream = await this.streamChat(messages, systemPrompt);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }
}
