import Groq from "groq-sdk";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class GroqProvider {
  private client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  async streamChat(messages: ChatMessage[], systemPrompt: string): Promise<ReadableStream<string>> {
    const allMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages,
    ];

    const stream = await this.client.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: allMessages as Groq.Chat.ChatCompletionMessageParam[],
      stream: true,
      max_tokens: 2048,
      temperature: 0.75,
      top_p: 1,
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(new TextEncoder().encode(delta));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
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
