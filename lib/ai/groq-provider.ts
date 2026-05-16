interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class GroqProvider {
  private apiKey: string;
  private apiUrl = "https://api.groq.com/openai/v1/chat/completions";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async streamChat(messages: ChatMessage[], systemPrompt: string): Promise<ReadableStream<string>> {
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
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} ${error}`);
    }

    return response.body || new ReadableStream();
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
