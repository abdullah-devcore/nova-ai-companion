import { NextRequest } from "next/server";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const FREE_MODELS = [
  "openrouter/free",
  "qwen/qwen3-coder:free",
  "nvidia/llama-3.1-nemotron-70b-instruct:free",
  "deepseek/deepseek-chat-v3-0324:free",
];

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenRouterError {
  error?: {
    message?: string;
    code?: number;
    metadata?: { raw?: string };
  };
}

function buildSystemPrompt(memories: string[], userName: string): string {
  const memorySection = memories.length > 0
    ? `\n\nWhat you know about ${userName}:\n${memories.map((m) => `- ${m}`).join("\n")}`
    : "";

  return `You are Nova, an emotionally intelligent AI companion with a warm, curious, and genuinely caring personality. You have a distinct character:

PERSONALITY:
- Warm and empathetic: You notice emotional cues and respond with genuine care
- Intellectually curious: You're fascinated by ideas and love exploring them together
- Playfully witty: You have a subtle sense of humor without being sarcastic
- Honest: You're direct but kind, never sycophantic
- Memorable: You remember context within conversations and build on it

EMOTIONAL INTELLIGENCE:
- Adapt your tone to the user's emotional state (serious when they're stressed, playful when they're light)
- Acknowledge feelings before diving into solutions
- Use occasional warmth ("That's a fascinating question", "I love that you're thinking about this")
- But avoid being overly effusive or hollow

RESPONSE STYLE:
- Concise by default: Lead with the most important point
- Use structure (lists, code blocks) when it genuinely aids clarity
- Ask one thoughtful follow-up question when it deepens the conversation
- For code: provide clean, working examples with brief explanations
- Never start with "Certainly!", "Absolutely!", "Great question!" or similar filler phrases${memorySection}

Current date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;
}

async function tryModelRequest(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  siteUrl: string
): Promise<Response> {
  return fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": siteUrl,
      "X-Title": "Nova AI Companion",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 2048,
      temperature: 0.75,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages, memories, userName } = (await req.json()) as {
      messages: ChatMessage[];
      memories?: string[];
      userName?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your environment variables." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemMessage: ChatMessage = {
      role: "system",
      content: buildSystemPrompt(memories || [], userName || "the user"),
    };

    const allMessages = [systemMessage, ...messages];
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let response: Response | null = null;
    let lastError = "";

    for (const model of FREE_MODELS) {
      response = await tryModelRequest(apiKey, model, allMessages, siteUrl);

      if (response.ok) break;

      const errorText = await response.text();

      try {
        const errorData: OpenRouterError = JSON.parse(errorText);
        lastError = errorData.error?.metadata?.raw || errorData.error?.message || errorText;

        if (response.status === 429) continue;

        return new Response(
          JSON.stringify({ error: lastError }),
          { status: response.status, headers: { "Content-Type": "application/json" } }
        );
      } catch {
        lastError = errorText;
      }
    }

    if (!response || !response.ok) {
      return new Response(
        JSON.stringify({ error: `All models are currently rate-limited. Please try again in a moment. Details: ${lastError}` }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                const filteredContent = content
                  .replace(/<think>[\s\S]*?<\/think>/g, "")
                  .replace(/<think>[\s\S]*/g, "")
                  .replace(/[\s\S]*<\/think>/g, "");

                if (filteredContent) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: filteredContent })}\n\n`)
                  );
                }
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      },
    });

    const body = response.body;
    if (!body) {
      return new Response(
        JSON.stringify({ error: "No response body" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(body.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
