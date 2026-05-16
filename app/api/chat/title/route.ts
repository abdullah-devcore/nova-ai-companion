import { NextRequest, NextResponse } from "next/server";

const TITLE_GENERATION_PROMPT = `Based on the following conversation messages, generate a short, concise chat title (3-5 words max) that captures the main topic or intent.

Messages:
{messages}

Requirements:
- Be specific and descriptive
- Avoid generic titles like "Chat" or "Discussion"
- Use present tense when possible
- Keep it under 50 characters
- Make it actionable or topic-focused

Generate only the title, nothing else.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ title: "New Chat" });
    }

    // Extract first 3-5 messages for context
    const contextMessages = messages.slice(0, 5)
      .map((m: any) => `${m.role}: ${m.content.substring(0, 100)}`)
      .join("\n");

    const prompt = TITLE_GENERATION_PROMPT.replace("{messages}", contextMessages);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Nova AI Companion",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 20,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("[Title Generation] API error:", response.statusText);
      return NextResponse.json({ title: "New Chat" });
    }

    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim() || "New Chat";

    return NextResponse.json({ title });
  } catch (error) {
    console.error("[Title Generation] Error:", error);
    return NextResponse.json({ title: "New Chat" });
  }
}
